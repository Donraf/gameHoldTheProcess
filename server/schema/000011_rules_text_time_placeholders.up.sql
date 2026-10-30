UPDATE parameter_sets
SET rules_text = replace(
    replace(rules_text,
        'не более 15 минут', 'не более {{TRAINING_LIMIT_MIN}} минут'),
    'через 60 минут', 'через {{GAME_LIMIT_MIN}} минут')
WHERE rules_text LIKE '%не более 15 минут%' OR rules_text LIKE '%через 60 минут%';

UPDATE parameter_sets
SET rules_text = replace(
    replace(rules_text,
        'не более 10 минут', 'не более {{TRAINING_LIMIT_MIN}} минут'),
    'через 45 минут', 'через {{GAME_LIMIT_MIN}} минут')
WHERE rules_text LIKE '%не более 10 минут%' OR rules_text LIKE '%через 45 минут%';
