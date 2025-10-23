const { GENDERS } = require('../models/User');

function categoryAllowsGender(categoryGender, userGender) {
  if (!categoryGender || !userGender) {
    return false;
  }

  if (categoryGender === GENDERS.MIXED || userGender === GENDERS.MIXED) {
    return true;
  }

  return categoryGender === userGender;
}

module.exports = {
  categoryAllowsGender,
};
