package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/sirupsen/logrus"
)

// StatisticsScheduler откладывает пересчёт статистики игроков:
// конец игры помечает пару (игрок, набор параметров) как «грязную»,
// фоновый воркер раз в interval пересчитывает накопившиеся пары —
// строго по одной, чтобы не нагружать базу.
type StatisticsScheduler struct {
	stats    *StatisticsService
	interval time.Duration

	mu    sync.Mutex
	dirty map[gameServer.ComputeStatisticsInput]struct{}
}

func NewStatisticsScheduler(stats *StatisticsService, interval time.Duration) *StatisticsScheduler {
	return &StatisticsScheduler{
		stats:    stats,
		interval: interval,
		dirty:    make(map[gameServer.ComputeStatisticsInput]struct{}),
	}
}

// MarkDirty отмечает, что статистику пары (userId, parSetId) нужно пересчитать.
// Безопасно вызывать на nil-получателе (тесты без планировщика).
func (s *StatisticsScheduler) MarkDirty(userId, parSetId int) {
	if s == nil || userId <= 0 || parSetId <= 0 {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	s.dirty[gameServer.ComputeStatisticsInput{UserId: userId, ParSetId: parSetId}] = struct{}{}
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
	s.mu.Lock()
	batch := s.dirty
	s.dirty = make(map[gameServer.ComputeStatisticsInput]struct{}, len(batch))
	s.mu.Unlock()

	for input := range batch {
		if err := s.computeOne(input); err != nil {
			logrus.Errorf("statistics scheduler: failed to compute statistics for user %d, par set %d: %s",
				input.UserId, input.ParSetId, err.Error())
			// Не удалось — вернём в очередь, чтобы попробовать на следующем тике.
			s.MarkDirty(input.UserId, input.ParSetId)
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
