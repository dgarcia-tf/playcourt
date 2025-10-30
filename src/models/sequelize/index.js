const { sequelize } = require('../../config/db');
const UserModel = require('./User');

const { User, UserRole, USER_ROLES, GENDERS, PREFERRED_SCHEDULES, SHIRT_SIZES } = UserModel(sequelize);

module.exports = {
  User,
  UserRole,
  USER_ROLES,
  GENDERS,
  PREFERRED_SCHEDULES,
  SHIRT_SIZES
};