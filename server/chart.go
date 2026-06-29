package gameServer

import (
	"encoding/json"
	"errors"
	"time"
)

type Chart struct {
	Id             int    `json:"id"`
	ParameterSetId int    `json:"parameter_set_id" binding:"required" db:"parameter_set_id"`
	UserId         int    `json:"user_id" binding:"required" db:"user_id"`
	CreatedAt      string `json:"created_at" binding:"required" db:"created_at"`
	IsTraining     bool   `json:"is_training" db:"is_training"`
}

type CreateChartInput struct {
	ParameterSetId int  `json:"par_set_id" binding:"required" db:"parameter_set_id"`
	UserId         int  `json:"user_id" binding:"required" db:"user_id"`
	IsTraining     bool `json:"is_training" db:"is_training"`
}

func (i *CreateChartInput) Validate() error {
	if i.ParameterSetId <= 0 {
		return errors.New("parameter set id is equal or less than zero")
	}
	if i.UserId <= 0 {
		return errors.New("user id is equal or less than zero")
	}
	return nil
}

type GetChartsPageCountInput struct {
	FilterTag   string `json:"filter_tag"`
	FilterValue string `json:"filter_value"`
}

type GetChartsCountInput struct {
	FilterTag   string `json:"filter_tag"`
	FilterValue string `json:"filter_value"`
}

type GetAllChartsInput struct {
	FilterTag   string `json:"filter_tag"`
	FilterValue string `json:"filter_value"`
	CurrentPage int    `json:"current_page"`
}

func (i *GetAllChartsInput) Validate() error {
	if i.CurrentPage <= 0 {
		return errors.New("current page is equal or less than zero")
	}
	return nil
}

type GetAllParSetsInput struct {
	CurrentPage int `json:"current_page"`
}

func (i *GetAllParSetsInput) Validate() error {
	if i.CurrentPage <= 0 && i.CurrentPage != -1 {
		return errors.New("current page is equal or less than zero")
	}
	return nil
}

type CreateParSetInput struct {
	A                   float32         `json:"a" db:"a"`
	B                   float32         `json:"b" db:"b"`
	NoiseMean             float32         `json:"noise_mean" db:"noise_mean"`
	NoiseStdev            float32         `json:"noise_stdev" db:"noise_stdev"`
	FalseWarningProb      float32         `json:"false_warning_prob" db:"false_warning_prob"`
	MissingDangerProb     float32         `json:"missing_danger_prob" db:"missing_danger_prob"`
	ScoringConfig         json.RawMessage `json:"scoring_config" db:"scoring_config"`
	HintCost              float32         `json:"hint_cost" db:"hint_cost"`
	FalseAlarmThreshold   float32         `json:"false_alarm_threshold" db:"false_alarm_threshold"`
	RulesText             string          `json:"rules_text" db:"rules_text"`
}

func DefaultScoringConfigJSON() json.RawMessage {
	return json.RawMessage(`{"bonus_step":50,"bonus_reject_incorrect_advice_with_check":1000,"bonus_reject_incorrect_advice_no_check":2000,"bonus_accept_correct_advice_with_check":250,"bonus_accept_correct_advice_no_check":500,"penalty_reject_correct_advice_with_check":4000,"penalty_reject_correct_advice_no_check":2000,"penalty_accept_incorrect_advice_with_check":2000,"penalty_accept_incorrect_advice_no_check":1000,"penalty_incorrect_stop_no_advice":2000,"penalty_explosion_no_advice":0,"penalty_pause":50}`)
}

func (i *CreateParSetInput) ApplyDefaults() {
	if len(i.ScoringConfig) == 0 || !json.Valid(i.ScoringConfig) {
		i.ScoringConfig = DefaultScoringConfigJSON()
	}
	if i.HintCost <= 0 {
		i.HintCost = 250
	}
	if i.FalseAlarmThreshold <= 0 {
		i.FalseAlarmThreshold = 0.9
	}
}

