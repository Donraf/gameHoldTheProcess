package repository

import (
	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/jmoiron/sqlx"
)

type User interface {
	CreateUser(user gameServer.User) (int, error)
	GetUser(login, password string) (gameServer.User, error)
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
