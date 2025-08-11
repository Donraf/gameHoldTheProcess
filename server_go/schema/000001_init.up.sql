CREATE TABLE Users
(
    user_id        serial       PRIMARY KEY,
    login          varchar(255) NOT NULL UNIQUE,
    password       varchar(255) NOT NULL,
    role           varchar(255) NOT NULL,
    cur_par_set_id int          NOT NULL,
    createdAt      timestamp    NOT NULL,
    updatedAt      timestamp    NOT NULL
);

CREATE TABLE ParameterSets
(
    id         serial    PRIMARY KEY,
    gain_coef  float     NOT NULL,
    time_const float     NOT NULL,
    noise_coef float     NOT NULL,
    createdAt  timestamp NOT NULL,
    updatedAt  timestamp NOT NULL
);

CREATE TABLE UserParameterSets
(
    score            int                               NOT NULL,
    createdAt        timestamp                         NOT NULL,
    updatedAt        timestamp                         NOT NULL,
    user_id          int REFERENCES Users (user_id)    NOT NULL,
    parameter_set_id int REFERENCES ParameterSets (id) NOT NULL,
    PRIMARY KEY (user_id, parameter_set_id)
);

CREATE TABLE Charts
(
    id               serial                                                PRIMARY KEY,
    createdAt        timestamp                                             NOT NULL,
    updatedAt        timestamp                                             NOT NULL,
    parameter_set_id int REFERENCES ParameterSets (id) ON DELETE NO ACTION NOT NULL,
    user_id          int REFERENCES Users (user_id) ON DELETE NO ACTION    NOT NULL
);

CREATE TABLE Points
(
    id                     serial                                       PRIMARY KEY,
    x                      float                                        NOT NULL,
    y                      float                                        NOT NULL,
    score                  float                                        NOT NULL,
    is_end                 boolean                                      NOT NULL,
    is_crash               boolean                                      NOT NULL,
    is_useful_ai_signal    boolean                                      NOT NULL,
    is_deceptive_ai_signal boolean                                      NOT NULL,
    is_stop                boolean                                      NOT NULL,
    is_pause               boolean                                      NOT NULL,
    is_check               boolean                                      NOT NULL,
    createdAt              timestamp                                    NOT NULL,
    updatedAt              timestamp                                    NOT NULL,
    chart_id               int REFERENCES Charts (id) ON DELETE CASCADE NOT NULL
);
