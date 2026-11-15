-- Суррогатный первичный ключ в user_parameter_sets: после слияния аккаунтов
-- у одного пользователя может оказаться несколько игр по одному набору параметров.
-- Serial-колонка автоматически заполняется для существующих строк.
ALTER TABLE user_parameter_sets
    ADD COLUMN id serial;

ALTER TABLE user_parameter_sets
    DROP CONSTRAINT user_parameter_sets_pkey;

ALTER TABLE user_parameter_sets
    ADD PRIMARY KEY (id);

CREATE INDEX idx_user_parameter_sets_user_parset ON user_parameter_sets (user_id, parameter_set_id);
