package gameServer

import "time"

const (
	TrainingTimeLimit = 10 * time.Minute
	GameTimeLimit     = 45 * time.Minute
	sessionEndGrace   = 2 * time.Minute
	dbClockUtcOffset  = 3 * time.Hour
)

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
