package repository

import (
	"fmt"
	"strings"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
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
	if input.GroupId != nil {
		query := fmt.Sprintf("SELECT parameter_set_id FROM %s WHERE id=$1", groupsTable)
		row := tx.QueryRow(query, input.GroupId)
		if err := row.Scan(&parSetId); err != nil {
			tx.Rollback()
			return 0, err
		}
	} else {
		query := fmt.Sprintf("SELECT id FROM %s LIMIT 1", parameterSetsTable)
		row := tx.QueryRow(query)
		if err := row.Scan(&parSetId); err != nil {
			tx.Rollback()
			return 0, err
		}
	}

	var userId int
	timeNow := gameServer.Now()
	query := fmt.Sprintf("INSERT INTO %s (login, password, name, role, cur_par_set_id, profession, experience_years, experience_months, gender, age, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING user_id", usersTable)
	row := tx.QueryRow(query, input.Login, input.Password, input.Name, input.Role, parSetId, input.Profession, input.ExperienceYears, input.ExperienceMonths, input.Gender, input.Age, timeNow)
	if err := row.Scan(&userId); err != nil {
		tx.Rollback()
		if isUniqueViolation(err) {
			return 0, gameServer.ErrDuplicateLogin
		}
		return 0, err
	}

	query = fmt.Sprintf("INSERT INTO %s (score, user_id, parameter_set_id, is_training, training_start_time, game_start_time, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)", userParameterSetsTable)
	_, err = tx.Exec(query, 0, userId, parSetId, true, nil, nil, timeNow)
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	if input.GroupId != nil {
		query = fmt.Sprintf("INSERT INTO %s (user_id, group_id) VALUES ($1, $2)", userGroupsTable)
		_, err = tx.Exec(query, userId, *input.GroupId)
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

func (u *UserPostgres) CountUsersByRole(role string) (int, error) {
	var count int
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE role=$1", usersTable)
	err := u.db.QueryRow(query, role).Scan(&count)

	return count, err
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

	if input.Name != nil {
		setValues = append(setValues, fmt.Sprintf("name=$%d", argId))
		args = append(args, *input.Name)
		argId++
	}

	if input.Profession != nil {
		setValues = append(setValues, fmt.Sprintf("profession=$%d", argId))
		args = append(args, *input.Profession)
		argId++
	}

	if input.ExperienceYears != nil {
		setValues = append(setValues, fmt.Sprintf("experience_years=$%d", argId))
		args = append(args, *input.ExperienceYears)
		argId++
	}

	if input.ExperienceMonths != nil {
		setValues = append(setValues, fmt.Sprintf("experience_months=$%d", argId))
		args = append(args, *input.ExperienceMonths)
		argId++
	}

	if input.Gender != nil {
		setValues = append(setValues, fmt.Sprintf("gender=$%d", argId))
		args = append(args, *input.Gender)
		argId++
	}

	if input.Age != nil {
		setValues = append(setValues, fmt.Sprintf("age=$%d", argId))
		args = append(args, *input.Age)
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
	var args []any

	switch input.FilterTag {
	case "login":
		{
			query = fmt.Sprintf("SELECT user_id, login, name, role, cur_par_set_id, profession, experience_years, experience_months, gender, age, created_at FROM %s WHERE login LIKE $1 ORDER BY %s OFFSET %v LIMIT %v", usersTable, input.OrderByClause(""), (input.CurrentPage-1)*gameServer.DefaultPageLimit, gameServer.DefaultPageLimit)
			args = []any{likePattern(input.FilterValue)}
		}
	case "group_name":
		{
			query = fmt.Sprintf(
				`SELECT ut.user_id, ut.login, ut.name, ut.role, ut.cur_par_set_id, ut.profession, ut.experience_years, ut.experience_months, ut.gender, ut.age, ut.created_at
				 FROM %s AS gt
				 JOIN %s AS ugt ON gt.id=ugt.group_id
				 JOIN %s AS ut ON ugt.user_id=ut.user_id
				 WHERE gt.name LIKE $1 ORDER BY %s OFFSET %v LIMIT %v`,
				groupsTable, userGroupsTable, usersTable, input.OrderByClause("ut"), (input.CurrentPage-1)*gameServer.DefaultPageLimit, gameServer.DefaultPageLimit)
			args = []any{likePattern(input.FilterValue)}
		}
	case "user_name":
		{
			query = fmt.Sprintf("SELECT user_id, login, name, role, cur_par_set_id, profession, experience_years, experience_months, gender, age, created_at FROM %s WHERE name LIKE $1 ORDER BY %s OFFSET %v LIMIT %v", usersTable, input.OrderByClause(""), (input.CurrentPage-1)*gameServer.DefaultPageLimit, gameServer.DefaultPageLimit)
			args = []any{likePattern(input.FilterValue)}
		}
	default:
		{
			query = fmt.Sprintf("SELECT user_id, login, name, role, cur_par_set_id, profession, experience_years, experience_months, gender, age, created_at FROM %s ORDER BY %s OFFSET %v LIMIT %v", usersTable, input.OrderByClause(""), (input.CurrentPage-1)*gameServer.DefaultPageLimit, gameServer.DefaultPageLimit)
		}
	}

	err := u.db.Select(&users, query, args...)

	return users, err

}

func (u *UserPostgres) GetOneUser(id int) (gameServer.User, error) {
	var user gameServer.User
	query := fmt.Sprintf("SELECT user_id, login, name, role, cur_par_set_id, profession, experience_years, experience_months, gender, age, created_at FROM %s WHERE user_id=$1", usersTable)
	err := u.db.Get(&user, query, id)

	return user, err
}

func (u *UserPostgres) GetUsersCount(input gameServer.GetUsersPageCountInput) (int, error) {
	var usersCount int
	var query string
	var args []any

	switch input.FilterTag {
	case "login":
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE login LIKE $1", usersTable)
			args = []any{likePattern(input.FilterValue)}
		}
	case "group_name":
		{
			query = fmt.Sprintf(
				`SELECT COUNT(*)
				 FROM %s AS gt
				 JOIN %s AS ugt ON gt.id=ugt.group_id
				 JOIN %s AS ut ON ugt.user_id=ut.user_id
				 WHERE gt.name LIKE $1`,
				groupsTable, userGroupsTable, usersTable)
			args = []any{likePattern(input.FilterValue)}
		}
	case "user_name":
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE name LIKE $1", usersTable)
			args = []any{likePattern(input.FilterValue)}
		}
	default:
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s", usersTable)
		}
	}

	row := u.db.QueryRow(query, args...)
	if err := row.Scan(&usersCount); err != nil {
		return 0, err
	}

	return usersCount, nil
}

