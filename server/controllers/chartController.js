const {Chart, User} = require('../models/models');
const ApiError = require('../error/ApiError');
const {Op} = require("sequelize");

class ChartController {
    async create(req, res, next) {
        const {user_id} = req.body
        try {
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

    async getPageCount(req, res, next) {
        try {
            let chartsCount = 0
            switch (req.body.filter_tag){
                case 'chart_id' : {
                    chartsCount = await Chart.count({
                        where: {
                            id: { [Op.substring]: req.body.filter_value }
                        }
                    });
                    break
                }
                case 'user_login' : {
                    let users = await User.findAll({
                        where: {
                            login: { [Op.substring]: req.body.filter_value }
                        }
                    })
                    for (let user of users) {
                        chartsCount += await Chart.count({
                            where: {
                                user_id: { [Op.eq]: user.user_id }
                            }
                        });
                    }
                    break
                }
                case 'user_id' : {
                    chartsCount = await Chart.count({
                        where: {
                            user_id: { [Op.eq]: req.body.filter_value }
                        }
                    });
                    break
                }
                default: {
                    chartsCount = await Chart.count();
                }
            }
            const pageCount = Math.ceil(chartsCount / 9)
            return res.json({pageCount: pageCount})
        } catch (e) {
            return next(ApiError.badRequest("Bad Request " + e));
        }
    }

    async getCount(req, res, next) {
        try {
            let chartsCount = 0
            switch (req.body.filter_tag){
                case 'chart_id' : {
                    chartsCount = await Chart.count({
                        where: {
                            id: { [Op.substring]: req.body.filter_value }
                        }
                    });
                    break
                }
                case 'user_login' : {
                    let users = await User.findAll({
                        where: {
                            login: { [Op.substring]: req.body.filter_value }
                        }
                    })
                    for (let user of users) {
                        chartsCount += await Chart.count({
                            where: {
                                user_id: { [Op.eq]: user.user_id }
                            }
                        });
                    }
                    break
                }
                case 'user_id' : {
                    chartsCount = await Chart.count({
                        where: {
                            user_id: { [Op.eq]: req.body.filter_value }
                        }
                    });
                    break
                }
                default: {
                    chartsCount = await Chart.count();
                }
            }
            return res.json({count: chartsCount})
        } catch (e) {
            return next(ApiError.badRequest("Bad Request " + e));
        }
    }

    async getAll(req, res, next) {
        try {
            let charts = []
            switch (req.body.filter_tag){
                case 'chart_id' : {
                    charts = await Chart.findAll({
                        where: {
                            id: { [Op.substring]: req.body.filter_value }
                        },
                        offset: (req.body.current_page - 1) * 9,
                        limit: 9,
                    });
                    break
                }
                case 'user_login' : {
                    let users = await User.findAll({
                        where: {
                            login: { [Op.substring]: req.body.filter_value }
                        }
                    })
                    for (let user of users) {
                        let filteredCharts = await Chart.count({
                            where: {
                                user_id: { [Op.eq]: user.user_id }
                            }
                        });
                        charts.push(...filteredCharts);
                    }
                    break
                }
                case 'user_id' : {
                    charts = await Chart.findAll({
                        where: {
                            user_id: { [Op.eq]: req.body.filter_value }
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