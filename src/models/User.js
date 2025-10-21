const mongoose = require('mongoose');
const { isValidImageDataUrl } = require('../utils/validators');

const USER_ROLES = {
  PLAYER: 'player',
  ADMIN: 'admin',
  COURT_MANAGER: 'court_manager',
};

const GENDERS = {
  MALE: 'masculino',
  FEMALE: 'femenino',
};

const PREFERRED_SCHEDULES = {
  MORNING: 'manana',
  AFTERNOON: 'tarde',
  EVENING: 'noche',
  WEEKEND: 'fin_de_semana',
  FLEXIBLE: 'flexible',
};

const PREFERRED_SCHEDULE_ALIASES = {
  manana: ['mañana', 'manana', 'morning'],
  tarde: ['tarde', 'afternoon'],
  noche: ['noche', 'evening'],
  fin_de_semana: ['fin_de_semana', 'fin de semana', 'weekend'],
  flexible: ['flexible'],
};

function normalizePreferredSchedule(value) {
  if (!value) {
    return PREFERRED_SCHEDULES.FLEXIBLE;
  }

  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!raw) {
    return PREFERRED_SCHEDULES.FLEXIBLE;
  }

  const directMatch = Object.values(PREFERRED_SCHEDULES).find((option) => option === raw);
  if (directMatch) {
    return directMatch;
  }

  const aliasEntry = Object.entries(PREFERRED_SCHEDULE_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => alias.toLowerCase() === raw)
  );

  if (aliasEntry) {
    return aliasEntry[0];
  }

  return PREFERRED_SCHEDULES.FLEXIBLE;
}

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || isValidImageDataUrl(value),
        message: 'La fotografía debe ser una imagen en Base64 válida de hasta 2 MB.',
      },
    },
    preferredSchedule: {
      type: String,
      enum: Object.values(PREFERRED_SCHEDULES),
      default: PREFERRED_SCHEDULES.FLEXIBLE,
    },
    notes: {
      type: String,
      trim: true,
    },
    notifyMatchRequests: {
      type: Boolean,
      default: true,
    },
    notifyMatchResults: {
      type: Boolean,
      default: true,
    },
    roles: {
      type: [String],
      enum: Object.values(USER_ROLES),
      default: [USER_ROLES.PLAYER],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'El usuario debe tener al menos un rol asignado.',
      },
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.PLAYER,
    },
    gender: {
      type: String,
      enum: Object.values(GENDERS),
      required: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

function normalizeRoles(input) {
  if (!input) {
    return [USER_ROLES.PLAYER];
  }

  const raw = Array.isArray(input) ? input : [input];
  const cleaned = raw
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  const valid = cleaned.filter((value) => Object.values(USER_ROLES).includes(value));
  const unique = Array.from(new Set(valid));

  if (!unique.length) {
    return [USER_ROLES.PLAYER];
  }

  return unique;
}

userSchema.pre('validate', function syncRoles(next) {
  if (!Array.isArray(this.roles) || !this.roles.length) {
    this.roles = normalizeRoles(this.role);
  } else {
    this.roles = normalizeRoles(this.roles);
  }

  if (!this.role || !Object.values(USER_ROLES).includes(this.role)) {
    this.role = this.roles.includes(USER_ROLES.ADMIN)
      ? USER_ROLES.ADMIN
      : this.roles[0] || USER_ROLES.PLAYER;
  }

  next();
});

userSchema.methods.hasRole = function hasRole(role) {
  if (!role) return false;
  if (Array.isArray(this.roles) && this.roles.includes(role)) {
    return true;
  }
  return this.role === role;
};

userSchema.methods.getRoles = function getRoles() {
  if (Array.isArray(this.roles) && this.roles.length) {
    return [...this.roles];
  }
  return normalizeRoles(this.role);
};

function userHasRole(user, role) {
  if (!user || !role) return false;
  if (typeof user.hasRole === 'function') {
    return user.hasRole(role);
  }
  const roles = Array.isArray(user.roles) && user.roles.length ? user.roles : normalizeRoles(user.role);
  return roles.includes(role);
}

module.exports = {
  User: mongoose.model('User', userSchema),
  USER_ROLES,
  GENDERS,
  PREFERRED_SCHEDULES,
  normalizeRoles,
  normalizePreferredSchedule,
  userHasRole,
};
