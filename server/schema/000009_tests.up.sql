CREATE TABLE tests
(
    id          serial       PRIMARY KEY,
    slug        varchar(100) NOT NULL UNIQUE,
    title       varchar(255) NOT NULL,
    description text         NOT NULL DEFAULT '',
    config      jsonb        NOT NULL DEFAULT '{}',
    is_active   boolean      NOT NULL DEFAULT true,
    sort_order  int          NOT NULL DEFAULT 0,
    created_at  timestamp    NOT NULL,
    updated_at  timestamp    NOT NULL
);

CREATE TABLE test_results
(
    id           serial    PRIMARY KEY,
    user_id      int       NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    test_id      int       NOT NULL REFERENCES tests (id) ON DELETE CASCADE,
    answers      jsonb     NOT NULL,
    score        float,
    completed_at timestamp NOT NULL,
    UNIQUE (user_id, test_id)
);

CREATE INDEX idx_tests_is_active_sort_order ON tests (is_active, sort_order);
CREATE INDEX idx_test_results_user_id ON test_results (user_id);
