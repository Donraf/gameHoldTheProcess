package service

import (
	"context"
	"fmt"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/sirupsen/logrus"
)

// StatisticsScheduler откладывает пересчёт статистики игроков:
// конец игры помечает пару (игрок, набор параметров) как «грязную»
// в таблице statistics_dirty, фоновый воркер раз в interval пересчитывает
// накопившиеся пары — строго по одной, чтобы не нагружать базу.
// Очередь хранится в БД, поэтому переживает рестарты сервера.
type StatisticsScheduler struct {
	stats    *StatisticsService
	interval time.Duration
}

func NewStatisticsScheduler(stats *StatisticsService, interval time.Duration) *StatisticsScheduler {
	return &StatisticsScheduler{
		stats:    stats,
		interval: interval,
	}
}

// MarkDirty отмечает, что статистику пары (userId, parSetId) нужно пересчитать.
// Безопасно вызывать на nil-получателе (тесты без планировщика).
func (s *StatisticsScheduler) MarkDirty(userId, parSetId int) {
	if s == nil || userId <= 0 || parSetId <= 0 {
		return
	}

	if err := s.stats.MarkStatisticsDirty(userId, parSetId); err != nil {
		logrus.Errorf("statistics scheduler: failed to mark statistics dirty for user %d, par set %d: %s",
			userId, parSetId, err.Error())
	}
}

// Run запускает цикл пересчёта до отмены ctx.
func (s *StatisticsScheduler) Run(ctx context.Context) {
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.processDirty()
		}
	}
}

func (s *StatisticsScheduler) processDirty() {
	batch, err := s.stats.GetStatisticsDirty()
	if err != nil {
		logrus.Errorf("statistics scheduler: failed to get dirty statistics: %s", err.Error())
		return
	}

	for _, input := range batch {
		if err := s.computeOne(input); err != nil {
			logrus.Errorf("statistics scheduler: failed to compute statistics for user %d, par set %d: %s",
				input.UserId, input.ParSetId, err.Error())
			// Пара остаётся в таблице — повторим на следующем тике.
			continue
		}
		if err := s.stats.ClearStatisticsDirty(input); err != nil {
			logrus.Errorf("statistics scheduler: failed to clear dirty mark for user %d, par set %d: %s",
				input.UserId, input.ParSetId, err.Error())
		}
	}
}

// computeOne пересчитывает одну пару; паника превращается в ошибку,
// чтобы фоновая goroutine не уронила весь сервер.
func (s *StatisticsScheduler) computeOne(input gameServer.ComputeStatisticsInput) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic during statistics computation: %v", r)
		}
	}()

	_, err = s.stats.ComputeStatistics(input)
	return err
}
