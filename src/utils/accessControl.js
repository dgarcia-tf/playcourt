const { USER_ROLES, userHasRole } = require('../models/User');

function canAccessPrivateContent(user) {
  if (!user) {
    return false;
  }

  if (userHasRole(user, USER_ROLES.ADMIN) || userHasRole(user, USER_ROLES.COURT_MANAGER)) {
    return true;
  }

  return Boolean(user.isMember);
}

module.exports = {
  canAccessPrivateContent,
};
