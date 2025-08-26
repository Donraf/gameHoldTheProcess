CREATE TABLE Users
(
    user_id        serial       PRIMARY KEY,
    login          varchar(255) NOT NULL UNIQUE,
    password       varchar(255) NOT NULL,
    name           varchar(255) NOT NULL,
    role           varchar(255) NOT NULL,
    cur_par_set_id int          NOT NULL,
    created_at     timestamp    NOT NULL
);

CREATE TABLE Groups
(
    id         serial                         PRIMARY KEY,
    name       varchar(255)                   NOT NULL UNIQUE,
    created_at timestamp                      NOT NULL,
    creator_id int REFERENCES Users (user_id) NOT NULL
);

CREATE TABLE User_Groups
(
    user_id  int REFERENCES Users (user_id) NOT NULL,
    group_id int REFERENCES Groups (id)     NOT NULL,
    PRIMARY KEY (user_id, group_id)
);

CREATE TABLE Parameter_Sets
(
    id                  serial    PRIMARY KEY,
    gain_coef           float     NOT NULL,
    time_const          float     NOT NULL,
    noise_coef          float     NOT NULL,
    false_warning_prob  float     NOT NULL,
    missing_danger_prob float     NOT NULL,
    created_at          timestamp NOT NULL
);

CREATE TABLE User_Parameter_Sets
(
    score            int                                NOT NULL,
    created_at       timestamp                          NOT NULL,
    user_id          int REFERENCES Users (user_id)     NOT NULL,
    parameter_set_id int REFERENCES Parameter_Sets (id) NOT NULL,
    PRIMARY KEY (user_id, parameter_set_id)
);

CREATE TABLE Charts
(
    id               serial                                                 PRIMARY KEY,
    created_at       timestamp                                              NOT NULL,
    parameter_set_id int REFERENCES Parameter_Sets (id) ON DELETE NO ACTION NOT NULL,
    user_id          int REFERENCES Users (user_id) ON DELETE NO ACTION     NOT NULL
);

CREATE TABLE Points
(
    id                     serial                                       PRIMARY KEY,
    x                      float                                        NOT NULL,
    y                      float                                        NOT NULL,
    score                  float                                        NOT NULL,
    is_crash               boolean                                      NOT NULL,
    is_useful_ai_signal    boolean                                      NOT NULL,
    is_deceptive_ai_signal boolean                                      NOT NULL,
    is_stop                boolean                                      NOT NULL,
    is_pause               boolean                                      NOT NULL,
    is_check               boolean                                      NOT NULL,
    created_at             timestamp                                    NOT NULL,
    chart_id               int REFERENCES Charts (id) ON DELETE CASCADE NOT NULL
);

INSERT INTO Parameter_Sets (id, gain_coef, time_const, noise_coef, false_warning_prob, missing_danger_prob, created_at)
    VALUES 
    (1, 0.92, 20, 0.03, 0.05, 0.1, '2025-08-12 18:50:37.359879');

INSERT INTO Users (login, password, name, role, cur_par_set_id, created_at)
    VALUES 
    ('admin', '3977434d73306272346e626430366432396b4177374d7a473665564771474577d033e22ae348aeb5660fc2140aec35850c4da997', 'Максим', 'ADMIN', 1, '2025-08-12 18:50:37.359879');

INSERT INTO User_Parameter_Sets (user_id, parameter_set_id, score, created_at)
    VALUES 
    (1, 1, 1000, '2025-08-12 18:50:37.359879');

