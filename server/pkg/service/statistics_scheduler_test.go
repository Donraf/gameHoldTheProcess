package service

import (
	"testing"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/stretchr/testify/assert"
)

func TestStatisticsScheduler_MarkDirty(t *testing.T) {
	t.Run("nil scheduler does not panic", func(t *testing.T) {
		var nilScheduler *StatisticsScheduler
		nilScheduler.MarkDirty(1, 1)
	})

	t.Run("marks unique pairs only once", func(t *testing.T) {
		s := NewStatisticsScheduler(nil, time.Minute)

		s.MarkDirty(1, 2)
		s.MarkDirty(1, 2)
		s.MarkDirty(3, 4)
		s.MarkDirty(0, 5)  // невалидный user id — игнорируется
		s.MarkDirty(6, -1) // невалидный par set id — игнорируется

		assert.Len(t, s.dirty, 2)
		assert.Contains(t, s.dirty, gameServer.ComputeStatisticsInput{UserId: 1, ParSetId: 2})
		assert.Contains(t, s.dirty, gameServer.ComputeStatisticsInput{UserId: 3, ParSetId: 4})
	})
}
