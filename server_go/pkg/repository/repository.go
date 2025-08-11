package repository

import "github.com/jmoiron/sqlx"

type User interface {
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
	return &Repository{}
}
