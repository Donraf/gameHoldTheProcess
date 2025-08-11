package gameServer

type User struct {
	Id          int    `json:"-" db:"user_id"`
	Login       string `json:"login" binding:"required"`
	Password    string `json:"password" binding:"required"`
	Role        string `json:"role" binding:"required"`
	CurParSetId int    `json:"cur_par_set_id" binding:"required"`
	CreatedAt   string `json:"created_at" binding:"required"`
	UpdatedAt   string `json:"updated_at" binding:"required"`
}
