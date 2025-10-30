const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('masculino', 'femenino', 'mixto'),
      allowNull: false
    },
    color: {
      type: DataTypes.STRING
    },
    matchFormat: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    timestamps: true
  });

  return {
    Category
  };
};