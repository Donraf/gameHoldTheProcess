package gameServer

import (
	"strconv"
	"strings"
	"time"
)

const (
	trainingLimitPlaceholder = "{{TRAINING_LIMIT_MIN}}"
	gameLimitPlaceholder     = "{{GAME_LIMIT_MIN}}"
	sessionEndGrace          = 2 * time.Minute
	dbClockUtcOffset         = 3 * time.Hour
)

var (
	TrainingTimeLimit = 10 * time.Minute
	GameTimeLimit     = 45 * time.Minute
)

func SetTimeLimits(training, game time.Duration) {
	if training > 0 {
		TrainingTimeLimit = training
	}
	if game > 0 {
		GameTimeLimit = game
	}
}

func SubstituteTimeLimits(text string) string {
	return strings.NewReplacer(
		trainingLimitPlaceholder, strconv.Itoa(int(TrainingTimeLimit.Minutes())),
		gameLimitPlaceholder, strconv.Itoa(int(GameTimeLimit.Minutes())),
	).Replace(text)
}

func ApplySessionMeta(ps *ParameterSet) {
	ps.TrainingLimitMin = int(TrainingTimeLimit.Minutes())
	ps.GameLimitMin = int(GameTimeLimit.Minutes())
	ps.RulesText = SubstituteTimeLimits(ps.RulesText)
}

func NowDbClock() time.Time {
	return time.Now().UTC().Add(dbClockUtcOffset)
}

func (ups *UserParameterSet) CurrentSessionStart() *time.Time {
	if ups.IsTraining {
		return ups.TrainingStartTime
	}
	return ups.GameStartTime
}

func (ups *UserParameterSet) CurrentSessionLimit() time.Duration {
	if ups.IsTraining {
		return TrainingTimeLimit
	}
	return GameTimeLimit
}

func (ups *UserParameterSet) RemTime(now time.Time) int64 {
	limit := ups.CurrentSessionLimit()
	start := ups.CurrentSessionStart()
	if start == nil {
		return limit.Milliseconds()
	}
	rem := limit - now.Sub(*start)
	if rem < 0 {
		return 0
	}
	return rem.Milliseconds()
}

func (ups *UserParameterSet) SessionExpired(now time.Time) bool {
	start := ups.CurrentSessionStart()
	if start == nil {
		return false
	}
	return now.Sub(*start) > ups.CurrentSessionLimit()+sessionEndGrace
}
