package repository

import (
	"fmt"

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
