ALTER TABLE parameter_sets
    DROP COLUMN IF EXISTS scoring_config,
    DROP COLUMN IF EXISTS hint_cost,
    DROP COLUMN IF EXISTS false_alarm_threshold,
    DROP COLUMN IF EXISTS rules_text;
