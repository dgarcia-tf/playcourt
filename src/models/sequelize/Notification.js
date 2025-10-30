const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    recipients: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    matchId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Matches',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    readBy: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['recipients']
      },
      {
        fields: ['matchId']
      }
    ]
  });

  return {
    Notification
  };
};