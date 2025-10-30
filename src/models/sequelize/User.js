const { DataTypes, Op } = require('sequelize');

const USER_ROLES = {
  PLAYER: 'player',
  ADMIN: 'admin',
  COURT_MANAGER: 'court_manager',
};

const SHIRT_SIZES = {
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  XXL: 'XXL',
};

const GENDERS = {
  MALE: 'masculino',
  FEMALE: 'femenino',
  MIXED: 'mixto',
};

const PREFERRED_SCHEDULES = {
  MORNING: 'manana',
  AFTERNOON: 'tarde',
  EVENING: 'noche',
  WEEKEND: 'fin_de_semana',
  FLEXIBLE: 'flexible',
};

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    isMember: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    membershipNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true
    },
    membershipNumberVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    photo: {
      type: DataTypes.TEXT('medium'),
      allowNull: true,
      validate: {
        isBase64Image(value) {
          if (!value) return;
          if (!/^data:image\/.*;base64,/.test(value)) {
            throw new Error('La fotografía debe ser una imagen en Base64 válida.');
          }
        }
      }
    },
    preferredSchedule: {
      type: DataTypes.ENUM(Object.values(PREFERRED_SCHEDULES)),
      defaultValue: PREFERRED_SCHEDULES.FLEXIBLE
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notifyMatchRequests: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notifyMatchResults: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    role: {
      type: DataTypes.ENUM(Object.values(USER_ROLES)),
      defaultValue: USER_ROLES.PLAYER
    },
    gender: {
      type: DataTypes.ENUM(Object.values(GENDERS)),
      allowNull: false
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    shirtSize: {
      type: DataTypes.ENUM(Object.values(SHIRT_SIZES)),
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['membershipNumber'],
        where: {
          membershipNumber: {
            [Op.ne]: null
          }
        }
      }
    ]
  });

  // Tabla para manejar roles múltiples
  const UserRole = sequelize.define('UserRole', {
    role: {
      type: DataTypes.ENUM(Object.values(USER_ROLES)),
      allowNull: false
    }
  });

  // Definir las relaciones
  User.hasMany(UserRole, {
    foreignKey: {
      name: 'userId',
      allowNull: false
    },
    as: 'userRoles',
    onDelete: 'CASCADE'
  });
  UserRole.belongsTo(User, {
    foreignKey: 'userId'
  });

  // Métodos de instancia
  User.prototype.hasRole = function(role) {
    if (!role) return false;
    if (this.role === role) return true;
    return this.UserRoles?.some(userRole => userRole.role === role) || false;
  };

  User.prototype.getRoles = async function() {
    const userRoles = await UserRole.findAll({
      where: { userId: this.id }
    });
    return userRoles.map(ur => ur.role);
  };

  // Hooks
  User.addHook('beforeSave', async (user) => {
    if (user.membershipNumber) {
      user.membershipNumber = user.membershipNumber.trim();
      if (!user.membershipNumber) {
        user.membershipNumber = null;
      }
    }
  });

  return {
    User,
    UserRole,
    USER_ROLES,
    GENDERS,
    PREFERRED_SCHEDULES,
    SHIRT_SIZES
  };
};