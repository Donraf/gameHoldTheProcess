package gameServer

import "errors"

type Statistics struct {
	GamesNum                 int     `json:"games_num" db:"games_num"`
	StopsNum                 int     `json:"stops_num" db:"stops_num"`
	CrashesNum               int     `json:"crashes_num" db:"crashes_num"`
	TotalScore               int     `json:"total_score" db:"total_score"`
	StopOnSignalNum          int     `json:"stop_on_signal_num" db:"stop_on_signal_num"`
	MeanStopOnSignal         float64 `json:"mean_stop_on_signal" db:"mean_stop_on_signal"`
	StdevStopOnSignal        float64 `json:"stdev_stop_on_signal" db:"stdev_stop_on_signal"`
	StopWithoutSignalNum     int     `json:"stop_without_signal_num" db:"stop_without_signal_num"`
	MeanStopWithoutSignal    float64 `json:"mean_stop_without_signal" db:"mean_stop_without_signal"`
	StdevStopWithoutSignal   float64 `json:"stdev_stop_without_signal" db:"stdev_stop_without_signal"`
	HintOnSignalNum          int     `json:"hint_on_signal_num" db:"hint_on_signal_num"`
	MeanHintOnSignal         float64 `json:"mean_hint_on_signal" db:"mean_hint_on_signal"`
	StdevHintOnSignal        float64 `json:"stdev_hint_on_signal" db:"stdev_hint_on_signal"`
	HintWithoutSignalNum     int     `json:"hint_without_signal_num" db:"hint_without_signal_num"`
	MeanHintWithoutSignal    float64 `json:"mean_hint_without_signal" db:"mean_hint_without_signal"`
	StdevHintWithoutSignal   float64 `json:"stdev_hint_without_signal" db:"stdev_hint_without_signal"`
	ContinueAfterSignalNum   int     `json:"continue_after_signal_num" db:"continue_after_signal_num"`
	MeanContinueAfterSignal  float64 `json:"mean_continue_after_signal" db:"mean_continue_after_signal"`
	StdevContinueAfterSignal float64 `json:"stdev_continue_after_signal" db:"stdev_continue_after_signal"`
}

type ComputeStatisticsInput struct {
	UserId   int `json:"user_id" db:"user_id"`
	ParSetId int `json:"par_set_id" db:"id"`
}

func (i *ComputeStatisticsInput) Validate() error {
	if i.UserId <= 0 {
		return errors.New("user id is equal or less than zero")
	}
	if i.ParSetId <= 0 {
		return errors.New("parameter set id is equal or less than zero")
	}
	return nil
}
