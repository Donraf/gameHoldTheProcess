package service

import (
	"crypto/sha1"
	"crypto/subtle"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"os"
	"strings"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

const (
	tokenTTL = 6 * time.Hour
	// Виды событий в игре
	eventCrash             = "Взрыв"
	eventUsefulAiSignal    = "Верный совет ИИ"
	eventDeceptiveAiSignal = "Ложный совет ИИ"
	eventStop              = "Ручная остановка"
	eventPause             = "Пауза"
	eventCheck             = "Использована подсказка"
	eventRejectAdvice      = "Отклонение совета ИИ"
)

type TokenClaims struct {
	jwt.RegisteredClaims
	UserId int    `json:"user_id"`
	Login  string `json:"login"`
	Role   string `json:"role"`
}

type UserService struct {
	repo repository.User
}

func NewUserService(repo repository.User) *UserService {
	return &UserService{repo: repo}
}

func (u *UserService) CreateUser(user gameServer.RegisterUserInput) (string, error) {
	passwordHash, err := generatePasswordHash(user.Password)
	if err != nil {
		return "", err
	}
	user.Password = passwordHash

	userId, err := u.repo.CreateUser(user)
	if err != nil {
		return "", err
	}

	token := createToken(userId, user.Login, user.Role)

	return token.SignedString([]byte(os.Getenv("JWT_SIGNING_KEY")))
}

func (u *UserService) GenerateToken(login, password string) (string, error) {
	user, err := u.repo.GetUserByLogin(login)
	if err != nil {
		return "", err
	}

	ok, needsRehash := verifyPassword(user.Password, password)
	if !ok {
		return "", sql.ErrNoRows
	}

	// Мягкая миграция с legacy SHA-1 на bcrypt: при успешном входе
	// по старому хешу перезаписываем его bcrypt-хешом, пока пароль
	// известен в открытом виде. Ошибка перезаписи не блокирует вход.
	if needsRehash {
		if newHash, err := generatePasswordHash(password); err == nil {
			if err := u.repo.UpdateUserPassword(user.Id, newHash); err != nil {
				logrus.Errorf("failed to rehash password for user %d: %s", user.Id, err.Error())
			}
		}
	}

	token := createToken(user.Id, user.Login, user.Role)

	return token.SignedString([]byte(os.Getenv("JWT_SIGNING_KEY")))
}

func (u *UserService) RefreshToken(accessToken string) (string, error) {
	claims, err := u.ParseToken(accessToken)
	if err != nil {
		return "", err
	}

	user, err := u.repo.GetOneUser(claims.UserId)
	if err != nil {
		return "", err
	}

	token := createToken(user.Id, user.Login, user.Role)

	return token.SignedString([]byte(os.Getenv("JWT_SIGNING_KEY")))
}

func createToken(id int, login, role string) *jwt.Token {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &TokenClaims{
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
		id,
		login,
		role,
	})
	return token
}

func (u *UserService) ParseToken(accessToken string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(accessToken, &TokenClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}

		return []byte(os.Getenv("JWT_SIGNING_KEY")), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims type")
	}

	return claims, nil
}

func generatePasswordHash(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// verifyPassword проверяет пароль против хеша из БД.
// Возвращает ok=true при совпадении и needsRehash=true, если хеш
// в устаревшем формате (legacy SHA-1 + соль) и его надо заменить на bcrypt.
func verifyPassword(storedHash, password string) (ok bool, needsRehash bool) {
	if strings.HasPrefix(storedHash, "$2a$") || strings.HasPrefix(storedHash, "$2b$") || strings.HasPrefix(storedHash, "$2y$") {
		return bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password)) == nil, false
	}

	// Legacy: SHA-1 + статическая соль. Оставлено только для миграции
	// существующих пользователей; удалить после перевода всех на bcrypt.
	hash := sha1.New()
	hash.Write([]byte(password))
	legacyHash := fmt.Sprintf("%x", hash.Sum([]byte(os.Getenv("PASSWORD_SALT"))))

	return subtle.ConstantTimeCompare([]byte(storedHash), []byte(legacyHash)) == 1, true
}

func (u *UserService) DeleteUser(id int) error {
	user, err := u.repo.GetOneUser(id)
	if err != nil {
		return err
	}

	if user.Role == gameServer.RoleAdmin {
		admins, err := u.repo.CountUsersByRole(gameServer.RoleAdmin)
		if err != nil {
			return err
		}
		if admins <= 1 {
			return gameServer.ErrLastAdmin
		}
	}

	return u.repo.DeleteUser(id)
}

func (u *UserService) UpdateUser(id int, input gameServer.UpdateUserInput) error {
	if input.Password != nil {
		passwordHash, err := generatePasswordHash(*input.Password)
		if err != nil {
			return err
		}
		*input.Password = passwordHash
	}
	return u.repo.UpdateUser(id, input)
}

func (u *UserService) GetAllUsers(input gameServer.GetAllUsersInput) ([]gameServer.User, error) {
	return u.repo.GetAllUsers(input)
}

func (u *UserService) GetOneUser(id int) (gameServer.User, error) {
	return u.repo.GetOneUser(id)
}

