package service

import (
	"testing"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/stretchr/testify/assert"
)

func TestComputeChoiceStatsAnikin(t *testing.T) {
	t.Run("no points", func(t *testing.T) {
		_, err := computeChoiceStatsAnikin(nil)
		assert.NoError(t, err)
	})

	t.Run("single signal point does not panic", func(t *testing.T) {
		points := []gameServer.Point{
			{Y: 0.5, IsUsefulAiSignal: true, IsStop: true},
		}
		result, err := computeChoiceStatsAnikin(points)
		assert.NoError(t, err)
		assert.Contains(t, result, "Все точки принятия решений 1-1")
	})

	t.Run("single signal point without stop counts as continue", func(t *testing.T) {
		points := []gameServer.Point{
			{Y: 0.3, IsDeceptiveAiSignal: true},
		}
		result, err := computeChoiceStatsAnikin(points)
		assert.NoError(t, err)
		assert.Contains(t, result, "ContAbs")
	})
}

func TestComputeChoiceStatsVengerCharts(t *testing.T) {
	t.Run("no points", func(t *testing.T) {
		_, err := computeChoiceStatsVengerCharts(nil)
		assert.NoError(t, err)
	})

	t.Run("single signal point does not panic", func(t *testing.T) {
		points := []gameServer.Point{
			{Y: 0.5, IsUsefulAiSignal: true, IsStop: true},
		}
		_, err := computeChoiceStatsVengerCharts(points)
		assert.NoError(t, err)
	})
}

func TestComputeChoiceStatsVengerTable(t *testing.T) {
	t.Run("no points", func(t *testing.T) {
		_, err := computeChoiceStatsVengerTable(nil)
		assert.NoError(t, err)
	})
}
