package gameServer

import (
	"errors"
	"strings"
	"time"
)

const (
	RoleUser       = "User"
	RoleAdmin      = "ADMIN"
	RoleResearcher = "Researcher"
)

func ValidRole(role string) bool {
	return role == RoleUser || role == RoleAdmin || role == RoleResearcher
}

var ErrDuplicateLogin = errors.New("login already taken")

var ErrLastAdmin = errors.New("cannot delete the last administrator")

var ErrDuplicateGroupName = errors.New("group name already taken")

var ErrUserAlreadyInGroup = errors.New("user is already in the group")

type User struct {
	Id               int     `json:"user_id" db:"user_id"`
	Login            string  `json:"login" binding:"required"`
	Password         string  `json:"-" binding:"required" db:"password"`
	Name             string  `json:"name" binding:"required" db:"name"`
	Role             string  `json:"role" binding:"required"`
	CurParSetId      int     `json:"cur_par_set_id" db:"cur_par_set_id"`
	Profession       *string `json:"profession,omitempty" db:"profession"`
	ExperienceYears  *int    `json:"experience_years,omitempty" db:"experience_years"`
	ExperienceMonths *int    `json:"experience_months,omitempty" db:"experience_months"`
	Gender           *string `json:"gender,omitempty" db:"gender"`
	Age              *int    `json:"age,omitempty" db:"age"`
	CreatedAt        string  `json:"created_at" db:"created_at"`
}

type Group struct {
	Id           int    `json:"id" db:"id"`
	Name         string `json:"name" db:"name"`
	CreatedAt    string `json:"created_at" db:"created_at"`
	CreatorId    *int   `json:"creator_id" db:"creator_id"`
	CreatorName  string `json:"creator_name" db:"creator_name"`
	MembersCount int    `json:"members_count" db:"members_count"`
	ParSetId     int    `json:"parameter_set_id" db:"parameter_set_id"`
}

type PlayerStat struct {
	Id          int            `json:"id" db:"user_id"`
	Name        string         `json:"name" db:"name"`
	Login       string         `json:"login" db:"login"`
	CurParSetId int            `json:"cur_par_set_id" db:"cur_par_set_id"`
	ParSets     []ParameterSet `json:"par_sets"`
}

type PlayerEvent struct {
	Name      []string `json:"name"`
	Y         float64  `json:"x" db:"x"`
	CheckInfo *string  `json:"check_info"`
}

type RegisterUserInput struct {
	Login            string `json:"login" binding:"required"`
	Password         string `json:"password" binding:"required"`
	Name             string `json:"name" binding:"required"`
	Role             string `json:"role" binding:"required"`
	Profession       string `json:"profession" binding:"required"`
	ExperienceYears  int    `json:"experience_years"`
	ExperienceMonths int    `json:"experience_months"`
	Gender           string `json:"gender" binding:"required"`
	Age              int    `json:"age" binding:"required"`
	CurParSetId      *int   `json:"cur_par_set_id"`
	GroupId          *int   `json:"group_id"`
}

func (i *RegisterUserInput) Vaildate() error {
	if len(i.Password) < MinPasswordLength {
		return errors.New("password is too short")
	}
	if i.CurParSetId != nil && *i.CurParSetId <= 0 {
		return errors.New("current parameter set id is non-positive")
	}
	if i.GroupId != nil && *i.GroupId <= 0 {
		return errors.New("current group id is non-positive")
	}
	if strings.TrimSpace(i.Profession) == "" {
		return errors.New("profession is empty")
	}
	if i.ExperienceYears < 0 {
		return errors.New("experience years is negative")
	}
	if i.ExperienceMonths < 0 || i.ExperienceMonths > 11 {
		return errors.New("experience months is out of range 0-11")
	}
	if strings.TrimSpace(i.Gender) == "" {
		return errors.New("gender is empty")
	}
	if i.Age <= 0 || i.Age > 150 {
		return errors.New("age is out of allowed range")
	}
	return nil
}

type LoginInput struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type UpdateUserInput struct {
	Password         *string `json:"password"`
	Role             *string `json:"role"`
	CurParSetId      *int    `json:"cur_par_set_id"`
	Name             *string `json:"name"`
	Profession       *string `json:"profession"`
	ExperienceYears  *int    `json:"experience_years"`
	ExperienceMonths *int    `json:"experience_months"`
	Gender           *string `json:"gender"`
	Age              *int    `json:"age"`
}

const MinPasswordLength = 6

func (i *UpdateUserInput) Validate() error {
	if i.Password == nil &&
		i.Role == nil &&
		i.CurParSetId == nil &&
		i.Name == nil &&
		i.Profession == nil &&
		i.ExperienceYears == nil &&
		i.ExperienceMonths == nil &&
		i.Gender == nil &&
		i.Age == nil {
		return errors.New("no values to update")
	}
	if i.Password != nil && len(*i.Password) < MinPasswordLength {
		return errors.New("password is too short")
	}
	if i.CurParSetId != nil && *i.CurParSetId <= 0 {
		return errors.New("current parameter set id is non-positive")
	}
	if i.Role != nil && !ValidRole(*i.Role) {
		return errors.New("invalid role")
	}
	if i.Name != nil && strings.TrimSpace(*i.Name) == "" {
		return errors.New("name is empty")
	}
	if i.Profession != nil && strings.TrimSpace(*i.Profession) == "" {
		return errors.New("profession is empty")
	}
	if i.ExperienceYears != nil && *i.ExperienceYears < 0 {
		return errors.New("experience years is negative")
	}
	if i.ExperienceMonths != nil && (*i.ExperienceMonths < 0 || *i.ExperienceMonths > 11) {
		return errors.New("experience months is out of range 0-11")
	}
	if i.Gender != nil && strings.TrimSpace(*i.Gender) == "" {
		return errors.New("gender is empty")
	}
	if i.Age != nil && (*i.Age <= 0 || *i.Age > 150) {
		return errors.New("age is out of allowed range")
	}
	return nil
}

