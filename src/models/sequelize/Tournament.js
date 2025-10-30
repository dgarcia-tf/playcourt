const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Tournament = sequelize.define('Tournament', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    registrationStartDate: {
      type: DataTypes.DATE
    },
    registrationEndDate: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'draft'
    },
    format: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    rules: {
      type: DataTypes.TEXT
    },
    prizes: {
      type: DataTypes.TEXT
    },
    fees: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    venueId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Clubs',
        key: 'id'
      }
    },
    organizerId: {
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
        fields: ['name']
      },
      {
        fields: ['startDate']
      },
      {
        fields: ['endDate']
      },
      {
        fields: ['status']
      }
    ]
  });

  return {
    Tournament
  };
};