const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TournamentCategory = sequelize.define('TournamentCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tournamentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tournaments',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    gender: {
      type: DataTypes.ENUM('masculino', 'femenino', 'mixto'),
      allowNull: false
    },
    minAge: {
      type: DataTypes.INTEGER
    },
    maxAge: {
      type: DataTypes.INTEGER
    },
    maxParticipants: {
      type: DataTypes.INTEGER
    },
    format: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    draw: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    orderOfPlay: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['tournamentId']
      },
      {
        fields: ['status']
      }
    ]
  });

  return {
    TournamentCategory
  };
};