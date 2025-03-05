const {Chart, User} = require('../models/models');
const ApiError = require('../error/ApiError');
const {Op} = require("sequelize");

class ChartController {
    async create(req, res, next) {
        try {
            const {id} = req.body;
            const chart = await Chart.create({id: id});
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

    async getPageCount(req, res, next) {
        try {
            let chartsCount = 0
            switch (req.body.filter_tag){
                case 'chart_id' : {
                    chartsCount = await User.count({
                        where: {
                            name: { [Op.eq]: req.body.filter_value }
                        }
                    });
                    break
                }
                default: {
                    chartsCount = await User.count();
                }
            }
            const pageCount = Math.ceil(chartsCount / 9)
            return res.json({pageCount: pageCount})
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async getAll(req, res, next) {
        try {
            let charts
            switch (req.body.filter_tag){
                case 'chart_id' : {
                    charts = await Chart.findAll({
                        where: {
                            id: { [Op.eq]: req.body.filter_value }
                        },
                        offset: (req.body.current_page - 1) * 9,
                        limit: 9,
                    });
                    break
                }
                default: {
                    if (req.body.current_page !== null) {
                        charts = await Chart.findAll({
                            offset: (req.body.current_page - 1) * 9,
                            limit: 9,
                        });
                    } else {
                        charts = await Chart.findAll();
                    }
                }
            }
            return res.json(charts);
        } catch (e) {
            return next(ApiError.badRequest("Bad Request" + e));
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