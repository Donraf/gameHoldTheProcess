const sequelize = require("../db");
const {DataTypes} = require('sequelize');

const User = sequelize.define("User", {
    user_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    login: {type: DataTypes.STRING, allowNull: false, unique: true},
    password: {type: DataTypes.STRING, allowNull: false},
    role: {type: DataTypes.STRING, allowNull: false, defaultValue: 'USER'},
    cur_par_set_id: {type: DataTypes.INTEGER, allowNull: false},
})

const ParameterSet = sequelize.define("ParameterSet", {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    gain_coef: {type: DataTypes.FLOAT, allowNull: false},
    time_const: {type: DataTypes.FLOAT, allowNull: false},
    noise_coef: {type: DataTypes.FLOAT, allowNull: false},
})

const UserParameterSet = sequelize.define("UserParameterSet", {
    score: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 1000},
})

const Chart = sequelize.define("Chart", {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
})

const Point = sequelize.define("Point", {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    x: {type: DataTypes.FLOAT, allowNull: false},
    y: {type: DataTypes.FLOAT, allowNull: false},
    is_end: {type: DataTypes.BOOLEAN, allowNull: false},
    is_crash: {type: DataTypes.BOOLEAN, allowNull: false},
    is_useful_ai_signal: {type: DataTypes.BOOLEAN, allowNull: false},
    is_deceptive_ai_signal: {type: DataTypes.BOOLEAN, allowNull: false},
    is_stop: {type: DataTypes.BOOLEAN, allowNull: false},
    is_pause: {type: DataTypes.BOOLEAN, allowNull: false},
    is_check: {type: DataTypes.BOOLEAN, allowNull: false},
})

User.belongsToMany(ParameterSet, {through: UserParameterSet, unique: false, foreignKey: 'user_id'})
ParameterSet.belongsToMany(User, {through: UserParameterSet, unique: false, foreignKey: 'parameter_set_id'})

ParameterSet.hasMany(Chart, { foreignKey: "parameter_set_id", onDelete: "NO ACTION" })
Chart.belongsTo(ParameterSet, { foreignKey: "parameter_set_id", onDelete: "NO ACTION" })

User.hasMany(Chart, { foreignKey: "user_id", onDelete: "NO ACTION" })
Chart.belongsTo(User, { foreignKey: "user_id", onDelete: "NO ACTION" })

Chart.hasMany(Point, { foreignKey: "chart_id", onDelete: "CASCADE" })
Point.belongsTo(Chart, { foreignKey: "chart_id", onDelete: "CASCADE" })

module.exports = {
    User,
    Chart,
    Point,
    ParameterSet,
    UserParameterSet,
}
