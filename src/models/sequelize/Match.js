const { DataTypes } = require('sequelize');

const MATCH_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

const MATCH_RESULT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DISPUTED: 'disputed'
};

module.exports = (sequelize) => {
  const Match = sequelize.define('Match', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(Object.values(MATCH_STATUS)),
      defaultValue: MATCH_STATUS.PENDING
    },
    resultStatus: {
      type: DataTypes.ENUM(Object.values(MATCH_RESULT_STATUS)),
      defaultValue: MATCH_RESULT_STATUS.PENDING
    },
    score: {
      type: DataTypes.STRING,
      validate: {
        isValidScore(value) {
          if (!value) return;
          // Ejemplo: "6-4,6-2" o "6-4,6-7(4),6-2"
          const sets = value.split(',');
          const isValid = sets.every(set => {
            if (set.includes('(')) {
              return /^\d+-\d+\(\d+\)$/.test(set);
            }
            return /^\d+-\d+$/.test(set);
          });
          if (!isValid) {
            throw new Error('Formato de puntuación inválido');
          }
        }
      }
    },
    winnerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    expirationDate: {
      type: DataTypes.DATE
    },
    resultSubmittedBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    resultSubmittedAt: {
      type: DataTypes.DATE
    },
    resultConfirmedAt: {
      type: DataTypes.DATE
    },
    cancelledBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    cancellationReason: {
      type: DataTypes.STRING
    },
    resultAutoConfirmAt: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['date']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expirationDate']
      }
    ]
  });

  return {
    Match,
    MATCH_STATUS,
    MATCH_RESULT_STATUS
  };
};