const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TournamentMatch = sequelize.define('TournamentMatch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tournamentCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TournamentCategories',
        key: 'id'
      }
    },
    round: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    matchNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'walkover'),
      defaultValue: 'pending'
    },
    scheduledTime: {
      type: DataTypes.DATE
    },
    court: {
      type: DataTypes.STRING
    },
    score: {
      type: DataTypes.STRING
    },
    winnerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    winnerDoublesPairId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'TournamentDoublesPairs',
        key: 'id'
      }
    },
    matchFormat: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['tournamentCategoryId']
      },
      {
        fields: ['round']
      },
      {
        fields: ['status']
      },
      {
        fields: ['scheduledTime']
      }
    ]
  });

  return {
    TournamentMatch
  };
};