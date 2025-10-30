const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Enrollment = sequelize.define('Enrollment', {
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
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    position: {
      type: DataTypes.INTEGER
    },
    matchesPlayed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    matchesWon: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    matchesLost: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    gamesWon: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    gamesLost: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
      },
      {
        fields: ['points']
      },
      {
        fields: ['position']
      }
    ]
  });

  return {
    Enrollment
  };
};