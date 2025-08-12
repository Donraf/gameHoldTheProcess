package repository

import (
	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/jmoiron/sqlx"
)

type User interface {
	CreateUser(user gameServer.User) (int, error)
	GetUser(login, password string) (gameServer.User, error)
	DeleteUser(id int) error
	UpdateUser(id int, input gameServer.UpdateUserInput) error
	GetAllUsers() ([]gameServer.User, error)
	GetOneUser(id int) (gameServer.User, error)
	GetUsersCount(input gameServer.GetUsersPageCountInput) (int, error)
}

type Chart interface {
}

type Point interface {
}

type Repository struct {
	User
	Chart
	Point
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{
		User: NewUserPostgres(db),
	}
}
