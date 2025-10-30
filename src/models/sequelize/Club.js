const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Club = sequelize.define('Club', {
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
    address: {
      type: DataTypes.STRING
    },
    location: {
      type: DataTypes.JSON // Para almacenar coordenadas {lat, lng}
    },
    phone: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    website: {
      type: DataTypes.STRING
    },
    logo: {
      type: DataTypes.TEXT('medium')
    },
    photos: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    facilities: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    openingHours: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    courtTypes: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['status']
      }
    ]
  });

  return {
    Club
  };
};