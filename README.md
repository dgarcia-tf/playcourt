# Liga Tennis · Aplicación web

Aplicación completa para gestionar la liga social de tenis del Club Náutico San Marcos. El servidor Node.js expone una única experiencia web en `http://localhost:3000`, desde la que jugadores y administradores realizan todas las acciones necesarias: alta de usuarios, gestión de categorías, inscripciones, calendario, rankings, temporadas, torneos, reservas de pista y comunicaciones oficiales. Los datos se almacenan en MongoDB y la API queda oculta tras la propia aplicación para simplificar la instalación.

## Características destacadas

### Acceso, cuentas y directorio
- **Primer inicio guiado**: si la base de datos no tiene administradores, la aplicación obliga a crear el usuario inicial antes de permitir el acceso.
- **Perfiles completos**: nombre, fotografía (base64 hasta 2 MB), contacto, notas, horario preferido, talla de camiseta, estado de socio y número de membresía con verificación.
- **Roles combinados bajo control**: cada usuario puede ejercer como jugador y administrador, pero el alta automática siempre asigna el rol de jugador; los permisos extra solo los conceden administradores existentes.
- **Directorio filtrable**: búsqueda por texto, género, rol o categoría con acciones rápidas para editar, ascender a un jugador o crear usuarios manualmente.

### Gestión del club y configuración general
- **Ficha del club**: logo, lema, descripción, direcciones, contacto, horarios de apertura, pistas (superficie, iluminación, interior/exterior) y servicios, todo editable desde un único formulario.
- **Reglamento y normativa**: campos dedicados para reglamento general y específico de torneos visibles desde la SPA.

### Ligas, categorías y temporadas
- **Temporadas**: asociación de categorías a temporadas con fechas, descripción y filtrado por año.
- **Categorías enriquecidas**: género, nivel, estado (inscripción/en curso), color identificativo, formato de partido y reglas de inscripción por género o edad mínima.
- **Inscripciones**: altas manuales por administradores, autoinscripción limitada por estado y género, y gestión de solicitudes pendientes.
- **Generación automática de partidos**: creación de todos los enfrentamientos posibles entre inscritos restantes en una categoría con un clic.
- **Ranking con histórico**: puntos por victoria y juegos, instantáneas con seguimiento del movimiento, exportable en formato imprimible con avatares.

### Partidos y reservas de pista
- **Gestión integral del partido**: propuesta de fecha, aceptación/rechazo, programación, resultado en revisión y confirmación final con recalculo automático del ranking.
- **Caducidad automática**: tras 15 días sin actividad se asigna victoria por WO o se marca como caducado sin puntos, notificando a los implicados.
- **Autoconfirmación de resultados**: si pasa el tiempo configurado sin respuesta, el sistema aprueba el resultado y avisa a los jugadores.
- **Reservas de pista**: bloqueos de 75 minutos entre las 08:30 y las 22:15, con validación de solapamientos y reservas automáticas ligadas a partidos oficiales.
- **Bloqueos de pista**: registro de bloqueos por liga, torneo o clases del club con notas, reutilizables para validar la disponibilidad.

### Torneos
- **Gestión completa de torneos**: cartel, tasas diferenciadas para socios/no socios, kit de bienvenida, visibilidad privada, reglamento y estado.
- **Categorías de torneo**: formatos individuales o dobles, cuadros con rondas y emparejamientos, plantillas de orden de juego y control de estados.
- **Inscripciones y pagos**: altas/bajas, control de estatus de pago, tallas de camiseta específicas y parejas de dobles.
- **Partidos de torneo**: cuadros con seguimiento, asignación de pistas y horarios, resultados y sincronización con bloqueos de pista.
- **Orden de juego en PDF**: generación mediante PDFKit con cabeceras de torneo, rondas y horarios para distribución oficial.

