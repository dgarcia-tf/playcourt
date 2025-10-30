const { Sequelize } = require('sequelize');

let sequelize = null;

function resolveDbConfig(configFromEnv) {
  const defaultConfig = {
    host: '127.0.0.1',
    port: 3306,
    database: 'playcourt',
    username: 'root',
    password: '',
    dialect: 'mariadb',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };

  if (!configFromEnv) {
    return defaultConfig;
  }

  try {
    const envConfig = JSON.parse(configFromEnv);
    return { ...defaultConfig, ...envConfig };
  } catch (error) {
    console.warn('Error parsing database config from environment:', error);
    return defaultConfig;
  }
}

async function connectDatabase(configFromEnv) {
  if (sequelize) {
    return sequelize;
  }

  const config = resolveDbConfig(configFromEnv);

  try {
    sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        pool: config.pool,
        logging: process.env.NODE_ENV !== 'production' ? console.log : false
      }
    );

    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    return sequelize;
  } catch (error) {
    sequelize = null;
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = {
  resolveDbConfig,
  connectDatabase,
  getSequelize: () => sequelize
};