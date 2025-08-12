package repository

import (
	"fmt"
	"strings"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/jmoiron/sqlx"
)

type UserPostgres struct {
	db *sqlx.DB
}

func NewUserPostgres(db *sqlx.DB) *UserPostgres {
	return &UserPostgres{db: db}
}

func (u *UserPostgres) CreateUser(user gameServer.User) (int, error) {
	var id int
	query := fmt.Sprintf("INSERT INTO %s (login, password, role, cur_par_set_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id", usersTable)

	row := u.db.QueryRow(query, user.Login, user.Password, user.Role, user.CurParSetId, user.CreatedAt, user.UpdatedAt)
	if err := row.Scan(&id); err != nil {
		return 0, err
	}

	return id, nil
}

func (u *UserPostgres) GetUser(login, password string) (gameServer.User, error) {
	var user gameServer.User
	query := fmt.Sprintf("SELECT user_id, login, role FROM %s WHERE login=$1 AND password=$2", usersTable)
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

func (u *UserPostgres) GetAllUsers() ([]gameServer.User, error) {
	var users []gameServer.User
	query := fmt.Sprintf("SELECT user_id, login, role, cur_par_set_id, created_at, updated_at FROM %s", usersTable)
	err := u.db.Select(&users, query)

	return users, err
}

func (u *UserPostgres) GetOneUser(id int) (gameServer.User, error) {
	var user gameServer.User
	query := fmt.Sprintf("SELECT user_id, login, role, cur_par_set_id, created_at, updated_at FROM %s WHERE user_id=$1", usersTable)
	err := u.db.Get(&user, query, id)

	return user, err
}
