const { validationResult } = require('express-validator');
const { Club } = require('../models/Club');

function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function sanitizeSchedules(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => {
      if (!entry) return null;
      const label = sanitizeString(entry.label);
      if (!label) return null;
      return {
        label,
        opensAt: sanitizeString(entry.opensAt),
        closesAt: sanitizeString(entry.closesAt),
      };
    })
    .filter(Boolean);
}

function sanitizeCourts(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => {
      if (!entry) return null;
      const name = sanitizeString(entry.name);
      if (!name) return null;
      return {
        name,
        surface: sanitizeString(entry.surface) || 'Dura',
        indoor: Boolean(entry.indoor),
        lights: entry.lights === undefined ? true : Boolean(entry.lights),
        notes: sanitizeString(entry.notes),
      };
    })
    .filter(Boolean);
}

function sanitizeFacilities(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => sanitizeString(item))
    .filter((item) => item.length > 0);
}

async function getClubProfile(_req, res) {
  const club = await Club.getSingleton();
  return res.json(club);
}

async function updateClubProfile(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    slogan,
    description,
    address,
    contactEmail,
    contactPhone,
    website,
    regulation,
    logo,
    schedules,
    courts,
    facilities,
  } = req.body;

  const club = await Club.getSingleton();

  if (name !== undefined) club.name = sanitizeString(name) || club.name;
  if (slogan !== undefined) club.slogan = sanitizeString(slogan);
  if (description !== undefined) club.description = sanitizeString(description);
  if (address !== undefined) club.address = sanitizeString(address);
  if (contactEmail !== undefined) club.contactEmail = sanitizeString(contactEmail);
  if (contactPhone !== undefined) club.contactPhone = sanitizeString(contactPhone);
  if (website !== undefined) club.website = sanitizeString(website);
  if (regulation !== undefined) club.regulation = sanitizeString(regulation);
  if (logo !== undefined) club.logo = sanitizeString(logo);

  if (schedules !== undefined) {
    club.schedules = sanitizeSchedules(schedules);
  }

  if (courts !== undefined) {
    club.courts = sanitizeCourts(courts);
  }

  if (facilities !== undefined) {
    club.facilities = sanitizeFacilities(facilities);
  }

  club.updatedBy = req.user?.id || club.updatedBy;

  await club.save();

  return res.json(club);
}

module.exports = {
  getClubProfile,
  updateClubProfile,
};
