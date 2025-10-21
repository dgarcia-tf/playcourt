const nodemailer = require('nodemailer');

let transporter = null;
let configured = false;

function parseBoolean(value, defaultValue = false) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function getDefaultSender() {
  const fallbackName = 'Liga Tennis';
  const fallbackEmail = 'no-reply@cn-sanmarcos.local';
  const fromEnv = process.env.MAIL_FROM || process.env.SMTP_FROM;

  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim();
  }

  return `${fallbackName} <${fallbackEmail}>`;
}

function getDefaultReplyTo() {
  const replyTo = process.env.MAIL_REPLY_TO || process.env.SMTP_REPLY_TO;
  if (replyTo && replyTo.trim()) {
    return replyTo.trim();
  }
  return undefined;
}

function buildTransportOptions() {
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  const secureEnv = process.env.SMTP_SECURE;
  const secure = typeof secureEnv === 'undefined' ? port === 465 : parseBoolean(secureEnv);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const pool = parseBoolean(process.env.SMTP_POOL, true);

  if (!host) {
    return null;
  }

  const options = {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
  };

  if (pool) {
    options.pool = true;
    const maxConnections = Number.parseInt(process.env.SMTP_MAX_CONNECTIONS || '5', 10);
    const maxMessages = Number.parseInt(process.env.SMTP_MAX_MESSAGES || '100', 10);
    if (Number.isFinite(maxConnections) && maxConnections > 0) {
      options.maxConnections = maxConnections;
    }
    if (Number.isFinite(maxMessages) && maxMessages > 0) {
      options.maxMessages = maxMessages;
    }
  }

  if (user && pass) {
    options.auth = { user, pass };
  }

  if (parseBoolean(process.env.SMTP_IGNORE_TLS)) {
    options.ignoreTLS = true;
  }

  if (parseBoolean(process.env.SMTP_REQUIRE_TLS)) {
    options.requireTLS = true;
  }

  const rejectUnauthorized = parseBoolean(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true);
  const tlsOptions = {};

  if (!rejectUnauthorized) {
    tlsOptions.rejectUnauthorized = false;
  }

  if (process.env.SMTP_TLS_CIPHERS) {
    tlsOptions.ciphers = process.env.SMTP_TLS_CIPHERS;
  }

  if (Object.keys(tlsOptions).length > 0) {
    options.tls = tlsOptions;
  }

  return options;
}

function configureMailTransport() {
  const options = buildTransportOptions();
  if (!options) {
    configured = false;
    transporter = null;
    return false;
  }

  transporter = nodemailer.createTransport(options);
  configured = true;
  return true;
}

function getMailTransport() {
  return configured ? transporter : null;
}

function mailTransportEnabled() {
  return Boolean(configured && transporter);
}

function resetMailTransport() {
  configured = false;
  transporter = null;
}

module.exports = {
  configureMailTransport,
  getMailTransport,
  mailTransportEnabled,
  resetMailTransport,
  getDefaultSender,
  getDefaultReplyTo,
};
