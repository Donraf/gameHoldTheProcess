ALTER TABLE parameter_sets
    ADD COLUMN scoring_config jsonb       NOT NULL DEFAULT '{
        "bonus_step": 50,
        "bonus_reject_incorrect_advice_with_check": 1000,
        "bonus_reject_incorrect_advice_no_check": 2000,
        "bonus_accept_correct_advice_with_check": 250,
        "bonus_accept_correct_advice_no_check": 500,
        "penalty_reject_correct_advice_with_check": 4000,
        "penalty_reject_correct_advice_no_check": 2000,
        "penalty_accept_incorrect_advice_with_check": 2000,
        "penalty_accept_incorrect_advice_no_check": 1000,
        "penalty_incorrect_stop_no_advice": 2000,
        "penalty_explosion_no_advice": 0,
        "penalty_pause": 50
    }'::jsonb,
    ADD COLUMN hint_cost              float NOT NULL DEFAULT 250,
    ADD COLUMN false_alarm_threshold  float NOT NULL DEFAULT 0.9,
    ADD COLUMN rules_text             text  NOT NULL DEFAULT '';
