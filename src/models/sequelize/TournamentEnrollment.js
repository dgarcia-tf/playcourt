const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TournamentEnrollment = sequelize.define('TournamentEnrollment', {
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
    tournamentCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TournamentCategories',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'withdrawn', 'rejected'),
      defaultValue: 'pending'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded'),
      defaultValue: 'pending'
    },
    seedNumber: {
      type: DataTypes.INTEGER
    },
    drawPosition: {
      type: DataTypes.INTEGER
    },
    notes: {
      type: DataTypes.TEXT
    },
    partnerRequestId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['playerId']
      },
      {
        fields: ['tournamentCategoryId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['paymentStatus']
      }
    ]
  });

  return {
    TournamentEnrollment
  };
};