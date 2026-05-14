package usecase

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"totp-auth-system/backend/internal/domain"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotFound       = errors.New("user not found")
	ErrUsernameTaken      = errors.New("username already taken")
	ErrEmailTaken         = errors.New("email already taken")
	ErrTOTPNotEnabled     = errors.New("2FA not enabled")
	ErrTOTPRequired       = errors.New("2FA verification required")
	ErrInvalidTOTP        = errors.New("invalid TOTP code")
)

type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	GetByUsername(ctx context.Context, username string) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, offset, limit int) ([]*domain.User, int, error)
}

type DeviceRepository interface {
	Create(ctx context.Context, device *domain.TrustedDevice) error
	FindByFingerprint(ctx context.Context, userID uuid.UUID, fingerprint string) (*domain.TrustedDevice, error)
	UpdateTrust(ctx context.Context, id uuid.UUID, trustedUntil time.Time) error
	DeleteByUserID(ctx context.Context, userID uuid.UUID) error
}

type LogRepository interface {
	Insert(ctx context.Context, log *domain.AuditLog) error
	ListByUser(ctx context.Context, userID uuid.UUID, offset, limit int) ([]*domain.AuditLog, error)
	ListAll(ctx context.Context, offset, limit int) ([]*domain.AuditLog, int, error)
}

type PasswordHasher interface {
	Hash(password string) (string, error)
	Check(password, hash string) bool
}

type TokenManager interface {
	GenerateAccessToken(userID uuid.UUID, username string, role string) (string, error)
	GenerateRefreshToken(userID uuid.UUID) (string, error)
	ValidateAccessToken(tokenString string) (userID string, username string, role string, err error)
	ValidateRefreshToken(tokenString string) (string, error)
}

type TOTPManager interface {
	GenerateSecret(username string) (secret string, uri string, err error)
	GenerateQRBase64(uri string) (string, error)
	ValidateCode(secret, code string) bool
}

type AuthUsecase struct {
	userRepo   UserRepository
	deviceRepo DeviceRepository
	logRepo    LogRepository
	hasher     PasswordHasher
	tokens     TokenManager
	totp       TOTPManager
	trustTTL   time.Duration
}

func NewAuthUsecase(
	userRepo UserRepository,
	deviceRepo DeviceRepository,
	logRepo LogRepository,
	hasher PasswordHasher,
	tokens TokenManager,
	totp TOTPManager,
	trustTTL time.Duration,
) *AuthUsecase {
	return &AuthUsecase{
		userRepo:   userRepo,
		deviceRepo: deviceRepo,
		logRepo:    logRepo,
		hasher:     hasher,
		tokens:     tokens,
		totp:       totp,
		trustTTL:   trustTTL,
	}
}

type RegisterInput struct {
	Username  string
	Email     string
	Password  string
	IP        string
	UserAgent string
}

type RegisterOutput struct {
	User domain.User
}

func (uc *AuthUsecase) Register(ctx context.Context, input RegisterInput) (*RegisterOutput, error) {
	if existing, _ := uc.userRepo.GetByUsername(ctx, input.Username); existing != nil {
		return nil, ErrUsernameTaken
	}
	if existing, _ := uc.userRepo.GetByEmail(ctx, input.Email); existing != nil {
		return nil, ErrEmailTaken
	}
	hash, err := uc.hasher.Hash(input.Password)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	role := domain.RoleEmployee
	user := &domain.User{
		ID:           uuid.New(),
		Username:     input.Username,
		Email:        input.Email,
		PasswordHash: hash,
		Role:         role,
		TOTPEnabled:  false,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}
	uc.log(ctx, &user.ID, "register", nil, input.IP, input.UserAgent)
	return &RegisterOutput{User: *user}, nil
}

type LoginInput struct {
	Username string
	Password string
	IP       string
	UserAgent string
}

type LoginOutput struct {
	Requires2FA bool
	AccessToken  string
	RefreshToken string
	User        *domain.User
}

func (uc *AuthUsecase) Login(ctx context.Context, input LoginInput) (*LoginOutput, error) {
	user, err := uc.userRepo.GetByUsername(ctx, input.Username)
	if err != nil {
		uc.log(ctx, nil, "login_failed", json.RawMessage(`{"reason":"user_not_found","username":"`+input.Username+`"}`), input.IP, input.UserAgent)
		return nil, ErrInvalidCredentials
	}
	if !uc.hasher.Check(input.Password, user.PasswordHash) {
		uc.log(ctx, &user.ID, "login_failed", json.RawMessage(`{"reason":"wrong_password"}`), input.IP, input.UserAgent)
		return nil, ErrInvalidCredentials
	}
	if user.TOTPEnabled {
		fingerprint := deviceFingerprint(input.IP, input.UserAgent)
		trusted, _ := uc.deviceRepo.FindByFingerprint(ctx, user.ID, fingerprint)
		if trusted != nil {
			tokens, err := uc.generateTokens(user)
			if err != nil {
				return nil, err
			}
			uc.log(ctx, &user.ID, "login_trusted", nil, input.IP, input.UserAgent)
			return &LoginOutput{
				Requires2FA:  false,
				AccessToken:  tokens.AccessToken,
				RefreshToken: tokens.RefreshToken,
				User:         user,
			}, nil
		}
		uc.log(ctx, &user.ID, "login_2fa_required", nil, input.IP, input.UserAgent)
		return &LoginOutput{Requires2FA: true, User: user}, nil
	}
	tokens, err := uc.generateTokens(user)
	if err != nil {
		return nil, err
	}
	uc.log(ctx, &user.ID, "login", nil, input.IP, input.UserAgent)
	return &LoginOutput{
		Requires2FA:  false,
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		User:         user,
	}, nil
}

