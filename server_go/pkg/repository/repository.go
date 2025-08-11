package repository

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

func NewRepository() *Repository {
	return &Repository{}
}