### Comunicación y avisos
- **Panel de avisos / chat general**: publicación de mensajes ricos con adjuntos (máx. 5) para toda la comunidad; genera notificaciones automáticas.
- **Notificaciones multicanal**: creación, programación y envío por app interna, push o correo electrónico con sanitización y adjuntos enlazados.
- **Suscripciones push**: almacenamiento por usuario (Web Push VAPID) con envío selectivo y limpieza de endpoints caducados.
- **Preferencias individuales**: cada jugador decide si recibe avisos de solicitudes o resultados y puede reconocer (marcar como leído) sus notificaciones.

### Paneles, resúmenes y pagos
- **Dashboard filtrable**: métricas globales, próximos partidos (liga/torneo), ranking destacado, calendario mensual y recordatorios personales por categoría.
- **Resumen personal**: sección "Mi cuenta" con inscripciones activas, próximos partidos, resultados recientes y registro de pagos (pendiente, pagado, exento o fallido) tanto de ligas como de torneos.
- **Temporizadores y enlaces**: generación de metadatos para añadir partidos confirmados a calendarios externos.

### Automatizaciones y servicios de fondo
- **Servicio de expiración de partidos** (`matchExpirationService`): comprueba cada 6 h los enfrentamientos inactivos para asignar WO o caducar sin puntos.
- **Confirmación automática de resultados** (`matchResultAutoConfirmService`): revisa cada minuto los partidos en revisión y cierra el resultado pasados los minutos configurados.
- **Reservas automáticas de pista**: sincronización de horarios confirmados/propuestos con reservas bloqueadas.
- **Servicios de notificación**: envío de correos a nuevos administradores, avisos de resultados y recordatorios de programación.

## Arquitectura del proyecto

```text
src/
├── app.js               # Configuración de Express, API interna y entrega de la SPA
├── server.js            # Punto de entrada HTTP, cron interno y configuración de servicios
├── config/              # Conexión a MongoDB, correo y parámetros de confirmación de resultados
├── controllers/         # Casos de uso (auth, categorías, partidos, torneos, chat, etc.)
├── middleware/          # Autenticación JWT, autorización y manejo de errores
├── models/              # Esquemas de Mongoose (usuarios, categorías, reservas, torneos...)
├── routes/              # Rutas internas consumidas por la SPA (auth, club, matches, push, etc.)
├── services/            # Lógica compartida (reservas, ranking, notificaciones, PDF, correo, push)
└── utils/               # Utilidades para contraseñas, colores, ranking, calendario, etc.
public/
└── app/                 # Aplicación web estática entregada por Express
```

El servidor expone `/app/api` para la SPA y `/health` para comprobaciones de estado. Los recursos estáticos y subidas (carteles, avatares) se sirven desde `public/app` y `public/uploads`.

## Requisitos previos

- Node.js 18+ y npm.
- Instancia de MongoDB accesible (local, Docker o Atlas).
- Claves VAPID y credenciales SMTP opcionales si se desean notificaciones push o correo.

## Configuración del entorno

1. Duplica la plantilla de variables de entorno y personaliza los valores necesarios:

   ```bash
   cp .env.example .env
   ```

2. Variables principales:

   | Variable | Descripción |
   | --- | --- |
   | `PORT` | Puerto HTTP. Por defecto el servidor usa `3000` si no se define. |
   | `MONGODB_URI` | Cadena de conexión a MongoDB. Si se omite se usa `mongodb://127.0.0.1:27017/cn-sanmarcos`. |
   | `JWT_SECRET` | Secreto para firmar los tokens JWT. Obligatorio. |
   | `MATCH_RESULT_AUTO_CONFIRM_MINUTES` | (Opcional) Minutos para autoconfirmar resultados en revisión. Por defecto 30. |
   | `MATCH_RESULT_CHECK_INTERVAL_MS` | (Opcional) Frecuencia en milisegundos del chequeo de autoconfirmación. Por defecto 60 000. |
   | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | (Opcional) Claves Web Push. Genera el par con `npx web-push generate-vapid-keys`. |
   | `PUSH_NOTIFICATIONS_SUBJECT` | (Opcional) Subject usado por Web Push (por ejemplo `mailto:soporte@example.com`). |
   | `SMTP_*`, `MAIL_FROM`, `MAIL_REPLY_TO` | (Opcional) Configuración SMTP definida en `src/config/mail.js` para habilitar el envío de correos. |

   > El servidor acepta cuerpos JSON de hasta **5 MB**, suficiente para fotografías en Base64 de 2 MB.

