package gameServer

type User struct {
	Id          int    `json:"-"`
	Login       string `json:"login"`
	Password    string `json:"password"`
	Role        string `json:"role"`
	CurParSetId int    `json:"cur_par_set_id"`
}
