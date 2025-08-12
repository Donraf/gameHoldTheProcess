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
	GetAllUsers(input gameServer.GetAllUsersInput) ([]gameServer.User, error)
	GetOneUser(id int) (gameServer.User, error)
	GetUsersPageCount(input gameServer.GetUsersPageCountInput) (int, error)
	GetParSet(id int) (gameServer.ParameterSet, error)
	GetScore(userId, parSetId int) (int, error)
	UpdateScore(input gameServer.UpdateScoreInput) error
}

type Chart interface {
	CreateChart(chart gameServer.CreateChartInput) (int, error)
	GetOneChart(id int) (gameServer.Chart, error)
	GetChartsPageCount(input gameServer.GetChartsPageCountInput) (int, error)
	GetChartsCount(input gameServer.GetChartsCountInput) (int, error)
	GetAllCharts(input gameServer.GetAllChartsInput) ([]gameServer.Chart, error)
	DeleteChart(id int) error
}

type Point interface {
	CreatePoint(input gameServer.Point) (int, error)
	GetOnePoint(id int) (gameServer.Point, error)
	GetAllPointsById(id int) ([]gameServer.Point, error)
	DeletePoint(id int) error
	GetCsvOfPoints() (string, error)
}

type Service struct {
	User
	Chart
	Point
}

func NewService(repo *repository.Repository) *Service {
	return &Service{
		User:  NewUserService(repo.User),
		Chart: NewChartService(repo.Chart),
		Point: NewPointService(repo.Point),
	}
}
