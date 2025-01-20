const {Point} = require('../models/models');
const ApiError = require('../error/ApiError');

class PointController {
    async create(req, res, next) {
        try {
            const {
                chart_id,
                x,
                y,
                is_end,
                is_crash,
                is_ai_signal,
                is_stop,
                is_check,
            } = req.body;
            const point = await Point.create({chart_id: chart_id, x: x, y: y,
                is_end: is_end, is_crash: is_crash, is_ai_signal: is_ai_signal, is_stop: is_stop, is_check: is_check});
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

    async getAll(req, res, next) {
        try {
            const points = await Point.findAll();
            return res.json(points);
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
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