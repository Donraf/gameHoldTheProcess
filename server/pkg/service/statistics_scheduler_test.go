package service

import (
	"testing"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/stretchr/testify/assert"
)

// fakeStatisticsRepo — минимальная заглушка репозитория статистики,
// записывающая вызовы dirty-методов.
type fakeStatisticsRepo struct {
	marked  []gameServer.ComputeStatisticsInput
	cleared []gameServer.ComputeStatisticsInput
	dirty   []gameServer.ComputeStatisticsInput
}

func (f *fakeStatisticsRepo) CountGames(input gameServer.ComputeStatisticsInput) (int, error) {
	return 0, nil
}
func (f *fakeStatisticsRepo) CountStops(input gameServer.ComputeStatisticsInput) (int, error) {
	return 0, nil
}
func (f *fakeStatisticsRepo) CountCrashes(input gameServer.ComputeStatisticsInput) (int, error) {
	return 0, nil
}
func (f *fakeStatisticsRepo) GetYStopsOnSignal(input gameServer.ComputeStatisticsInput) ([]float64, error) {
	return nil, nil
}
func (f *fakeStatisticsRepo) GetYStopsWithoutSignal(input gameServer.ComputeStatisticsInput) ([]float64, error) {
	return nil, nil
}
func (f *fakeStatisticsRepo) GetYHintsOnSignal(input gameServer.ComputeStatisticsInput) ([]float64, error) {
	return nil, nil
}
func (f *fakeStatisticsRepo) GetYHintsWithoutSignal(input gameServer.ComputeStatisticsInput) ([]float64, error) {
	return nil, nil
}
func (f *fakeStatisticsRepo) GetYContinuesAfterSignal(input gameServer.ComputeStatisticsInput) ([]float64, error) {
	return nil, nil
}
func (f *fakeStatisticsRepo) UpsertStatistics(input gameServer.ComputeStatisticsInput, s gameServer.Statistics) error {
	return nil
}
func (f *fakeStatisticsRepo) GetStatistics(userId, parSetId int) (gameServer.Statistics, error) {
	return gameServer.Statistics{}, nil
}
func (f *fakeStatisticsRepo) GetTotalScore(input gameServer.ComputeStatisticsInput) (int, error) {
	return 0, nil
}
func (f *fakeStatisticsRepo) GetAllEvents(input gameServer.ComputeStatisticsInput) ([]gameServer.Point, error) {
	return nil, nil
}
func (f *fakeStatisticsRepo) MarkStatisticsDirty(userId, parSetId int) error {
	f.marked = append(f.marked, gameServer.ComputeStatisticsInput{UserId: userId, ParSetId: parSetId})
	return nil
}
func (f *fakeStatisticsRepo) GetStatisticsDirty() ([]gameServer.ComputeStatisticsInput, error) {
	return f.dirty, nil
}
func (f *fakeStatisticsRepo) ClearStatisticsDirty(input gameServer.ComputeStatisticsInput) error {
	f.cleared = append(f.cleared, input)
	return nil
}

func TestStatisticsScheduler_MarkDirty(t *testing.T) {
	t.Run("nil scheduler does not panic", func(t *testing.T) {
		var nilScheduler *StatisticsScheduler
		nilScheduler.MarkDirty(1, 1)
	})

	t.Run("valid pairs are persisted, invalid are skipped", func(t *testing.T) {
		repo := &fakeStatisticsRepo{}
		s := NewStatisticsScheduler(NewStatisticsService(repo), time.Minute)

		s.MarkDirty(1, 2)
		s.MarkDirty(3, 4)
		s.MarkDirty(0, 5)  // невалидный user id — игнорируется
		s.MarkDirty(6, -1) // невалидный par set id — игнорируется

		assert.Equal(t, []gameServer.ComputeStatisticsInput{
			{UserId: 1, ParSetId: 2},
			{UserId: 3, ParSetId: 4},
		}, repo.marked)
	})
}

func TestStatisticsScheduler_ProcessDirty(t *testing.T) {
	t.Run("computed pairs are cleared from the queue", func(t *testing.T) {
		repo := &fakeStatisticsRepo{
			dirty: []gameServer.ComputeStatisticsInput{
				{UserId: 1, ParSetId: 2},
				{UserId: 3, ParSetId: 4},
			},
		}
		s := NewStatisticsScheduler(NewStatisticsService(repo), time.Minute)

		s.processDirty()

		assert.Equal(t, repo.dirty, repo.cleared)
	})
}
