package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"totp-auth-system/backend/internal/domain"
)

var (
	ErrTOTPAlreadyEnabled = errors.New("2FA already enabled")
	ErrTOTPNotSetup      = errors.New("2FA not set up yet")
)

type TOTPUsecase struct {
	userRepo UserRepository
	logRepo  LogRepository
	totp     TOTPManager
}

func NewTOTPUsecase(userRepo UserRepository, logRepo LogRepository, totp TOTPManager) *TOTPUsecase {
	return &TOTPUsecase{
		userRepo: userRepo,
		logRepo:  logRepo,
		totp:     totp,
	}
}

type SetupTOTPOutput struct {
	Secret    string `json:"secret"`
	QRCodeURL string `json:"qr_code_url"`
	ManualURI string `json:"manual_uri"`
}

func (uc *TOTPUsecase) Setup(ctx context.Context, userID uuid.UUID) (*SetupTOTPOutput, error) {
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user.TOTPEnabled {
		return nil, ErrTOTPAlreadyEnabled
	}
	secret, uri, err := uc.totp.GenerateSecret(user.Username)
	if err != nil {
		return nil, err
	}
	qrBase64, err := uc.totp.GenerateQRBase64(uri)
	if err != nil {
		return nil, err
	}
	user.TOTPSecret = &secret
	user.UpdatedAt = time.Now()
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}
	uc.log(ctx, &user.ID, "totp_setup", nil)
	return &SetupTOTPOutput{
		Secret:    secret,
		QRCodeURL: qrBase64,
		ManualURI: uri,
	}, nil
}

type EnableTOTPInput struct {
	UserID uuid.UUID
	Code   string
}

func (uc *TOTPUsecase) Enable(ctx context.Context, input EnableTOTPInput) error {
	user, err := uc.userRepo.GetByID(ctx, input.UserID)
	if err != nil {
		return err
	}
	if user.TOTPEnabled {
		return ErrTOTPAlreadyEnabled
	}
	if user.TOTPSecret == nil {
		return ErrTOTPNotSetup
	}
	if !uc.totp.ValidateCode(*user.TOTPSecret, input.Code) {
		uc.log(ctx, &user.ID, "totp_enable_failed", nil)
		return ErrInvalidTOTP
	}
	user.TOTPEnabled = true
	user.UpdatedAt = time.Now()
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return err
	}
	uc.log(ctx, &user.ID, "totp_enabled", nil)
	return nil
}

func (uc *TOTPUsecase) Disable(ctx context.Context, userID uuid.UUID) error {
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	user.TOTPSecret = nil
	user.TOTPEnabled = false
	user.UpdatedAt = time.Now()
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return err
	}
	uc.log(ctx, &user.ID, "totp_disabled", nil)
	return nil
}

func (uc *TOTPUsecase) GetStatus(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	return uc.userRepo.GetByID(ctx, userID)
}

func (uc *TOTPUsecase) log(ctx context.Context, userID *uuid.UUID, action string, details json.RawMessage) {
	if details == nil {
		details = json.RawMessage("{}")
	}
	ip, _ := ctx.Value("ip").(string)
	ua, _ := ctx.Value("user_agent").(string)
	log := &domain.AuditLog{
		ID:        uuid.New(),
		UserID:    userID,
		Action:    action,
		IPAddress: ip,
		UserAgent: ua,
		Details:   details,
		CreatedAt: time.Now(),
	}
	_ = uc.logRepo.Insert(ctx, log)
}
