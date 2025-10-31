ALTER TABLE Statistics
    DROP COLUMN stop_on_signal_num,
    DROP COLUMN stop_without_signal_num,
    DROP COLUMN hint_on_signal_num,
    DROP COLUMN hint_without_signal_num,
    DROP COLUMN continue_after_signal_num,
    DROP COLUMN total_score;

ALTER TABLE Points
    DROP COLUMN check_info;
