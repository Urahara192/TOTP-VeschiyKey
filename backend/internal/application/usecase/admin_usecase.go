package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"totp-auth-system/backend/internal/domain"
)

type AdminUsecase struct {
	userRepo UserRepository
	deviceRepo DeviceRepository
	logRepo  LogRepository
	totp     TOTPManager
}

func NewAdminUsecase(
	userRepo UserRepository,
	deviceRepo DeviceRepository,
	logRepo LogRepository,
	totp TOTPManager,
) *AdminUsecase {
	return &AdminUsecase{
		userRepo:   userRepo,
		deviceRepo: deviceRepo,
		logRepo:    logRepo,
		totp:       totp,
	}
}

type ListUsersOutput struct {
	Users []*domain.User `json:"users"`
	Total int           `json:"total"`
}

func (uc *AdminUsecase) ListUsers(ctx context.Context, page, pageSize int) (*ListUsersOutput, error) {
	offset := (page - 1) * pageSize
	users, total, err := uc.userRepo.List(ctx, offset, pageSize)
	if err != nil {
		return nil, err
	}
	if users == nil {
		users = []*domain.User{}
	}
	return &ListUsersOutput{Users: users, Total: total}, nil
}

type ChangeRoleInput struct {
	TargetUserID uuid.UUID
	NewRole      domain.Role
	ActorID      uuid.UUID
}

func (uc *AdminUsecase) ChangeRole(ctx context.Context, input ChangeRoleInput) error {
	user, err := uc.userRepo.GetByID(ctx, input.TargetUserID)
	if err != nil {
		return err
	}
	user.Role = input.NewRole
	user.UpdatedAt = time.Now()
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return err
	}
	details, _ := json.Marshal(map[string]string{
		"new_role": string(input.NewRole),
		"by":       input.ActorID.String(),
	})
	uc.log(ctx, &input.TargetUserID, "role_change", details)
	return nil
}

func (uc *AdminUsecase) Reset2FA(ctx context.Context, targetUserID, actorID uuid.UUID) error {
	user, err := uc.userRepo.GetByID(ctx, targetUserID)
	if err != nil {
		return err
	}
	user.TOTPSecret = nil
	user.TOTPEnabled = false
	user.UpdatedAt = time.Now()
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return err
	}
	_ = uc.deviceRepo.DeleteByUserID(ctx, targetUserID)
	details, _ := json.Marshal(map[string]string{
		"reset_by": actorID.String(),
	})
	uc.log(ctx, &targetUserID, "totp_reset", details)
	return nil
}

type GetLogsInput struct {
	Page     int
	PageSize int
	UserID   *uuid.UUID
}

type GetLogsOutput struct {
	Logs  []*domain.AuditLog `json:"logs"`
	Total int               `json:"total"`
}

func (uc *AdminUsecase) GetLogs(ctx context.Context, input GetLogsInput) (*GetLogsOutput, error) {
	offset := (input.Page - 1) * input.PageSize
	if input.UserID != nil {
		logs, err := uc.logRepo.ListByUser(ctx, *input.UserID, offset, input.PageSize)
		if err != nil {
			return nil, err
		}
		if logs == nil {
			logs = []*domain.AuditLog{}
		}
		return &GetLogsOutput{Logs: logs, Total: len(logs)}, nil
	}
	logs, total, err := uc.logRepo.ListAll(ctx, offset, input.PageSize)
	if err != nil {
		return nil, err
	}
	if logs == nil {
		logs = []*domain.AuditLog{}
	}
	return &GetLogsOutput{Logs: logs, Total: total}, nil
}

func (uc *AdminUsecase) log(ctx context.Context, userID *uuid.UUID, action string, details json.RawMessage) {
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
