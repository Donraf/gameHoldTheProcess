package gameServer

type Chart struct {
	Id             int `json:"-"`
	ParameterSetId int `json:"-"`
	UserId         int `json:"-"`
}

type Point struct {
	Id                  int     `json:"-"`
	X                   float32 `json:"x"`
	Y                   float32 `json:"y"`
	Score               float32 `json:"score"`
	IsEnd               bool    `json:"is_end"`
	IsCrash             bool    `json:"is_crash"`
	IsUsefulAiSignal    bool    `json:"is_useful_ai_signal"`
	IsDeceptiveAiSignal bool    `json:"is_deceptive_ai_signal"`
	IsStop              bool    `json:"is_stop"`
	IsPause             bool    `json:"is_pause"`
	IsCheck             bool    `json:"is_check"`
	ChartId             int     `json:"-"`
}

type ParameterSet struct {
	Id        int     `json:"-"`
	GainCoef  float32 `json:"gain_coef"`
	TimeConst float32 `json:"time_const"`
	NoiseCoef float32 `json:"noise_coef"`
}

type UserParameterSet struct {
	Score          float32 `json:"score"`
	UserId         int     `json:"-"`
	ParameterSetId int     `json:"-"`
}
