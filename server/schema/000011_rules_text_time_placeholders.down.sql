UPDATE parameter_sets
SET rules_text = replace(
    replace(rules_text,
        'не более {{TRAINING_LIMIT_MIN}} минут', 'не более 10 минут'),
    'через {{GAME_LIMIT_MIN}} минут', 'через 45 минут')
WHERE rules_text LIKE '%{{TRAINING_LIMIT_MIN}}%' OR rules_text LIKE '%{{GAME_LIMIT_MIN}}%';