func (u *UserPostgres) GetParSet(id int) (gameServer.ParameterSet, error) {
	var parSet gameServer.ParameterSet
	query := fmt.Sprintf("SELECT %s FROM %s AS pst JOIN %s AS ut ON ut.cur_par_set_id=pst.id WHERE ut.user_id=$1", parSetAliasedColumns, parameterSetsTable, usersTable)

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

func (u *UserPostgres) GetUserParameterSet(userId, parSetId int) (gameServer.UserParameterSet, error) {
	var ups gameServer.UserParameterSet
	query := fmt.Sprintf("SELECT score, is_training, training_start_time, game_start_time, created_at FROM %s WHERE user_id=$1 AND parameter_set_id=$2", userParameterSetsTable)

	err := u.db.Get(&ups, query, userId, parSetId)
	if err != nil {
		return ups, err
	}

	return ups, nil
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
	query := fmt.Sprintf(
		`SELECT gt.id, gt.name, gt.created_at, gt.creator_id, gt.parameter_set_id,
			COALESCE(ut.name, '') AS creator_name,
			(SELECT COUNT(*) FROM %s AS ugt WHERE ugt.group_id = gt.id) AS members_count
		 FROM %s AS gt
		 LEFT JOIN %s AS ut ON ut.user_id = gt.creator_id`,
		userGroupsTable, groupsTable, usersTable)

	err := u.db.Select(&groups, query)

	return groups, err
}

func (u *UserPostgres) UpdateGroup(id int, input gameServer.UpdateGroupInput) error {
	query := fmt.Sprintf("UPDATE %s SET name=$1 WHERE id=$2", groupsTable)
	_, err := u.db.Exec(query, input.Name, id)
	if err != nil && isUniqueViolation(err) {
		return gameServer.ErrDuplicateGroupName
	}
	return err
}

func (u *UserPostgres) DeleteGroup(id int) error {
	tx, err := u.db.Beginx()
	if err != nil {
		return err
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE group_id=$1", userGroupsTable)
	if _, err = tx.Exec(query, id); err != nil {
		tx.Rollback()
		return err
	}

	query = fmt.Sprintf("DELETE FROM %s WHERE id=$1", groupsTable)
	if _, err = tx.Exec(query, id); err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}

func (u *UserPostgres) CreateGroup(input gameServer.CreateGroupInput) (int, error) {
	var id int
	query := fmt.Sprintf("INSERT INTO %s (name, creator_id, parameter_set_id, created_at) VALUES ($1, $2, $3, $4) RETURNING id", groupsTable)

	timeNow := gameServer.Now()
	row := u.db.QueryRow(query, input.Name, input.CreatorId, input.ParSetId, timeNow)
	if err := row.Scan(&id); err != nil {
		return 0, err
	}

	return id, nil
}

func (u *UserPostgres) GetPlayersStat(input gameServer.GetPlayersStatInput) ([]gameServer.PlayerStat, error) {
	var playerStats []gameServer.PlayerStat

	var users []gameServer.User
	var query string
	var args []any

	switch input.FilterTag {
	case "login":
		{
			query = fmt.Sprintf("SELECT user_id, login, name, role, cur_par_set_id, created_at FROM %s WHERE login LIKE $1 AND role=$2 ORDER BY name OFFSET %v LIMIT %v", usersTable, (input.CurrentPage-1)*gameServer.DefaultPageLimit, gameServer.DefaultPageLimit)
			args = []any{likePattern(input.FilterValue), gameServer.RoleUser}
		}
	case "group_name":
		{
			query = fmt.Sprintf(
				`SELECT ut.user_id, ut.login, ut.name, ut.role, ut.cur_par_set_id, ut.created_at
				 FROM %s AS gt
				 JOIN %s AS ugt ON gt.id=ugt.group_id
				 JOIN %s AS ut ON ugt.user_id=ut.user_id
				 WHERE gt.name LIKE $1 AND role=$2
				 ORDER BY name 
				 OFFSET %v LIMIT %v`,
				groupsTable, userGroupsTable, usersTable, (input.CurrentPage-1)*gameServer.DefaultPageLimit, gameServer.DefaultPageLimit)
			args = []any{input.FilterValue, gameServer.RoleUser}
		}
	case "user_name":
		{
			query = fmt.Sprintf("SELECT user_id, login, name, role, cur_par_set_id, created_at FROM %s WHERE name LIKE $1 AND role=$2 ORDER BY name OFFSET %v LIMIT %v", usersTable, (input.CurrentPage-1)*gameServer.DefaultPageLimit, gameServer.DefaultPageLimit)
			args = []any{likePattern(input.FilterValue), gameServer.RoleUser}
		}
	default:
		{
			query = fmt.Sprintf("SELECT user_id, login, name, role, cur_par_set_id, created_at FROM %s WHERE role=$1 ORDER BY name OFFSET %v LIMIT %v", usersTable, (input.CurrentPage-1)*gameServer.DefaultPageLimit, gameServer.DefaultPageLimit)
			args = []any{gameServer.RoleUser}
		}
	}

	err := u.db.Select(&users, query, args...)
	if err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return playerStats, nil
	}

	userIds := make([]int, len(users))
	for i, user := range users {
		userIds[i] = user.Id
	}

	type parSetRow struct {
		gameServer.ParameterSet
		UserId int `db:"user_id"`
	}

	var rows []parSetRow
	query = fmt.Sprintf(
		"SELECT upst.user_id, %s FROM %s AS pst JOIN %s AS upst ON pst.id=upst.parameter_set_id WHERE upst.user_id = ANY($1)",
		parSetAliasedColumns, parameterSetsTable, userParameterSetsTable)
	err = u.db.Select(&rows, query, pq.Array(userIds))
	if err != nil {
		return nil, err
	}

	parSetsByUser := make(map[int][]gameServer.ParameterSet, len(users))
	for _, row := range rows {
		parSetsByUser[row.UserId] = append(parSetsByUser[row.UserId], row.ParameterSet)
	}

	for _, user := range users {
		playerStats = append(playerStats, gameServer.PlayerStat{
			Id:          user.Id,
			Name:        user.Name,
			Login:       user.Login,
			CurParSetId: user.CurParSetId,
			ParSets:     parSetsByUser[user.Id],
		})
	}

	return playerStats, nil
}

func (u *UserPostgres) GetPlayersPageCount(input gameServer.GetPlayersPageCountInput) (int, error) {
	var playersCount int
	var query string
	var args []any

	switch input.FilterTag {
	case "login":
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE login LIKE $1 AND role=$2", usersTable)
			args = []any{likePattern(input.FilterValue), gameServer.RoleUser}
		}
	case "group_name":
		{
			query = fmt.Sprintf(
				`SELECT COUNT(*)
				 FROM %s AS gt
				 JOIN %s AS ugt ON gt.id=ugt.group_id
				 JOIN %s AS ut ON ugt.user_id=ut.user_id
				 WHERE gt.name LIKE $1 AND role=$2`,
				groupsTable, userGroupsTable, usersTable)
			args = []any{likePattern(input.FilterValue), gameServer.RoleUser}
		}
	case "user_name":
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE name LIKE $1 AND role=$2", usersTable)
			args = []any{likePattern(input.FilterValue), gameServer.RoleUser}
		}
	default:
		{
			query = fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE role=$1", usersTable)
			args = []any{gameServer.RoleUser}
		}
	}

	row := u.db.QueryRow(query, args...)
	if err := row.Scan(&playersCount); err != nil {
		return 0, err
	}

	return playersCount, nil
}

