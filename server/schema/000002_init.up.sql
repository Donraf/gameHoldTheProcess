CREATE TABLE Statistics
(
    games_num                   int,
    stops_num                   int,
    crashes_num                 int,
    mean_stop_on_signal         float,
    stdev_stop_on_signal        float,
    mean_stop_without_signal    float,
    stdev_stop_without_signal   float,
    mean_hint_on_signal         float,
    stdev_hint_on_signal        float,
    mean_hint_without_signal    float,
    stdev_hint_without_signal   float,
    mean_continue_after_signal  float,
    stdev_continue_after_signal float,
    user_id                     int REFERENCES Users (user_id)     NOT NULL,
    parameter_set_id            int REFERENCES Parameter_Sets (id) NOT NULL,
    PRIMARY KEY (user_id, parameter_set_id)
);
