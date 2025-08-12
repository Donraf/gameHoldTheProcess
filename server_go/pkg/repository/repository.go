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
	CreateChart(chart gameServer.CreateChartInput) (int, error)
	GetOneChart(id int) (gameServer.Chart, error)
	GetChartsCount(input gameServer.GetChartsPageCountInput) (int, error)
	GetAllCharts(input gameServer.GetAllChartsInput) ([]gameServer.Chart, error)
	DeleteChart(id int) error
}

type Point interface {
	CreatePoint(input gameServer.Point) (int, error)
	GetOnePoint(id int) (gameServer.Point, error)
	GetAllPointsById(id int) ([]gameServer.Point, error)
	DeletePoint(id int) error
	GetAllPointsForCSV() ([]gameServer.PointForCSV, error)
}

type Repository struct {
	User
	Chart
	Point
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{
		User:  NewUserPostgres(db),
		Chart: NewChartPostgres(db),
		Point: NewPointPostgres(db),
	}
}
