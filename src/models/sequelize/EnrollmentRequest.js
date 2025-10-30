const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EnrollmentRequest = sequelize.define('EnrollmentRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Categories',
        key: 'id'
      }
    },
    leagueId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Leagues',
        key: 'id'
      }
    },
    seasonId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Seasons',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT
    },
    reviewedById: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    reviewedAt: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['playerId']
      },
      {
        fields: ['categoryId']
      },
      {
        fields: ['leagueId']
      },
      {
        fields: ['seasonId']
      },
      {
        fields: ['status']
      }
    ]
  });

  return {
    EnrollmentRequest
  };
};