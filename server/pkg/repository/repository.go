package repository

import (
	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/jmoiron/sqlx"
)

type User interface {
	CreateUser(user gameServer.RegisterUserInput) (int, error)
	GetUser(login, password string) (gameServer.User, error)
	DeleteUser(id int) error
	UpdateUser(id int, input gameServer.UpdateUserInput) error
	GetAllUsers(input gameServer.GetAllUsersInput) ([]gameServer.User, error)
	GetOneUser(id int) (gameServer.User, error)
	GetUsersCount(input gameServer.GetUsersPageCountInput) (int, error)
	GetParSet(id int) (gameServer.ParameterSet, error)
	GetScore(userId, parSetId int) (int, error)
	UpdateScore(input gameServer.UpdateScoreInput) error
	GetAllGroups() ([]gameServer.Group, error)
	CreateGroup(input gameServer.CreateGroupInput) (int, error)
	GetPlayersStat(input gameServer.GetPlayersStatInput) ([]gameServer.PlayerStat, error)
	GetPlayersPageCount(input gameServer.GetPlayersPageCountInput) (int, error)
	GetPlayersPointsWithEvents(input gameServer.GetPlayersEventsInput) ([]gameServer.Point, error)
	GetPlayersPointsWithEventsPageCount(input gameServer.GetPlayersEventsPageCountInput) (int, error)
	UpdateUserParSet(id int, input gameServer.UpdateUserParSetInput) error
}

type Chart interface {
	CreateChart(chart gameServer.CreateChartInput) (int, error)
	GetOneChart(id int) (gameServer.Chart, error)
	GetChartsCount(input gameServer.GetChartsPageCountInput) (int, error)
	GetAllCharts(input gameServer.GetAllChartsInput) ([]gameServer.Chart, error)
	DeleteChart(id int) error
	GetAllParSets(input gameServer.GetAllParSetsInput) ([]gameServer.ParameterSet, error)
	GetParSetsCount() (int, error)
	CreateParSet(input gameServer.CreateParSetInput) (int, error)
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
