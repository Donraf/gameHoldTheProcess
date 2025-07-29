const {Point, User, Chart} = require('../models/models');
const ApiError = require('../error/ApiError');
const {Op} = require("sequelize");

class PointController {
    async create(req, res, next) {
        try {
            const {
                chart_id,
                x,
                y,
                score,
                is_end,
                is_crash,
                is_useful_ai_signal,
                is_deceptive_ai_signal,
                is_stop,
                is_pause,
                is_check,
            } = req.body;
            const point = await Point.create({chart_id: chart_id, x: x, y: y,
                score: score, is_end: is_end, is_crash: is_crash, is_useful_ai_signal: is_useful_ai_signal,
                is_deceptive_ai_signal:is_deceptive_ai_signal, is_pause:is_pause, is_stop: is_stop,
                is_check: is_check});
            return res.json(point);
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async getOne(req, res, next) {
        try {
            const {id} = req.params
            const point = await Point.findByPk(id)
            return res.json(point)
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async getAllById(req, res, next) {
        try {
            const points = await Point.findAll({
                where: {
                    chart_id: { [Op.eq]: req.params.chart_id },
                }
            });
            return res.json(points);
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async getAll(req, res, next) {
        try {
            const points = await Point.findAll();
            return res.json(points);
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async getAllInCsv(req, res, next) {
        try {
            let csv = ""
            const users = await User.findAll()
            for (let i = 0; i < users.length; i++) {
                let user = users[i];
                let charts = await Chart.findAll({
                    where: {
                        user_id: { [Op.eq]: user.user_id}
                    }
                })
                for (let j = 0; j < charts.length; j++) {
                    let chart = charts[j];
                    let points = await Point.findAll({
                        where: {
                            chart_id: { [Op.eq]: chart.id }
                        }
                    });
                    if (points.length === 0) { return res.json([]); }
                    if (csv.length === 0) {
                        csv = Object.keys(points[0].dataValues).join(',') + ",user_id" + "\r\n"
                    }
                    points.map((point) => {
                        csv += Object.values(point.dataValues).join(',') + "," + user.user_id + "\r\n"
                    });
                }
            }
            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', 'attachment')
            res.attachment('points.csv');
            return res.send(csv);
        } catch (e) {
            return next(ApiError.badRequest("Bad Request " + e));
        }
    }

    async delete(req, res, next) {
        try {
            const {id} = req.params
            const point = await Point.findByPk(id)
            if (!point) {
                return next(ApiError.badRequest("unknown point"));
            }
            await point.destroy()
            return res.json({message: "successfully deleted"})
        } catch (e) {
            if (e.name && e.name === "SequelizeForeignKeyConstraintError") {
                return next(ApiError.constraintFailed("Нарушение ограничений: " + e.parent.detail));
            }
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async update(req, res, next) {
        try {
            const {id} = req.params
            const point = await Point.findByPk(id)
            await point.update(req.body)
            return res.json(point)
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }
}

module.exports = new PointController();