3. Instala las dependencias del proyecto:

   ```bash
   npm install
   ```

4. Asegúrate de tener MongoDB en ejecución:

   - En Windows (servicio instalado):

     ```powershell
     net start MongoDB
     ```

     Si aparece `Error de sistema 5. Acceso denegado.`, abre PowerShell/CMD como administrador o inicia el servicio desde `services.msc`.

   - Con Docker:

     ```bash
     docker run --name cn-sanmarcos-mongo -p 27017:27017 -d mongo:6
     ```

   - También puedes usar MongoDB Atlas configurando `MONGODB_URI` con la cadena de conexión correspondiente.

## Puesta en marcha

1. Arranca el servidor en modo desarrollo con recarga automática:

   ```bash
   npm run dev
   ```

2. Accede a `http://localhost:PORT` (por defecto `3000`). Durante el arranque se configuran las notificaciones push (si existen claves VAPID), el transporte de correo y los servicios periódicos de caducidad/autoconfirmación.

3. En el primer acceso la aplicación solicitará crear un administrador inicial. A partir de entonces cualquier registro nuevo entrará como jugador hasta que un administrador otorgue más permisos.

El endpoint `/health` devuelve `{ "status": "ok" }` y puede usarse para monitorización.

## Flujos habituales

### Tareas del administrador

- Configurar la ficha del club (logo, contacto, horarios, pistas, servicios) desde la sección **Club** para unificar la información institucional.
- Crear temporadas y asociar categorías activas para agrupar competiciones por año.
- Definir categorías (género, nivel, formato, estado) y abrir/cerrar inscripciones según avance la liga.
- Gestionar inscripciones: aprobar solicitudes, añadir jugadores manualmente o dar de baja participantes.
- Generar enfrentamientos pendientes con **Generar pendientes** y editar partidos, categorías o jugadores mediante los formularios modales.
- Administrar torneos: altas, cartel, cuotas, categorías (individual/dobles), cuadros, órdenes de juego en PDF y bloqueos de pistas asociados.
- Registrar pagos de ligas/torneos y revisar el resumen de movimientos en la sección **Mi cuenta** de cada jugador.
- Publicar avisos oficiales desde el panel general; cada mensaje crea notificaciones que pueden enviarse por app, push o correo.
- Supervisar resultados, aprobar los que queden en revisión, dejar que el sistema autoconfirme cuando proceda y descargar rankings imprimibles.
- Crear bloqueos de pista por competición o clases y revisar las reservas activas antes de programar nuevos partidos.

### Participación de los jugadores

- Completar su perfil con foto, contacto, horario preferido, notas y preferencias de notificación desde **Mi cuenta**.
- Inscribirse en categorías compatibles mientras el estado sea **Inscripción abierta**.
- Consultar la pestaña **Partidos**: programados, pendientes de aprobación, disputados y atajos a "Mis partidos" para proponer fechas o reportar resultados.
- Proponer, aceptar o rechazar horarios; el sistema reservará la pista y notificará al rival y a los administradores suscritos.
- Revisar el **Panel de avisos** y la sección **Notificaciones** para seguir las comunicaciones oficiales y marcarlas como leídas.
- Acceder al ranking con indicadores de movimiento, reglamentos del club/torneos, temporadas vinculadas y calendario mensual sin salir de la SPA.

## Automatizaciones en segundo plano

- `scheduleMatchExpirationChecks()` ejecuta la revisión de partidos cada 6 horas (`matchExpirationService`).
- `scheduleMatchResultAutoConfirmChecks()` revisa cada minuto los partidos en revisión (`matchResultAutoConfirmService`).
- `configurePushNotifications()` y `configureMailTransport()` habilitan los canales de aviso según la configuración disponible.
- Las reservas de pista se sincronizan automáticamente mediante `courtReservationService` al confirmar o actualizar partidos.

## Licencia

Proyecto con licencia ISC. Consulta `package.json` para más detalles.
