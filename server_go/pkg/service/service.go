package service

import (
	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/repository"
)

type User interface {
	CreateUser(user gameServer.User) (int, error)
	GenerateToken(login, password string) (string, error)
	ParseToken(token string) (*tokenClaims, error)
	RefreshToken(accessToken string) (string, error)
	DeleteUser(id int) error
	UpdateUser(id int, input gameServer.UpdateUserInput) error
	GetAllUsers() ([]gameServer.User, error)
	GetOneUser(id int) (gameServer.User, error)
}

type Chart interface {
}

type Point interface {
}

type Service struct {
	User
	Chart
	Point
}

func NewService(repo *repository.Repository) *Service {
	return &Service{
		User: NewUserService(repo.User),
	}
}
