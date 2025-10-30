const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const League = sequelize.define('League', {
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
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'completed'),
      defaultValue: 'active'
    }
  }, {
    timestamps: true
  });

  return {
    League
  };
};