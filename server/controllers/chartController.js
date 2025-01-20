const {Chart} = require('../models/models');
const ApiError = require('../error/ApiError');

class ChartController {
    async create(req, res, next) {
        try {
            const {user_id} = req.body;
            const chart = await Chart.create({user_id: user_id});
            return res.json(chart);
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async getOne(req, res, next) {
        try {
            const {id} = req.params
            const chart = await Chart.findByPk(id)
            return res.json(chart)
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async getAll(req, res, next) {
        try {
            const charts = await Chart.findAll();
            return res.json(charts);
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async delete(req, res, next) {
        try {
            const {id} = req.params
            const chart = await Chart.findByPk(id)
            if (!chart) {
                return next(ApiError.badRequest("unknown chart"));
            }
            await chart.destroy()
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
            const chart = await Chart.findByPk(id)
            await chart.update(req.body)
            return res.json(chart)
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }
}

module.exports = new ChartController();