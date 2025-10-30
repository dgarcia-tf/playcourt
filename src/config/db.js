const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('playcourt', 'root', '', {
  host: 'localhost',
  dialect: 'mariadb',
  dialectOptions: {
    timezone: 'Etc/GMT0',
    authentication: {
      type: 'mysql_native_password'
    }
  },
  logging: console.log
});

async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized successfully.');
    
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  connectDatabase
};
