const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PushSubscription = sequelize.define('PushSubscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    endpoint: {
      type: DataTypes.STRING(2048),
      allowNull: false
    },
    expirationTime: {
      type: DataTypes.DATE
    },
    keys: {
      type: DataTypes.JSON,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    userAgent: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'unsubscribed'),
      defaultValue: 'active'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['endpoint']
      },
      {
        fields: ['status']
      }
    ]
  });

  return {
    PushSubscription
  };
};