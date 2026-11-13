ALTER TABLE parameter_sets
    ADD COLUMN name varchar(255) NOT NULL DEFAULT '';

UPDATE parameter_sets
SET name = 'Набор №' || id
WHERE name = '';

ALTER TABLE parameter_sets
    ALTER COLUMN name DROP DEFAULT;
