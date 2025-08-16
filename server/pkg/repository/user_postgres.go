package repository

import (
	"fmt"
	"strings"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/jmoiron/sqlx"
)

type UserPostgres struct {
	db *sqlx.DB
}

func NewUserPostgres(db *sqlx.DB) *UserPostgres {
	return &UserPostgres{db: db}
}

func (u *UserPostgres) CreateUser(input gameServer.RegisterUserInput) (int, error) {
	tx, err := u.db.Beginx()
	if err != nil {
		return 0, err
	}

	var parSetId int
	query := fmt.Sprintf("SELECT id FROM %s LIMIT 1", parameterSetsTable)
	row := tx.QueryRow(query)
	if err := row.Scan(&parSetId); err != nil {
		tx.Rollback()
		return 0, err
	}

	var userId int
	timeNow := time.Now().UTC().Add(3 * time.Hour)
	query = fmt.Sprintf("INSERT INTO %s (login, password, name, role, cur_par_set_id, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id", usersTable)
	row = tx.QueryRow(query, input.Login, input.Password, input.Name, input.Role, parSetId, timeNow)
	if err := row.Scan(&userId); err != nil {
		tx.Rollback()
		return 0, err
	}

	query = fmt.Sprintf("INSERT INTO %s (score, user_id, parameter_set_id, created_at) VALUES ($1, $2, $3, $4)", userParameterSetsTable)
	_, err = tx.Exec(query, 1000, userId, parSetId, timeNow)
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	if input.GroupId != 0 {
		query = fmt.Sprintf("INSERT INTO %s (user_id, group_id) VALUES ($1, $2)", userGroupsTable)
		_, err = tx.Exec(query, userId, input.GroupId)
		if err != nil {
			tx.Rollback()
			return 0, err
		}
	}

	return userId, tx.Commit()
}

func (u *UserPostgres) GetUser(login, password string) (gameServer.User, error) {
	var user gameServer.User
	query := fmt.Sprintf("SELECT user_id, login, name, role FROM %s WHERE login=$1 AND password=$2", usersTable)
	err := u.db.Get(&user, query, login, password)

	return user, err
}

func (u *UserPostgres) DeleteUser(id int) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE user_id=$1", usersTable)
	_, err := u.db.Exec(query, id)

	return err
}

func (u *UserPostgres) UpdateUser(id int, input gameServer.UpdateUserInput) error {
	setValues := make([]string, 0)
	args := make([]any, 0)
	argId := 1

	if input.Password != nil {
		setValues = append(setValues, fmt.Sprintf("password=$%d", argId))
		args = append(args, *input.Password)
		argId++
	}

	if input.Role != nil {
		setValues = append(setValues, fmt.Sprintf("role=$%d", argId))
		args = append(args, *input.Role)
		argId++
	}

	if input.CurParSetId != nil {
		setValues = append(setValues, fmt.Sprintf("cur_par_set_id=$%d", argId))
		args = append(args, *input.CurParSetId)
		argId++
	}

	setQuery := strings.Join(setValues, ", ")

	query := fmt.Sprintf("UPDATE %s SET %s WHERE user_id=$%d", usersTable, setQuery, argId)
	args = append(args, id)

	_, err := u.db.Exec(query, args...)
	return err
}

func (u *UserPostgres) GetAllUsers(input gameServer.GetAllUsersInput) ([]gameServer.User, error) {
	var users []gameServer.User
	var query string

	switch input.FilterTag {
	case "login":
		{
			query = fmt.Sprintf("SELECT user_id, login, name, role, cur_par_set_id, created_at FROM %s WHERE login LIKE '%%%s%%' OFFSET %v LIMIT 9", usersTable, input.FilterValue, (input.CurrentPage-1)*9)
		}
	case "group_name":
		{
			query = fmt.Sprintf(
				`SELECT ut.user_id, ut.login, ut.name, ut.role, ut.cur_par_set_id, ut.created_at
				 FROM %s AS gt
				 JOIN %s AS ugt ON gt.id=ugt.group_id
				 JOIN %s AS ut ON ugt.user_id=ut.user_id
				 WHERE gt.name LIKE '%%%s%%' OFFSET %v LIMIT 9`,
				groupsTable, userGroupsTable, usersTable, input.FilterValue, (input.CurrentPage-1)*9)
		}
	case "user_name":
		{
			query = fmt.Sprintf("SELECT user_id, login, name, role, cur_par_set_id, created_at FROM %s WHERE name LIKE '%%%s%%' OFFSET %v LIMIT 9", usersTable, input.FilterValue, (input.CurrentPage-1)*9)
		}
	default:
		{
			query = fmt.Sprintf("SELECT user_id, login, name, role, cur_par_set_id, created_at FROM %s OFFSET %v LIMIT 9", usersTable, (input.CurrentPage-1)*9)
		}
	}

	err := u.db.Select(&users, query)

	return users, err

}

