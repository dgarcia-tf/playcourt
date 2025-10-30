const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('playcourt', 'playcourt', 'SK9840fjm', {
  host: 'localhost',
  dialect: 'mariadb'
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida correctamente.');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
  } finally {
    await sequelize.close();
  }
}

testConnection();