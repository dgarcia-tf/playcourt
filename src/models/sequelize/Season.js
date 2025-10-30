const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Season = sequelize.define('Season', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: true
  });

  return {
    Season
  };
};