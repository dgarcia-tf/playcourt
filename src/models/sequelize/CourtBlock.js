const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CourtBlock = sequelize.define('CourtBlock', {
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
    reason: {
      type: DataTypes.STRING
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
        fields: ['clubId']
      }
    ]
  });

  return {
    CourtBlock
  };
};