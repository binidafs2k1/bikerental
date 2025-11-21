const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "data.sqlite"),
  logging: false,
});

const User = sequelize.define("User", {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: "user" },
});

const Station = sequelize.define("Station", {
  name: { type: DataTypes.STRING, allowNull: false },
  lat: { type: DataTypes.FLOAT, allowNull: false },
  lng: { type: DataTypes.FLOAT, allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  open: { type: DataTypes.BOOLEAN, defaultValue: true },
  available: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const Post = sequelize.define("Post", {
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
});

const Report = sequelize.define("Report", {
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: "open" },
});

User.hasMany(Post);
Post.belongsTo(User);

Station.hasMany(Report);
Report.belongsTo(Station);
Report.belongsTo(User);

// Rental records: user rents from a station, then returns to a station
const Rental = sequelize.define('Rental', {
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' }, // active|returned
  startedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  endedAt: { type: DataTypes.DATE, allowNull: true },
});

User.hasMany(Rental);
Rental.belongsTo(User);

Station.hasMany(Rental, { as: 'Departures', foreignKey: 'fromStationId' });
Station.hasMany(Rental, { as: 'Arrivals', foreignKey: 'toStationId' });
Rental.belongsTo(Station, { as: 'fromStation', foreignKey: 'fromStationId' });
Rental.belongsTo(Station, { as: 'toStation', foreignKey: 'toStationId' });


module.exports = { sequelize, User, Station, Post, Report, Rental };
