const mongoose = require('mongoose');

let cachedConnection = null;

function resolveMongoUri(uriFromEnv) {
  if (uriFromEnv && uriFromEnv.trim()) {
    return uriFromEnv.trim();
  }

  return 'mongodb://127.0.0.1:27017/liga-tenis';
}

async function connectDatabase(uriFromEnv) {
  const resolvedUri = resolveMongoUri(uriFromEnv);

  if (cachedConnection) {
    return cachedConnection;
  }

  mongoose.set('strictQuery', true);

  try {
    cachedConnection = await mongoose.connect(resolvedUri, {
      autoIndex: true,
    });
  } catch (error) {
    cachedConnection = null;

    if (error.name === 'MongooseServerSelectionError') {
      error.message = [
        `No se pudo establecer conexión con MongoDB utilizando la URI "${resolvedUri}".`,
        'Verifica que el servicio de MongoDB esté en ejecución y que la dirección sea accesible.',
        'En Windows, si instalaste MongoDB como servicio, puedes iniciarlo con: net start MongoDB (requiere consola con privilegios de administrador).',
        'Alternativamente, abre PowerShell como administrador y ejecuta: Start-Service -Name MongoDB o inicia el servicio desde services.msc.',
        'También puedes probar la conexión ejecutando "mongosh --host 127.0.0.1 --port 27017".',
      ].join(' ');
    }

    throw error;
  }

  return cachedConnection;
}

module.exports = {
  resolveMongoUri,
  connectDatabase,
};