func (u *UserPostgres) GetPlayersPointsWithEvents(input gameServer.GetPlayersEventsInput) ([]gameServer.Point, error) {
	var points []gameServer.Point
	var query string

	switch input.GroupedBy {
	case "stop":
		{
			query = fmt.Sprintf(`
				SELECT y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, chart_id, check_info
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_stop
				ORDER BY chart_id, x ASC
				OFFSET %v LIMIT %v
			`, pointsTable, chartsTable, (input.CurrentPage-1)*gameServer.PlayerEventsPageLimit, gameServer.PlayerEventsPageLimit)
		}
	case "pause":
		{
			query = fmt.Sprintf(`
				SELECT y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, chart_id, check_info
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_pause
				ORDER BY chart_id, x ASC
				OFFSET %v LIMIT %v
			`, pointsTable, chartsTable, (input.CurrentPage-1)*gameServer.PlayerEventsPageLimit, gameServer.PlayerEventsPageLimit)
		}
	case "check":
		{
			query = fmt.Sprintf(`
				SELECT y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, chart_id, check_info
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_check
				ORDER BY chart_id, x ASC
				OFFSET %v LIMIT %v
			`, pointsTable, chartsTable, (input.CurrentPage-1)*gameServer.PlayerEventsPageLimit, gameServer.PlayerEventsPageLimit)
		}
	case "reject_advice":
		{
			query = fmt.Sprintf(`
				SELECT y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, chart_id, check_info
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND (is_useful_ai_signal OR is_deceptive_ai_signal)
				AND NOT is_stop
				ORDER BY chart_id, x ASC
				OFFSET %v LIMIT %v
			`, pointsTable, chartsTable, (input.CurrentPage-1)*gameServer.PlayerEventsPageLimit, gameServer.PlayerEventsPageLimit)
		}
	default:
		{
			query = fmt.Sprintf(`
				SELECT y, score, is_crash, is_useful_ai_signal, is_deceptive_ai_signal, is_stop, is_pause, is_check, chart_id, check_info
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND (is_crash OR is_useful_ai_signal OR is_deceptive_ai_signal OR is_stop OR is_pause OR is_check)
				ORDER BY chart_id, x ASC
				OFFSET %v LIMIT %v
			`, pointsTable, chartsTable, (input.CurrentPage-1)*gameServer.PlayerEventsPageLimit, gameServer.PlayerEventsPageLimit)
		}
	}

	err := u.db.Select(&points, query, input.UserId, input.ParSetId)

	return points, err
}

