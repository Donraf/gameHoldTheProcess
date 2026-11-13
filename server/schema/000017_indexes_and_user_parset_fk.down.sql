ALTER TABLE ONLY users
    DROP CONSTRAINT users_cur_par_set_id_fkey;

DROP INDEX idx_user_groups_group_id;
DROP INDEX idx_charts_user_parset;
DROP INDEX idx_points_chart_id;