type Verify2FAInput struct {
	Username  string
	Code      string
	IP        string
	UserAgent string
	TrustDevice bool
}

type Verify2FAOutput struct {
	AccessToken  string
	RefreshToken string
}

func (uc *AuthUsecase) Verify2FA(ctx context.Context, input Verify2FAInput) (*Verify2FAOutput, error) {
	user, err := uc.userRepo.GetByUsername(ctx, input.Username)
	if err != nil {
		return nil, ErrUserNotFound
	}
	if !user.TOTPEnabled || user.TOTPSecret == nil {
		return nil, ErrTOTPNotEnabled
	}
	if !uc.totp.ValidateCode(*user.TOTPSecret, input.Code) {
		uc.log(ctx, &user.ID, "verify_2fa_failed", nil, input.IP, input.UserAgent)
		return nil, ErrInvalidTOTP
	}
	if input.TrustDevice {
		fingerprint := deviceFingerprint(input.IP, input.UserAgent)
		device := &domain.TrustedDevice{
			ID:                uuid.New(),
			UserID:            user.ID,
			IPAddress:         input.IP,
			UserAgent:         input.UserAgent,
			DeviceFingerprint: fingerprint,
			TrustedUntil:      time.Now().Add(uc.trustTTL),
			CreatedAt:         time.Now(),
		}
		_ = uc.deviceRepo.Create(ctx, device)
	}
	tokens, err := uc.generateTokens(user)
	if err != nil {
		return nil, err
	}
	uc.log(ctx, &user.ID, "login_2fa", nil, input.IP, input.UserAgent)
	return &Verify2FAOutput{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	}, nil
}

type RefreshOutput struct {
	AccessToken  string
	RefreshToken string
}

func (uc *AuthUsecase) Refresh(ctx context.Context, refreshToken string) (*RefreshOutput, error) {
	subject, err := uc.tokens.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}
	userID, err := uuid.Parse(subject)
	if err != nil {
		return nil, errors.New("invalid token subject")
	}
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, ErrUserNotFound
	}
	tokens, err := uc.generateTokens(user)
	if err != nil {
		return nil, err
	}
	return &RefreshOutput{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	}, nil
}

type tokenPair struct {
	AccessToken  string
	RefreshToken string
}

func (uc *AuthUsecase) generateTokens(user *domain.User) (*tokenPair, error) {
	accessToken, err := uc.tokens.GenerateAccessToken(user.ID, user.Username, string(user.Role))
	if err != nil {
		return nil, err
	}
	refreshToken, err := uc.tokens.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}
	return &tokenPair{AccessToken: accessToken, RefreshToken: refreshToken}, nil
}

func (uc *AuthUsecase) GetProfile(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	return uc.userRepo.GetByID(ctx, userID)
}

type UpdateProfileInput struct {
	UserID     uuid.UUID
	Email      *string
	LastName   *string
	FirstName  *string
	MiddleName *string
}

func (uc *AuthUsecase) UpdateProfile(ctx context.Context, input UpdateProfileInput) error {
	user, err := uc.userRepo.GetByID(ctx, input.UserID)
	if err != nil {
		return err
	}
	if input.Email != nil {
		if *input.Email != user.Email {
			if existing, _ := uc.userRepo.GetByEmail(ctx, *input.Email); existing != nil {
				return ErrEmailTaken
			}
		}
		user.Email = *input.Email
	}
	if input.LastName != nil {
		user.LastName = *input.LastName
	}
	if input.FirstName != nil {
		user.FirstName = *input.FirstName
	}
	if input.MiddleName != nil {
		user.MiddleName = *input.MiddleName
	}
	user.UpdatedAt = time.Now()
	return uc.userRepo.Update(ctx, user)
}

func (uc *AuthUsecase) log(ctx context.Context, userID *uuid.UUID, action string, details json.RawMessage, ip, userAgent string) {
	if details == nil {
		details = json.RawMessage("{}")
	}
	log := &domain.AuditLog{
		ID:        uuid.New(),
		UserID:    userID,
		Action:    action,
		IPAddress: ip,
		UserAgent: userAgent,
		Details:   details,
		CreatedAt: time.Now(),
	}
	_ = uc.logRepo.Insert(ctx, log)
}

func deviceFingerprint(ip, userAgent string) string {
	h := sha256.Sum256([]byte(ip + userAgent))
	return fmt.Sprintf("%x", h)
}
