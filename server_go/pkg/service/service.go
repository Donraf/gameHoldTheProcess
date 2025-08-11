package service

import "example.com/gameHoldTheProcessServer/pkg/repository"

type User interface {
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
	return &Service{}
}
