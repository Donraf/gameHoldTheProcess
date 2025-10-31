ALTER TABLE Statistics
    ADD COLUMN stop_on_signal_num int default 0,
    ADD COLUMN stop_without_signal_num int default 0,
    ADD COLUMN hint_on_signal_num int default 0,
    ADD COLUMN hint_without_signal_num int default 0,
    ADD COLUMN continue_after_signal_num int default 0,
    ADD COLUMN total_score int default 0;

ALTER TABLE Points
    ADD COLUMN check_info varchar(255);
