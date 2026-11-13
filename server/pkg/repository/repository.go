package repository

import (
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/jmoiron/sqlx"
)

type User interface {
	CreateUser(user gameServer.RegisterUserInput) (int, error)
	GetUserByLogin(login string) (gameServer.User, error)
	UpdateUserPassword(userId int, passwordHash string) error
	DeleteUser(id int) error
	CountUsersByRole(role string) (int, error)
	UpdateUser(id int, input gameServer.UpdateUserInput) error
	GetAllUsers(input gameServer.GetAllUsersInput) ([]gameServer.User, error)
	GetOneUser(id int) (gameServer.User, error)
	GetUsersCount(input gameServer.GetUsersPageCountInput) (int, error)
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
	GetPlayersPointsWithEvents(input gameServer.GetPlayersEventsInput) ([]gameServer.Point, error)
	GetPlayersPointsWithEventsPageCount(input gameServer.GetPlayersEventsPageCountInput) (int, error)
	UpdateUserParSet(id int, input gameServer.UpdateUserParSetInput) error
	UpdateUserUserParSet(id int, input gameServer.UpdateUserUserParSetInput) error
	StartUserSession(userId, parSetId int, isTraining bool, startTime time.Time) error
	ChangeGroupParSet(input gameServer.ChangeGroupParSetInput) error
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
	UpdateParSet(id int, input gameServer.CreateParSetInput) error
	DeleteParSet(id int) error
}

type Point interface {
	CreatePoint(input gameServer.Point) (int, error)
	CreatePoints(points []gameServer.Point) error
	GetOnePoint(id int) (gameServer.Point, error)
	GetAllPointsById(id int) ([]gameServer.Point, error)
	DeletePoint(id int) error
	GetAllPointsForCSV() ([]gameServer.PointForCSV, error)
}

type Statistics interface {
	CountGames(input gameServer.ComputeStatisticsInput) (int, error)
	CountStops(input gameServer.ComputeStatisticsInput) (int, error)
	CountCrashes(input gameServer.ComputeStatisticsInput) (int, error)
	GetYStopsOnSignal(input gameServer.ComputeStatisticsInput) ([]float64, error)
	GetYStopsWithoutSignal(input gameServer.ComputeStatisticsInput) ([]float64, error)
	GetYHintsOnSignal(input gameServer.ComputeStatisticsInput) ([]float64, error)
	GetYHintsWithoutSignal(input gameServer.ComputeStatisticsInput) ([]float64, error)
	GetYContinuesAfterSignal(input gameServer.ComputeStatisticsInput) ([]float64, error)
	UpsertStatistics(input gameServer.ComputeStatisticsInput, s gameServer.Statistics) error
	GetStatistics(userId, parSetId int) (gameServer.Statistics, error)
	GetTotalScore(input gameServer.ComputeStatisticsInput) (int, error)
	GetAllEvents(input gameServer.ComputeStatisticsInput) ([]gameServer.Point, error)
	MarkStatisticsDirty(userId, parSetId int) error
	GetStatisticsDirty() ([]gameServer.ComputeStatisticsInput, error)
	ClearStatisticsDirty(input gameServer.ComputeStatisticsInput) error
}

type Test interface {
	GetAllTests() ([]gameServer.Test, error)
	GetActiveTests() ([]gameServer.Test, error)
	GetOneTest(id int) (gameServer.Test, error)
	CreateTest(input gameServer.CreateTestInput) (int, error)
	UpdateTest(id int, input gameServer.UpdateTestInput) error
	DeleteTest(id int) error
	GetCompletedTestIds(userId int) (map[int]bool, error)
	CreateTestResult(userId int, input gameServer.SubmitTestResultInput, score *float64) (int, error)
	GetUserResults(userId int) ([]gameServer.TestResult, error)
	GetUserResultsWithTests(userId int) ([]gameServer.TestResultWithTest, error)
}

type Repository struct {
	User
	Chart
	Point
	Statistics
	Test
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{
		User:       NewUserPostgres(db),
		Chart:      NewChartPostgres(db),
		Point:      NewPointPostgres(db),
		Statistics: NewStatisticsPostgres(db),
		Test:       NewTestPostgres(db),
	}
}