type UpdateUserParSetInput struct {
	ParSetId int `json:"par_set_id"`
}

func (i *UpdateUserParSetInput) Validate() error {
	if i.ParSetId <= 0 {
		return errors.New("current parameter set id is non-positive")
	}
	return nil
}

type UpdateUserUserParSetInput struct {
	ParSetId          int        `json:"par_set_id"`
	IsTraining        *bool      `json:"is_training" db:"is_training"`
	TrainingStartTime *time.Time `json:"training_start_time" db:"training_start_time"`
	GameStartTime     *time.Time `json:"game_start_time" db:"game_start_time"`
}

func (i *UpdateUserUserParSetInput) Validate() error {
	if i.ParSetId <= 0 {
		return errors.New("current parameter set id is non-positive")
	}
	if i.IsTraining == nil &&
		i.TrainingStartTime == nil &&
		i.GameStartTime == nil {
		return errors.New("no values to update")
	}
	return nil
}

type StartSessionInput struct {
	ParSetId int `json:"par_set_id"`
}

func (i *StartSessionInput) Validate() error {
	if i.ParSetId <= 0 {
		return errors.New("current parameter set id is non-positive")
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
	SortBy      string `json:"sort_by"`
	SortDir     string `json:"sort_dir"`
}

func (i *GetAllUsersInput) Validate() error {
	if i.CurrentPage <= 0 {
		return errors.New("current page is equal or less than zero")
	}
	return nil
}

// OrderByClause builds a safe ORDER BY fragment. The sort column is resolved
// through a fixed whitelist, so the requested values are never interpolated raw.
func (i *GetAllUsersInput) OrderByClause(alias string) string {
	dir := "ASC"
	if strings.EqualFold(i.SortDir, "desc") {
		dir = "DESC"
	}

	prefix := ""
	if alias != "" {
		prefix = alias + "."
	}

	var expr string
	switch i.SortBy {
	case "name":
		expr = prefix + "name"
	case "role":
		expr = prefix + "role"
	case "profession":
		expr = prefix + "profession"
	case "age":
		expr = "COALESCE(" + prefix + "age, 0)"
	case "experience":
		expr = "(COALESCE(" + prefix + "experience_years, 0) * 12 + COALESCE(" + prefix + "experience_months, 0))"
	case "login":
		expr = prefix + "login"
	default:
		expr = prefix + "login"
	}

	return expr + " " + dir + ", " + prefix + "user_id ASC"
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
	CreatorId int    `json:"-"`
	Name      string `json:"name" binding:"required"`
	ParSetId  int    `json:"par_set_id" binding:"required"`
}

func (i *CreateGroupInput) Validate() error {
	if i.CreatorId <= 0 {
		return errors.New("creator id is non-positive")
	}
	if i.ParSetId <= 0 {
		return errors.New("parameter set id is non-positive")
	}
	if i.Name == "" {
		return errors.New("name is empty")
	}
	return nil
}

type GetPlayersStatInput struct {
	FilterTag   string `json:"filter_tag"`
	FilterValue string `json:"filter_value"`
	CurrentPage int    `json:"current_page"`
}

func (i *GetPlayersStatInput) Validate() error {
	if i.CurrentPage <= 0 {
		return errors.New("current page is equal or less than zero")
	}
	return nil
}

type GetPlayersPageCountInput struct {
	FilterTag   string `json:"filter_tag"`
	FilterValue string `json:"filter_value"`
}

type GetPlayersEventsInput struct {
	UserId      int    `json:"user_id" db:"user_id"`
	ParSetId    int    `json:"par_set_id" db:"id"`
	GroupedBy   string `json:"grouped_by"`
	CurrentPage int    `json:"current_page"`
}

func (i *GetPlayersEventsInput) Validate() error {
	if i.UserId <= 0 {
		return errors.New("user id is equal or less than zero")
	}
	if i.ParSetId <= 0 {
		return errors.New("parameter set id is equal or less than zero")
	}
	return nil
}

type GetPlayersEventsPageCountInput struct {
	UserId    int    `json:"user_id" db:"user_id"`
	ParSetId  int    `json:"par_set_id" db:"id"`
	GroupedBy string `json:"grouped_by"`
}

type ChangeGroupParSetInput struct {
	GroupId  int `json:"group_id"`
	ParSetId int `json:"par_set_id"`
}

func (i *ChangeGroupParSetInput) Validate() error {
	if i.GroupId <= 0 {
		return errors.New("group id is non-positive")
	}
	if i.ParSetId <= 0 {
		return errors.New("parameter set id is non-positive")
	}
	return nil
}

var ErrUserNotInGroup = errors.New("user is not in the group")

type UpdateGroupInput struct {
	Name string `json:"name"`
}

func (i *UpdateGroupInput) Validate() error {
	if strings.TrimSpace(i.Name) == "" {
		return errors.New("name is empty")
	}
	return nil
}
