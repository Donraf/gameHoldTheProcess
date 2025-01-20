const sequelize = require("../db");
const {DataTypes} = require('sequelize');

const User = sequelize.define("User", {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    login: {type: DataTypes.STRING, allowNull: false, unique: true},
    password: {type: DataTypes.STRING, allowNull: false},
    role: {type: DataTypes.STRING, allowNull: false, defaultValue: 'USER'},
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
    is_ai_signal: {type: DataTypes.BOOLEAN, allowNull: false},
    is_stop: {type: DataTypes.BOOLEAN, allowNull: false},
    is_check: {type: DataTypes.BOOLEAN, allowNull: false},
})

User.hasMany(Chart, { foreignKey: "user_id", onDelete: "NO ACTION" })
Chart.belongsTo(User, { foreignKey: "user_id", onDelete: "NO ACTION" })

Chart.hasMany(Point, { foreignKey: "chart_id", onDelete: "CASCADE" })
Point.belongsTo(Chart, { foreignKey: "chart_id", onDelete: "CASCADE" })

module.exports = {
    User,
    Chart,
    Point,
}