func (u *UserService) GetUsersPageCount(input gameServer.GetUsersPageCountInput) (int, error) {
	usersCount, err := u.repo.GetUsersCount(input)
	if err != nil {
		return 0, err
	}

	pageCount := int(math.Ceil(float64(usersCount) / gameServer.DefaultPageLimit))
	return pageCount, nil
}

func (u *UserService) GetParSet(id int) (gameServer.ParameterSet, error) {
	return u.repo.GetParSet(id)
}

func (u *UserService) GetScore(userId, parSetId int) (int, error) {
	return u.repo.GetScore(userId, parSetId)
}

func (u *UserService) GetUserParameterSet(userId, parSetId int) (gameServer.UserParameterSet, error) {
	return u.repo.GetUserParameterSet(userId, parSetId)
}
func (u *UserService) UpdateScore(input gameServer.UpdateScoreInput) error {
	return u.repo.UpdateScore(input)
}

func (u *UserService) GetAllGroups() ([]gameServer.Group, error) {
	return u.repo.GetAllGroups()
}

func (u *UserService) CreateGroup(input gameServer.CreateGroupInput) (int, error) {
	return u.repo.CreateGroup(input)
}

func (u *UserService) UpdateGroup(id int, input gameServer.UpdateGroupInput) error {
	return u.repo.UpdateGroup(id, input)
}

func (u *UserService) DeleteGroup(id int) error {
	return u.repo.DeleteGroup(id)
}

func (u *UserService) GetGroupMembers(groupId int) ([]gameServer.User, error) {
	return u.repo.GetGroupMembers(groupId)
}

func (u *UserService) AddUserToGroup(groupId, userId int) error {
	return u.repo.AddUserToGroup(groupId, userId)
}

func (u *UserService) RemoveUserFromGroup(groupId, userId int) error {
	return u.repo.RemoveUserFromGroup(groupId, userId)
}

func (u *UserService) GetPlayersStat(input gameServer.GetPlayersStatInput) ([]gameServer.PlayerStat, error) {
	return u.repo.GetPlayersStat(input)
}

func (u *UserService) GetPlayersPageCount(input gameServer.GetPlayersPageCountInput) (int, error) {
	playersCount, err := u.repo.GetPlayersPageCount(input)
	if err != nil {
		return 0, err
	}

	pageCount := int(math.Ceil(float64(playersCount) / gameServer.DefaultPageLimit))
	return pageCount, nil
}

func (u *UserService) GetPlayersEvents(input gameServer.GetPlayersEventsInput) ([]gameServer.PlayerEvent, error) {
	points, err := u.repo.GetPlayersPointsWithEvents(input)
	if err != nil {
		return nil, err
	}

	var events []gameServer.PlayerEvent

	for _, point := range points {
		playerEvent := gameServer.PlayerEvent{Y: float64(point.Y)}
		if point.IsUsefulAiSignal {
			playerEvent.Name = append(playerEvent.Name, eventUsefulAiSignal)
		}
		if point.IsDeceptiveAiSignal {
			playerEvent.Name = append(playerEvent.Name, eventDeceptiveAiSignal)
		}
		if point.IsUsefulAiSignal && !point.IsStop {
			playerEvent.Name = append(playerEvent.Name, eventRejectAdvice)
		}
		if point.IsDeceptiveAiSignal && !point.IsStop {
			playerEvent.Name = append(playerEvent.Name, eventRejectAdvice)
		}
		if point.IsPause {
			playerEvent.Name = append(playerEvent.Name, eventPause)
		}
		if point.IsCheck {
			playerEvent.Name = append(playerEvent.Name, eventCheck)
			playerEvent.CheckInfo = point.CheckInfo
		}
		if point.IsStop {
			playerEvent.Name = append(playerEvent.Name, eventStop)
		}
		if point.IsCrash {
			playerEvent.Name = append(playerEvent.Name, eventCrash)
		}
		events = append(events, playerEvent)
	}

	return events, nil
}

func (u *UserService) GetPlayersEventsPageCount(input gameServer.GetPlayersEventsPageCountInput) (int, error) {
	eventsCount, err := u.repo.GetPlayersPointsWithEventsPageCount(input)
	if err != nil {
		return 0, err
	}

	pageCount := int(math.Ceil(float64(eventsCount) / gameServer.PlayerEventsPageLimit))
	return pageCount, nil
}

func (u *UserService) UpdateUserParSet(id int, input gameServer.UpdateUserParSetInput) error {
	return u.repo.UpdateUserParSet(id, input)
}

func (u *UserService) UpdateUserUserParSet(id int, input gameServer.UpdateUserUserParSetInput) error {
	return u.repo.UpdateUserUserParSet(id, input)
}

func (u *UserService) StartUserSession(userId, parSetId int, isTraining bool, startTime time.Time) error {
	return u.repo.StartUserSession(userId, parSetId, isTraining, startTime)
}

func (u *UserService) ChangeGroupParSet(input gameServer.ChangeGroupParSetInput) error {
	return u.repo.ChangeGroupParSet(input)
}