func (i *CreateParSetInput) Validate() error {
	i.ApplyDefaults()
	if i.A < 0 {
		return errors.New("coefficient a is less than zero")
	}
	if i.B < 0 {
		return errors.New("coefficient b is less than zero")
	}
	if i.NoiseMean < 0 {
		return errors.New("noise mean is less than zero")
	}
	if i.NoiseStdev < 0 {
		return errors.New("noise standard deviation is less than zero")
	}
	if i.FalseWarningProb < 0 {
		return errors.New("false warning probability is less than zero")
	}
	if i.MissingDangerProb < 0 {
		return errors.New("missing danger probability is less than zero")
	}
	if len(i.ScoringConfig) > 0 && !json.Valid(i.ScoringConfig) {
		return errors.New("scoring config must be valid json")
	}
	if i.HintCost < 0 {
		return errors.New("hint cost is less than zero")
	}
	if i.FalseAlarmThreshold <= 0 || i.FalseAlarmThreshold > 1 {
		return errors.New("false alarm threshold must be between 0 and 1")
	}
	return nil
}

type Point struct {
	Id                  int     `json:"id" db:"id"`
	X                   float32 `json:"x" db:"x"`
	Y                   float32 `json:"y" db:"y"`
	Score               float32 `json:"score" db:"score"`
	IsCrash             bool    `json:"is_crash" db:"is_crash"`
	IsUsefulAiSignal    bool    `json:"is_useful_ai_signal" db:"is_useful_ai_signal"`
	IsDeceptiveAiSignal bool    `json:"is_deceptive_ai_signal" db:"is_deceptive_ai_signal"`
	IsStop              bool    `json:"is_stop" db:"is_stop"`
	IsPause             bool    `json:"is_pause" db:"is_pause"`
	IsCheck             bool    `json:"is_check" db:"is_check"`
	ChartId             int     `json:"chart_id" binding:"required" db:"chart_id"`
	CreatedAt           string  `json:"created_at" db:"created_at"`
	CheckInfo           *string `json:"check_info" db:"check_info"`
}

func (p *Point) Validate() error {
	if p.X < 0 {
		return errors.New("x coordinate is less than zero")
	}
	if p.ChartId <= 0 {
		return errors.New("chart id is equal or less than zero")
	}
	return nil
}

type PointForCSV struct {
	Id                  int     `json:"id" db:"id"`
	X                   float32 `json:"x" db:"x"`
	Y                   float32 `json:"y" db:"y"`
	Score               float32 `json:"score" db:"score"`
	IsCrash             bool    `json:"is_crash" db:"is_crash"`
	IsUsefulAiSignal    bool    `json:"is_useful_ai_signal" db:"is_useful_ai_signal"`
	IsDeceptiveAiSignal bool    `json:"is_deceptive_ai_signal" db:"is_deceptive_ai_signal"`
	IsStop              bool    `json:"is_stop" db:"is_stop"`
	IsPause             bool    `json:"is_pause" db:"is_pause"`
	IsCheck             bool    `json:"is_check" db:"is_check"`
	ChartId             int     `json:"chart_id" db:"chart_id"`
	CheckInfo           *string `json:"check_info" db:"check_info"`
	UserId              int     `json:"user_id" db:"user_id"`
	ParameterSetId      int     `json:"parameter_set_id" db:"parameter_set_id"`
	IsTraining          bool    `json:"is_training" db:"is_training"`
}

type ParameterSet struct {
	Id                  int             `json:"id" db:"id"`
	A                   float32         `json:"a" db:"a"`
	B                   float32         `json:"b" db:"b"`
	NoiseMean             float32         `json:"noise_mean" db:"noise_mean"`
	NoiseStDev            float32         `json:"noise_stdev" db:"noise_stdev"`
	FalseWarningProb      float32         `json:"false_warning_prob" db:"false_warning_prob"`
	MissingDangerProb     float32         `json:"missing_danger_prob" db:"missing_danger_prob"`
	ScoringConfig         json.RawMessage `json:"scoring_config" db:"scoring_config"`
	HintCost              float32         `json:"hint_cost" db:"hint_cost"`
	FalseAlarmThreshold   float32         `json:"false_alarm_threshold" db:"false_alarm_threshold"`
	RulesText             string          `json:"rules_text" db:"rules_text"`
	CreatedAt             string          `json:"created_at" db:"created_at"`
}

type UserParameterSet struct {
	Score             float32    `json:"score" db:"score"`
	IsTraining        bool       `json:"is_training" db:"is_training"`
	TrainingStartTime *time.Time `json:"training_start_time" db:"training_start_time"`
	GameStartTime     *time.Time `json:"game_start_time" db:"game_start_time"`
	UserId            int        `json:"-"`
	ParameterSetId    int        `json:"-"`
	CreatedAt         string     `json:"created_at" binding:"required" db:"created_at"`
}
