-- Откат: оставляем по одной (самой свежей) строке на пару (user_id, parameter_set_id),
-- затем возвращаем составной первичный ключ.
DELETE FROM user_parameter_sets a
    USING user_parameter_sets b
    WHERE a.user_id = b.user_id
      AND a.parameter_set_id = b.parameter_set_id
      AND a.id < b.id;

DROP INDEX idx_user_parameter_sets_user_parset;

ALTER TABLE user_parameter_sets
    DROP CONSTRAINT user_parameter_sets_pkey;

ALTER TABLE user_parameter_sets
    DROP COLUMN id;

ALTER TABLE user_parameter_sets
    ADD PRIMARY KEY (user_id, parameter_set_id);
