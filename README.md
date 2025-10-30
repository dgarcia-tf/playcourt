PlayCourt · Aplicación web

Aplicación completa para gestionar la liga social de tenis de PlayCourt.
El servidor Node.js expone una única experiencia web en http://localhost:3000
 (o en el dominio configurado, por ejemplo https://playcourt.es
), desde la que jugadores y administradores realizan todas las acciones necesarias: alta de usuarios, gestión de categorías, inscripciones, calendario, rankings y temporadas.
Los datos se almacenan en MongoDB y la capa de API queda integrada en la propia aplicación para simplificar la instalación en servidores VPS o locales.

🚀 Características principales

Primer inicio guiado: al detectar que no hay administradores registrados, la aplicación obliga a crear el usuario inicial antes de mostrar contenido.

Perfiles completos: nombre, foto (hasta 2 MB, almacenada en la base de datos), teléfono, notas, horario preferido y preferencias de notificación editables desde Mi cuenta.

Gestión de roles: los usuarios se registran como jugadores; solo los administradores pueden conceder o revocar permisos de gestión.

Panel unificado con menú lateral: acceso rápido a Dashboard, Club, Categorías, Partidos, Ranking, Noticias, Reglamento, Notificaciones, Directorio y Mi cuenta.

Identidad personalizable: la sección Club permite editar logotipo, lema, descripción, contacto, horarios, pistas y servicios desde un único formulario modal.

Calendario mensual interactivo con partidos programados, pendientes o sin fecha.

Categorías con inscripción automática y estados (Inscripción / En curso).

Partidos autogenerados entre inscritos y gestión completa de resultados, confirmaciones y notificaciones.

Ranking dinámico e imprimible, con puntos, movimientos e informe PDF.

Noticias y reglamento accesibles directamente desde la aplicación.

⚙️ Puesta en marcha en un VPS
1. Clonar el proyecto y copiar el entorno
git clone https://github.com/tucuenta/playcourt.git
cd playcourt
cp .env.example .env

2. Configurar variables de entorno

Edita el archivo .env con tus valores personalizados:

PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/playcourt
DOMAIN=https://playcourt.es

Notificaciones push (opcional)
VAPID_PUBLIC_KEY=tu_clave_publica
VAPID_PRIVATE_KEY=tu_clave_privada
PUSH_NOTIFICATIONS_SUBJECT=mailto:info@playcourt.es


Genera las claves con:

npx --yes web-push generate-vapid-keys

Configuración de correo SMTP
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario
SMTP_PASS=contraseña
MAIL_FROM="PlayCourt <notificaciones@playcourt.es>"
MAIL_REPLY_TO=soporte@playcourt.es


Si el proveedor requiere TLS estricto, ajusta las variables SMTP_SECURE, SMTP_REQUIRE_TLS o las opciones descritas en src/config/mail.js.

3. Instalar dependencias
npm install

4. Configurar la base de datos

Asegúrate de tener MongoDB en ejecución.

Opción 1 — Local (recomendada para VPS):

sudo systemctl start mongod


Opción 2 — Docker:

docker run --name playcourt-mongo -p 27017:27017 -d mongo:6


También puedes usar MongoDB Atlas definiendo MONGODB_URI con tu cadena de conexión.

5. Iniciar el servidor
npm run dev


o en producción (por ejemplo con pm2):

npm install -g pm2
pm2 start src/server.js --name playcourt


La aplicación quedará disponible en:

http://localhost:3000
 (modo desarrollo)

https://playcourt.es
 (si configuraste un proxy reverso con Nginx)

🔁 Flujo de uso recomendado
Primer acceso

Abre la URL del servidor (p. ej. https://playcourt.es
).

Registra el primer administrador.

A partir de ahí, todos los nuevos registros se crean como jugadores.

Funciones del administrador

Configurar la ficha del club desde la sección Club (logotipo, contacto, horarios, pistas…).

Crear categorías con género, nivel, fechas y estado (Inscripción / En curso).

Gestionar inscripciones y promover jugadores a administradores.

Generar enfrentamientos pendientes y aprobar resultados.

Publicar noticias y notificaciones globales.

Supervisar rankings y generar informes imprimibles.

Funciones del jugador

Editar su ficha personal desde Mi cuenta.

Inscribirse en categorías abiertas.

Proponer, aceptar o registrar resultados de partidos.

Consultar rankings, calendario y noticias del club.

🧩 Estructura del proyecto
src/
├── app.js            # Configuración de Express y entrega de la SPA
├── server.js         # Punto de entrada del servidor HTTP
├── config/           # Configuración de base de datos, correo y entorno
├── controllers/      # Lógica de negocio (usuarios, categorías, partidos, etc.)
├── middleware/       # Autenticación JWT y control de errores
├── models/           # Modelos Mongoose (usuarios, categorías, partidos, etc.)
├── routes/           # Endpoints internos de la aplicación
└── utils/            # Funciones auxiliares (contraseñas, validaciones, etc.)
public/
└── app/              # Aplicación web (HTML, CSS, JS)


La API interna está disponible en /app/api/* para integraciones personalizadas.

🧰 Scripts disponibles
Comando	Descripción
npm start	Inicia el servidor en modo producción.
npm run dev	Arranca el servidor con recarga en caliente (node --watch).

Para restablecer el usuario administrador, elimina la colección users en MongoDB y recarga la aplicación: volverá a solicitar el registro inicial.
