function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getCategoryReferenceYear(category, fallbackDate = new Date()) {
  const fallbackYear = parseDate(fallbackDate)?.getFullYear() ?? new Date().getFullYear();

  if (!category) {
    return fallbackYear;
  }

  const candidateDates = [];

  if (category.startDate) {
    candidateDates.push(category.startDate);
  }
  if (category.endDate) {
    candidateDates.push(category.endDate);
  }

  if (category.league) {
    const league = category.league;
    if (typeof league === 'object' && league !== null) {
      if (typeof league.year === 'number' && Number.isFinite(league.year)) {
        return Math.trunc(league.year);
      }
      if (league.startDate) {
        candidateDates.push(league.startDate);
      }
      if (league.endDate) {
        candidateDates.push(league.endDate);
      }
    }
  }

  if (typeof category.year === 'number' && Number.isFinite(category.year)) {
    return Math.trunc(category.year);
  }

  if (category.createdAt) {
    candidateDates.push(category.createdAt);
  }

  for (const candidate of candidateDates) {
    const parsed = parseDate(candidate);
    if (parsed) {
      return parsed.getFullYear();
    }
  }

  return fallbackYear;
}

function calculateNaturalYearAge(birthDate, reference = new Date()) {
  const birth = parseDate(birthDate);
  if (!birth) {
    return null;
  }

  let referenceYear;

  if (typeof reference === 'number' && Number.isFinite(reference)) {
    referenceYear = Math.trunc(reference);
  } else {
    const referenceDate = parseDate(reference) || new Date();
    referenceYear = referenceDate.getFullYear();
  }

  return referenceYear - birth.getFullYear();
}

function hasCategoryMinimumAgeRequirement(category) {
  if (!category || category.minimumAge === undefined || category.minimumAge === null) {
    return false;
  }

  const minimumAge = Number(category.minimumAge);
  if (!Number.isFinite(minimumAge) || minimumAge <= 0) {
    return false;
  }

  return true;
}

function userMeetsCategoryMinimumAge(category, user, referenceDate = new Date()) {
  if (!hasCategoryMinimumAgeRequirement(category)) {
    return true;
  }

  const birthDate = user?.birthDate;
  const parsedBirthDate = parseDate(birthDate);
  if (!parsedBirthDate) {
    return false;
  }

  const referenceYear = getCategoryReferenceYear(category, referenceDate);
  const age = calculateNaturalYearAge(parsedBirthDate, referenceYear);

  if (age === null) {
    return false;
  }

  return age >= minimumAge;
}

module.exports = {
  parseDate,
  getCategoryReferenceYear,
  calculateNaturalYearAge,
  userMeetsCategoryMinimumAge,
  hasCategoryMinimumAgeRequirement,
};

