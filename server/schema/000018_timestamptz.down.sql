ALTER TABLE users ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';
ALTER TABLE parameter_sets ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';
ALTER TABLE groups ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';

ALTER TABLE user_parameter_sets ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';
ALTER TABLE user_parameter_sets ALTER COLUMN training_start_time TYPE timestamp USING training_start_time AT TIME ZONE 'UTC';
ALTER TABLE user_parameter_sets ALTER COLUMN game_start_time TYPE timestamp USING game_start_time AT TIME ZONE 'UTC';

ALTER TABLE charts ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';
ALTER TABLE points ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';

ALTER TABLE tests ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC';
ALTER TABLE tests ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE test_results ALTER COLUMN completed_at TYPE timestamp USING completed_at AT TIME ZONE 'UTC';

ALTER TABLE statistics_dirty ALTER COLUMN marked_at TYPE timestamp USING marked_at AT TIME ZONE 'UTC';
