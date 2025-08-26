package gameServer

import "errors"

type Chart struct {
	Id             int    `json:"id"`
	ParameterSetId int    `json:"parameter_set_id" binding:"required" db:"parameter_set_id"`
	UserId         int    `json:"user_id" binding:"required" db:"user_id"`
	CreatedAt      string `json:"created_at" binding:"required" db:"created_at"`
}

type CreateChartInput struct {
	ParameterSetId int `json:"par_set_id" binding:"required" db:"parameter_set_id"`
	UserId         int `json:"user_id" binding:"required" db:"user_id"`
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
	UserId              int     `json:"user_id" db:"user_id"`
	ParameterSetId      int     `json:"parameter_set_id" db:"parameter_set_id"`
}

type ParameterSet struct {
	Id                int     `json:"id" db:"id"`
	GainCoef          float32 `json:"gain_coef" db:"gain_coef"`
	TimeConst         float32 `json:"time_const" db:"time_const"`
	NoiseCoef         float32 `json:"noise_coef" db:"noise_coef"`
	FalseWarningProb  float32 `json:"false_warning_prob" db:"false_warning_prob"`
	MissingDangerProb float32 `json:"missing_danger_prob" db:"missing_danger_prob"`
	CreatedAt         string  `json:"created_at" db:"created_at"`
}

type UserParameterSet struct {
	Score          float32 `json:"score"`
	UserId         int     `json:"-"`
	ParameterSetId int     `json:"-"`
	CreatedAt      string  `json:"created_at" binding:"required" db:"created_at"`
}
