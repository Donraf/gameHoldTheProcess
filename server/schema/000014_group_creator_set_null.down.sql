ALTER TABLE ONLY Groups
    DROP CONSTRAINT groups_creator_id_fkey;

ALTER TABLE ONLY Groups
    ADD CONSTRAINT groups_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES Users (user_id);

ALTER TABLE ONLY Groups
    ALTER COLUMN creator_id SET NOT NULL;
