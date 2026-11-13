-- Очередь пар (игрок, набор параметров), чью статистику нужно пересчитать.
-- Хранится в БД, чтобы переживать рестарты сервера.
CREATE TABLE statistics_dirty
(
    user_id          int       NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    parameter_set_id int       NOT NULL REFERENCES parameter_sets (id) ON DELETE CASCADE,
    marked_at        timestamp NOT NULL,
    PRIMARY KEY (user_id, parameter_set_id)
);
