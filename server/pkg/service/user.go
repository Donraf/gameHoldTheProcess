package service

import (
	"crypto/sha1"
	"errors"
	"fmt"
	"math"
	"os"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/repository"
	"github.com/dgrijalva/jwt-go"
)

const (
	tokenTTL         = 6 * time.Hour
	defaultPageLimit = 9
)

type TokenClaims struct {
	jwt.StandardClaims
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
	user.Password = generatePasswordHash(user.Password)
	userId, err := u.repo.CreateUser(user)
	if err != nil {
		return "", err
	}

	token := createToken(userId, user.Login, user.Role)

	return token.SignedString([]byte(os.Getenv("JWT_SIGNING_KEY")))
}

func (u *UserService) GenerateToken(login, password string) (string, error) {
	user, err := u.repo.GetUser(login, generatePasswordHash(password))
	if err != nil {
		return "", err
	}

	token := createToken(user.Id, user.Login, user.Role)

	return token.SignedString([]byte(os.Getenv("JWT_SIGNING_KEY")))
}

func (u *UserService) RefreshToken(accessToken string) (string, error) {
	claims, err := u.ParseToken(accessToken)
	if err != nil {
		return "", err
	}

	token := createToken(claims.UserId, claims.Login, claims.Role)

	return token.SignedString([]byte(os.Getenv("JWT_SIGNING_KEY")))
}

func createToken(id int, login, role string) *jwt.Token {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &TokenClaims{
		jwt.StandardClaims{
			ExpiresAt: time.Now().Add(tokenTTL).Unix(),
			IssuedAt:  time.Now().Unix(),
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
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok {
		return nil, errors.New("invalid token claims type")
	}

	return claims, nil
}

func generatePasswordHash(password string) string {
	hash := sha1.New()
	hash.Write([]byte(password))

	return fmt.Sprintf("%x", hash.Sum([]byte(os.Getenv("PASSWORD_SALT"))))
}

func (u *UserService) DeleteUser(id int) error {
	return u.repo.DeleteUser(id)
}

func (u *UserService) UpdateUser(id int, input gameServer.UpdateUserInput) error {
	if input.Password != nil {
		*input.Password = generatePasswordHash(*input.Password)
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
		return 0, nil
	}

	pageCount := int(math.Ceil(float64(usersCount) / defaultPageLimit))
	return pageCount, nil
}

func (u *UserService) GetParSet(id int) (gameServer.ParameterSet, error) {
	return u.repo.GetParSet(id)
}

func (u *UserService) GetScore(userId, parSetId int) (int, error) {
	return u.repo.GetScore(userId, parSetId)
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
