const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {User} = require('../models/models');

const generateJwt = (id, login, role, name) => {
    return jwt.sign(
        {
            user_id: id,
            login: login,
            role: role,
            name: name,
        },
        process.env.JWT_SECRET,
        {expiresIn: '24h'});
}


class UserController {
    async registration(req, res, next){
        try {
            const { name, login, password, role, } = req.body;
            if (!name || !login || !password) {
                return next(ApiError.badRequest("Invalid login and/or password"));
            }
            const candidate = await User.findOne({where: {login}})
            if (candidate) {
                return next(ApiError.badRequest("User with this login already exists"))
            }
            const hashPassword = await bcrypt.hash(password, 5);
            const user = await User.create({name: name, login: login, password: hashPassword, role: role});
            const token = generateJwt(user.user_id, login, role, name)
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
            const token = generateJwt(user.user_id, user.login, user.role, user.name);
            return res.json({token});
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async check(req, res, next){
        try {
            const token = generateJwt(req.user.user_id, req.user.login, req.user.role, req.user.name)
            return res.json({token});
        } catch (e) {
            return next(ApiError.badRequest("Bad Request"));
        }
    }

    async getAll(req, res, next) {
        try {
            const users = await User.findAll();
            return res.json(users);
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
