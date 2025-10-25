ALTER TABLE ONLY User_Groups
    DROP CONSTRAINT user_groups_user_id_fkey;
ALTER TABLE ONLY User_Groups
    ADD CONSTRAINT user_groups_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE;

ALTER TABLE ONLY User_Parameter_Sets
    DROP CONSTRAINT user_parameter_sets_user_id_fkey;
ALTER TABLE ONLY User_Parameter_Sets
    ADD CONSTRAINT user_parameter_sets_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE;

ALTER TABLE ONLY Charts
    DROP CONSTRAINT charts_user_id_fkey;
ALTER TABLE ONLY Charts
    ADD CONSTRAINT charts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE;

ALTER TABLE ONLY Statistics
    DROP CONSTRAINT statistics_user_id_fkey;
ALTER TABLE ONLY Statistics
    ADD CONSTRAINT statistics_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE CASCADE;