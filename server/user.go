package gameServer

import "errors"

type User struct {
	Id          int    `json:"user_id" db:"user_id"`
	Login       string `json:"login" binding:"required"`
	Password    string `json:"password" binding:"required"`
	Name        string `json:"name" binding:"required" db:"name"`
	Role        string `json:"role" binding:"required"`
	CurParSetId int    `json:"cur_par_set_id" db:"cur_par_set_id"`
	CreatedAt   string `json:"created_at" db:"created_at"`
}

type Group struct {
	Id        int    `json:"id" db:"id"`
	Name      string `json:"name" db:"name"`
	CreatedAt string `json:"created_at" db:"created_at"`
	CreatorId int    `json:"creator_id" db:"creator_id"`
}

type RegisterUserInput struct {
	Login       string `json:"login" binding:"required"`
	Password    string `json:"password" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Role        string `json:"role" binding:"required"`
	CurParSetId *int   `json:"cur_par_set_id"`
	GroupId     *int   `json:"group_id"`
}

func (i *RegisterUserInput) Vaildate() error {
	if i.CurParSetId != nil && *i.CurParSetId <= 0 {
		return errors.New("current parameter set id is non-positive")
	}
	if i.GroupId != nil && *i.GroupId <= 0 {
		return errors.New("current group id is non-positive")
	}
	return nil
}

type LoginInput struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type UpdateUserInput struct {
	Password    *string `json:"password"`
	Role        *string `json:"role"`
	CurParSetId *int    `json:"cur_par_set_id"`
}

func (i *UpdateUserInput) Validate() error {
	if i.Password == nil &&
		i.Role == nil &&
		i.CurParSetId == nil {
		return errors.New("no values to update")
	}
	return nil
}

type GetUsersPageCountInput struct {
	FilterTag   string `json:"filter_tag"`
	FilterValue string `json:"filter_value"`
}

type GetAllUsersInput struct {
	FilterTag   string `json:"filter_tag"`
	FilterValue string `json:"filter_value"`
	CurrentPage int    `json:"current_page"`
}

type UpdateScoreInput struct {
	UserId   int `json:"userId"`
	ParSetId int `json:"parSetId"`
	Score    int `json:"score"`
}

func (i *UpdateScoreInput) Vaildate() error {
	if i.ParSetId <= 0 {
		return errors.New("parameter set id is non-positive")
	}
	if i.UserId <= 0 {
		return errors.New("group id is non-positive")
	}
	return nil
}

type CreateGroupInput struct {
	CreatorId int    `json:"creator_id"`
	Name      string `json:"name"`
}