func (u *UserPostgres) GetPlayersPointsWithEventsPageCount(input gameServer.GetPlayersEventsPageCountInput) (int, error) {
	var eventsCount int
	var query string

	switch input.GroupedBy {
	case "stop":
		{
			query = fmt.Sprintf(`
				SELECT COUNT(*)
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_stop
			`, pointsTable, chartsTable)
		}
	case "pause":
		{
			query = fmt.Sprintf(`
				SELECT COUNT(*)
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_pause
			`, pointsTable, chartsTable)
		}
	case "check":
		{
			query = fmt.Sprintf(`
				SELECT COUNT(*)
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND is_check
			`, pointsTable, chartsTable)
		}
	case "reject_advice":
		{
			query = fmt.Sprintf(`
				SELECT COUNT(*)
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND (is_useful_ai_signal OR is_deceptive_ai_signal)
				AND NOT is_stop
			`, pointsTable, chartsTable)
		}
	default:
		{
			query = fmt.Sprintf(`
				SELECT COUNT(*)
				FROM %s
				WHERE chart_id IN ( 
					SELECT id
					FROM %s
					WHERE user_id = $1
					AND parameter_set_id = $2
					AND NOT is_training
				)
				AND (is_crash OR is_useful_ai_signal OR is_deceptive_ai_signal OR is_stop OR is_pause OR is_check)
			`, pointsTable, chartsTable)
		}
	}

	row := u.db.QueryRow(query, input.UserId, input.ParSetId)
	if err := row.Scan(&eventsCount); err != nil {
		return 0, err
	}

	return eventsCount, nil
}

