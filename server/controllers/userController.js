const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {User} = require('../models/models');
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
            const user = await User.create({login: login, password: hashPassword, role: role});
            const token = generateJwt(user.user_id, login, role)
            return res.json({token});
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
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
            return next(ApiError.badRequest("Bad Request"));
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
