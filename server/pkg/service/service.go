package service

import (
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/repository"
)

type User interface {
	CreateUser(user gameServer.RegisterUserInput) (string, error)
	GenerateToken(login, password string) (string, error)
	ParseToken(token string) (*TokenClaims, error)
	RefreshToken(accessToken string) (string, error)
	DeleteUser(id int) error
	UpdateUser(id int, input gameServer.UpdateUserInput) error
	GetAllUsers(input gameServer.GetAllUsersInput) ([]gameServer.User, error)
	GetOneUser(id int) (gameServer.User, error)
	GetUsersPageCount(input gameServer.GetUsersPageCountInput) (int, error)
	GetParSet(id int) (gameServer.ParameterSet, error)
	GetScore(userId, parSetId int) (int, error)
	GetUserParameterSet(userId, parSetId int) (gameServer.UserParameterSet, error)
	UpdateScore(input gameServer.UpdateScoreInput) error
	GetAllGroups() ([]gameServer.Group, error)
	CreateGroup(input gameServer.CreateGroupInput) (int, error)
	UpdateGroup(id int, input gameServer.UpdateGroupInput) error
	DeleteGroup(id int) error
	GetGroupMembers(groupId int) ([]gameServer.User, error)
	AddUserToGroup(groupId, userId int) error
	RemoveUserFromGroup(groupId, userId int) error
	GetPlayersStat(input gameServer.GetPlayersStatInput) ([]gameServer.PlayerStat, error)
	GetPlayersPageCount(input gameServer.GetPlayersPageCountInput) (int, error)
	GetPlayersEvents(input gameServer.GetPlayersEventsInput) ([]gameServer.PlayerEvent, error)
	GetPlayersEventsPageCount(input gameServer.GetPlayersEventsPageCountInput) (int, error)
	UpdateUserParSet(id int, input gameServer.UpdateUserParSetInput) error
	UpdateUserUserParSet(id int, input gameServer.UpdateUserUserParSetInput) error
	StartUserSession(userId, parSetId int, isTraining bool, startTime time.Time) error
	ChangeGroupParSet(input gameServer.ChangeGroupParSetInput) error
}

type Chart interface {
	CreateChart(chart gameServer.CreateChartInput) (int, error)
	GetOneChart(id int) (gameServer.Chart, error)
	GetChartsPageCount(input gameServer.GetChartsPageCountInput) (int, error)
	GetChartsCount(input gameServer.GetChartsCountInput) (int, error)
	GetAllCharts(input gameServer.GetAllChartsInput) ([]gameServer.Chart, error)
	DeleteChart(id int) error
	GetAllParSets(input gameServer.GetAllParSetsInput) ([]gameServer.ParameterSet, error)
	GetParSetsPageCount() (int, error)
	CreateParSet(input gameServer.CreateParSetInput) (int, error)
	UpdateParSet(id int, input gameServer.CreateParSetInput) error
	DeleteParSet(id int) error
}

type Point interface {
	CreatePoint(input gameServer.Point) (int, error)
	CreatePoints(points []gameServer.Point) error
	GetOnePoint(id int) (gameServer.Point, error)
	GetAllPointsById(id int) ([]gameServer.Point, error)
	DeletePoint(id int) error
	GetCsvOfPoints() (string, error)
}

type Statistics interface {
	ComputeStatistics(input gameServer.ComputeStatisticsInput) (gameServer.Statistics, error)
	GetStatistics(userId, parSetId int) (gameServer.Statistics, error)
}

type Test interface {
	GetAllTests() ([]gameServer.Test, error)
	GetSessionStatus(userId int) (gameServer.TestSessionStatus, error)
	SubmitResult(userId int, input gameServer.SubmitTestResultInput) (int, error)
	CreateTest(input gameServer.CreateTestInput) (int, error)
	UpdateTest(id int, input gameServer.UpdateTestInput) error
	DeleteTest(id int) error
	GetUserResults(userId int) ([]gameServer.TestResult, error)
	GetUserResultsWithTests(userId int) ([]gameServer.TestResultWithTest, error)
}

type Service struct {
	User
	Chart
	Point
	Statistics
	Test
	StatisticsScheduler *StatisticsScheduler
}

func NewService(repo *repository.Repository) *Service {
	statisticsService := NewStatisticsService(repo.Statistics)
	return &Service{
		User:                NewUserService(repo.User),
		Chart:               NewChartService(repo.Chart),
		Point:               NewPointService(repo.Point),
		Statistics:          statisticsService,
		Test:                NewTestService(repo.Test),
		StatisticsScheduler: NewStatisticsScheduler(statisticsService, 30*time.Second),
	}
}
