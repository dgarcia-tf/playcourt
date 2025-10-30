const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CourtReservation = sequelize.define('CourtReservation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    courtNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT
    },
    clubId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Clubs',
        key: 'id'
      }
    },
    matchId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Matches',
        key: 'id'
      }
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['courtNumber']
      },
      {
        fields: ['startTime']
      },
      {
        fields: ['endTime']
      },
      {
        fields: ['status']
      },
      {
        fields: ['clubId']
      },
      {
        fields: ['matchId']
      }
    ]
  });

  return {
    CourtReservation
  };
};