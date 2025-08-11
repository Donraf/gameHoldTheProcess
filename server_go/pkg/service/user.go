package service

import (
	"crypto/sha1"
	"errors"
	"fmt"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/repository"
	"github.com/dgrijalva/jwt-go"
)

const (
	salt       = "asfawgredfghreas12edda"
	signingKey = "peopfawd2enfpolw435sda"
	tokenTTL   = 6 * time.Hour
)

type tokenClaims struct {
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

func (u *UserService) CreateUser(user gameServer.User) (int, error) {
	user.Password = generatePasswordHash(user.Password)
	return u.repo.CreateUser(user)
}

func (u *UserService) GenerateToken(login, password string) (string, error) {
	user, err := u.repo.GetUser(login, generatePasswordHash(password))
	if err != nil {
		return "", err
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &tokenClaims{
		jwt.StandardClaims{
			ExpiresAt: time.Now().Add(tokenTTL).Unix(),
			IssuedAt:  time.Now().Unix(),
		},
		user.Id,
		user.Login,
		user.Role,
	})

	return token.SignedString([]byte(signingKey))
}

func (u *UserService) ParseToken(accessToken string) (int, error) {
	token, err := jwt.ParseWithClaims(accessToken, &tokenClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}

		return []byte(signingKey), nil
	})

	if err != nil {
		return 0, err
	}

	claims, ok := token.Claims.(*tokenClaims)
	if !ok {
		return 0, errors.New("invalid token claims type")
	}

	return claims.UserId, nil
}

func generatePasswordHash(password string) string {
	hash := sha1.New()
	hash.Write([]byte(password))

	return fmt.Sprintf("%x", hash.Sum([]byte(salt)))
}
