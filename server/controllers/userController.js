const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {User, ParameterSet, UserParameterSet} = require('../models/models');
const {Op} = require("sequelize");

const generateJwt = (id, login, role) => {
    return jwt.sign(
        {
            user_id: id,
            login: login,
            role: role,
        },
        process.env.JWT_SECRET,
        {expiresIn: '24h'});
}


class UserController {
    async registration(req, res, next){
        try {
            const {login, password, role} = req.body;
            if (!login || !password) {
                return next(ApiError.badRequest("Invalid login and/or password"));
            }
            const candidate = await User.findOne({where: {login}})
            if (candidate) {
                return next(ApiError.badRequest("User with this login already exists"))
            }
            const hashPassword = await bcrypt.hash(password, 5);
            const parSet = await ParameterSet.findOne()
            const user = await User.create({login: login, password: hashPassword, role: role, cur_par_set_id: parSet.id});
            const token = generateJwt(user.user_id, login, role)
            await UserParameterSet.create({user_id: user.user_id, parameter_set_id: parSet.id})
            return res.json({token});
        } catch (e) {
            return next(ApiError.badRequest("Bad Request " + e));
        }
    }

    async login(req, res, next){
        try {
            const {login, password} = req.body;
            const user = await User.findOne({where: {login}})
            if (!user) {
                return next(ApiError.badRequest("Invalid login and/or password"));
            }
            let comparePassword = await bcrypt.compareSync(password, user.password);
            if (!comparePassword) {
                return next(ApiError.badRequest("Invalid login and/or password"));
            }
            const token = generateJwt(user.user_id, user.login, user.role);
            return res.json({token});
        } catch (e) {
            return next(ApiError.badRequest("Bad Request " + e));
        }
    }

    async updateScore(req, res, next){
        try {
            const {userId, parSetId, score} = req.body;
            const userParSet = await UserParameterSet.findOne({
                where: {
                    user_id: { [Op.eq]: userId},
                    parameter_set_id: { [Op.eq]: parSetId},
                }})
            userParSet.score = score
            await userParSet.save()
            return res.json(userParSet)
        } catch (e) {
            return next(ApiError.badRequest("Bad Request " + e));
        }
    }

    async check(req, res, next){
        try {
            const token = generateJwt(req.user.user_id, req.user.login, req.user.role)
            return res.json({token});
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async getOne(req, res, next) {
        try {
            const {id} = req.params
            const user = await User.findByPk(id)
            return res.json(user)
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async getPageCount(req, res, next) {
        try {
            let usersCount = 0
            switch (req.body.filter_tag){
                case 'user_name' : {
                    usersCount = await User.count({
                        where: {
                            name: { [Op.substring]: req.body.filter_value }
                        }
                    });
                    break
                }
                default: {
                    usersCount = await User.count();
                }
            }
            const pageCount = Math.ceil(usersCount / 9)
            return res.json({pageCount: pageCount})
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async getParSet(req, res, next) {
        try {
            const {id} = req.params
            const user = await User.findByPk(id)
            const parSet = await ParameterSet.findByPk(user.cur_par_set_id)
            return res.json(parSet)
        } catch (e) {
            return next(ApiError.badRequest("Bad Request for getParSet\n" + e));
        }
    }

    async getScore(req, res, next) {
        try {
            const {userId, parSetId} = req.params
            const userParSet = await UserParameterSet.findOne({
                where: {
                    user_id: { [Op.eq]: userId},
                    parameter_set_id: { [Op.eq]: parSetId},
                }})
            return res.json(userParSet.score)
        } catch (e) {
            return next(ApiError.badRequest("Bad Request for getScore\n" + e));
        }
    }

    async getAll(req, res, next) {
        try {
            let users
            switch (req.body.filter_tag){
                case 'user_name' : {
                    users = await User.findAll({
                        where: {
                            name: { [Op.substring]: req.body.filter_value }
                        },
                        offset: (req.body.current_page - 1) * 9,
                        limit: 9,
                    });
                    break
                }
                default: {
                    if (req.body.current_page !== null) {
                        users = await User.findAll({
                            offset: (req.body.current_page - 1) * 9,
                            limit: 9,
                        });
                    } else {
                        users = await User.findAll();
                    }
                }
            }
            return res.json(users);
        } catch (e) {
            return next(ApiError.badRequest("Bad Request" + e));
        }
    }

    async delete(req, res, next) {
        try {
            const {id} = req.params
            const user = await User.findByPk(id)
            if (!user) {
                return next(ApiError.badRequest("unknown user"));
            }
            await user.destroy()
            return res.json({message: "successfully deleted"})
        } catch (e) {
            if (e.name && e.name === "SequelizeForeignKeyConstraintError") {
                return next(ApiError.constraintFailed("Нарушение ограничений: " + e.parent.detail));
            }
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async update(req, res) {
        try{
            const {id} = req.params
            const {password} = req.body
            const user = await User.findByPk(id)

            if (password) {
                req.body.password = await bcrypt.hash(password, 5);
            }

            await user.update(req.body)
            return res.json(user)
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }
}

module.exports = new UserController();