func (u *UserPostgres) UpdateUserParSet(id int, input gameServer.UpdateUserParSetInput) error {
	tx, err := u.db.Beginx()
	if err != nil {
		return err
	}

	query := fmt.Sprintf("UPDATE %s SET cur_par_set_id = $1 WHERE user_id=$2", usersTable)
	_, err = tx.Exec(query, input.ParSetId, id)
	if err != nil {
		tx.Rollback()
		return err
	}

	timeNow := gameServer.Now()
	query = fmt.Sprintf("INSERT INTO %s (score, user_id, parameter_set_id, is_training, training_start_time, game_start_time, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING", userParameterSetsTable)
	_, err = tx.Exec(query, 0, id, input.ParSetId, true, nil, nil, timeNow)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}

func (u *UserPostgres) UpdateUserUserParSet(id int, input gameServer.UpdateUserUserParSetInput) error {
	setValues := make([]string, 0)
	args := make([]any, 0)
	argId := 1

	if input.IsTraining != nil {
		setValues = append(setValues, fmt.Sprintf("is_training=$%d", argId))
		args = append(args, *input.IsTraining)
		argId++
	}

	if input.TrainingStartTime != nil {
		setValues = append(setValues, fmt.Sprintf("training_start_time=$%d", argId))
		args = append(args, *input.TrainingStartTime)
		argId++
	}

	if input.GameStartTime != nil {
		setValues = append(setValues, fmt.Sprintf("game_start_time=$%d", argId))
		args = append(args, *input.GameStartTime)
		argId++
	}

	setQuery := strings.Join(setValues, ", ")

	query := fmt.Sprintf("UPDATE %s SET %s WHERE user_id=$%d AND parameter_set_id=$%d", userParameterSetsTable, setQuery, argId, argId+1)
	args = append(args, id, input.ParSetId)

	_, err := u.db.Exec(query, args...)
	return err
}

func (u *UserPostgres) ChangeGroupParSet(input gameServer.ChangeGroupParSetInput) error {
	tx, err := u.db.Beginx()
	if err != nil {
		return err
	}

	query := fmt.Sprintf("UPDATE %s SET parameter_set_id=$1 WHERE id=$2", groupsTable)
	_, err = tx.Exec(query, input.ParSetId, input.GroupId)
	if err != nil {
		tx.Rollback()
		return err
	}

	userIds := make([]int, 0)
	query = fmt.Sprintf("SELECT user_id FROM %s WHERE group_id=$1", userGroupsTable)
	err = tx.Select(&userIds, query, input.GroupId)
	if err != nil {
		tx.Rollback()
		return err
	}

	for _, userId := range userIds {
		query = fmt.Sprintf("UPDATE %s SET cur_par_set_id=$1 WHERE user_id=$2", usersTable)
		_, err = tx.Exec(query, input.ParSetId, userId)
		if err != nil {
			tx.Rollback()
			return err
		}

		timeNow := gameServer.Now()
		query = fmt.Sprintf("INSERT INTO %s (score, user_id, parameter_set_id, is_training, training_start_time, game_start_time, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING", userParameterSetsTable)
		_, err = tx.Exec(query, 0, userId, input.ParSetId, true, nil, nil, timeNow)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}