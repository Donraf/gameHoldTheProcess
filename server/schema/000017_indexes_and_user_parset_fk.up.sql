-- Индексы под горячие выборки: статистика, история игр, состав групп.
CREATE INDEX idx_points_chart_id ON points (chart_id);
CREATE INDEX idx_charts_user_parset ON charts (user_id, parameter_set_id);
CREATE INDEX idx_user_groups_group_id ON user_groups (group_id);

-- Текущий набор параметров пользователя должен ссылаться на существующий набор.
ALTER TABLE ONLY users
    ADD CONSTRAINT users_cur_par_set_id_fkey
    FOREIGN KEY (cur_par_set_id) REFERENCES parameter_sets (id) ON DELETE NO ACTION;