func (u *UserPostgres) GetOneUser(id int) (gameServer.User, error) {
	var user gameServer.User
	query := fmt.Sprintf("SELECT user_id, login, name, role, cur_par_set_id, created_at FROM %s WHERE user_id=$1", usersTable)
	err := u.db.Get(&user, query, id)

	return user, err
}

func (u *UserPostgres) GetUsersCount(input gameServer.GetUsersPageCountInput) (int, error) {
	var usersCount int
	var query string

	switch input.FilterTag {
	case "login":
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE login LIKE '%%%s%%'", usersTable, input.FilterValue)
		}
	case "group_name":
		{
			query = fmt.Sprintf(
				`SELECT COUNT(*)
				 FROM %s AS gt
				 JOIN %s AS ugt ON gt.id=ugt.group_id
				 JOIN %s AS ut ON ugt.user_id=ut.user_id
				 WHERE gt.name LIKE '%%%s%%'`,
				groupsTable, userGroupsTable, usersTable, input.FilterValue)
		}
	case "user_name":
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE name LIKE '%%%s%%'", usersTable, input.FilterValue)
		}
	default:
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s", usersTable)
		}
	}

	row := u.db.QueryRow(query)
	if err := row.Scan(&usersCount); err != nil {
		return 0, err
	}

	return usersCount, nil
}

func (u *UserPostgres) GetParSet(id int) (gameServer.ParameterSet, error) {
	var parSet gameServer.ParameterSet
	query := fmt.Sprintf("SELECT id, gain_coef, time_const, noise_coef FROM %s AS ut JOIN %s AS pst ON ut.cur_par_set_id=pst.id WHERE user_id=$1", usersTable, parameterSetsTable)

	err := u.db.Get(&parSet, query, id)
	if err != nil {
		return parSet, err
	}

	return parSet, nil
}

func (u *UserPostgres) GetScore(userId, parSetId int) (int, error) {
	var score int
	query := fmt.Sprintf("SELECT score FROM %s WHERE user_id=$1 AND parameter_set_id=$2", userParameterSetsTable)

	row := u.db.QueryRow(query, userId, parSetId)
	if err := row.Scan(&score); err != nil {
		return 0, err
	}

	return score, nil
}

func (u *UserPostgres) UpdateScore(input gameServer.UpdateScoreInput) error {
	query := fmt.Sprintf("UPDATE %s SET score=$1 WHERE user_id=$2 AND parameter_set_id=$3", userParameterSetsTable)
	_, err := u.db.Exec(query, input.Score, input.UserId, input.ParSetId)
	if err != nil {
		return err
	}
	return nil
}

func (u *UserPostgres) GetAllGroups() ([]gameServer.Group, error) {
	var groups []gameServer.Group
	query := fmt.Sprintf("SELECT id, name, created_at, creator_id FROM %s", groupsTable)

	err := u.db.Select(&groups, query)

	return groups, err
}

func (u *UserPostgres) CreateGroup(input gameServer.CreateGroupInput) (int, error) {
	var id int
	query := fmt.Sprintf("INSERT INTO %s (name, creator_id, created_at) VALUES ($1, $2, $3) RETURNING id", groupsTable)

	timeNow := time.Now().UTC().Add(3 * time.Hour)
	row := u.db.QueryRow(query, input.Name, input.CreatorId, timeNow)
	if err := row.Scan(&id); err != nil {
		return 0, err
	}

	return id, nil
}
