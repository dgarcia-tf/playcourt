const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TournamentDoublesPair = sequelize.define('TournamentDoublesPair', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    player1Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    player2Id: {
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
      type: DataTypes.ENUM('active', 'withdrawn'),
      defaultValue: 'active'
    },
    seedNumber: {
      type: DataTypes.INTEGER
    },
    drawPosition: {
      type: DataTypes.INTEGER
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['tournamentCategoryId']
      },
      {
        fields: ['status']
      }
    ]
  });

  return {
    TournamentDoublesPair
  };
};