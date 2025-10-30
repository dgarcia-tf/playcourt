# C.N. Playa San Marcos · Aplicación web

Aplicación completa para gestionar la liga social de tenis del C.N. Playa San Marcos. El servidor Node.js expone una única experiencia web en `http://localhost:3000`, desde la que jugadores y administradores realizan todas las acciones necesarias: alta de usuarios, gestión de categorías, inscripciones, calendario, rankings y temporadas. Los datos se almacenan en MongoDB y la capa de API queda oculta tras la propia aplicación para simplificar la instalación.

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


2. Instala las dependencias del proyecto.

3. Instalar dependencias
npm install

4. Configurar la base de datos

Asegúrate de tener MongoDB en ejecución.

Opción 1 — Local (recomendada para VPS):

sudo systemctl start mongod


Opción 2 — Docker:

docker run --name playcourt-mongo -p 27017:27017 -d mongo:6


También puedes usar MongoDB Atlas definiendo MONGODB_URI con tu cadena de conexión.

   ```bash
   npm run dev
   ```

La aplicación queda disponible en `http://localhost:3000`. Durante el arranque el servicio invoca automáticamente la función
`configurePushNotifications` del servidor (`src/server.js`); si las claves VAPID están presentes comenzará a aceptar
suscripciones y enviará avisos cuando los administradores marquen notificaciones como enviadas. El endpoint `/health` devuelve
un JSON de estado simple para comprobaciones automatizadas.

## Flujo de uso recomendado

### Primer acceso

1. Abre `http://localhost:3000` en tu navegador.
2. Completa el formulario de registro inicial para crear el primer administrador. Desde ese momento el resto de usuarios podrán registrarse como jugadores o ser creados por el equipo gestor.

### Tareas del administrador

- Configurar la ficha del club (logotipo, datos de contacto, horarios, pistas y servicios) desde la sección **Club** para que toda la organización comparta la misma información.
- Crear categorías definiendo género, nivel, fechas estimadas y estado (inscripción o en curso). Una vez que comienzan, cambia el estado a **En curso** para bloquear nuevas altas.
- Registrar jugadores o promover perfiles existentes desde el directorio, actualizando roles, datos de contacto y preferencias de notificación en los formularios modales.
- Revisar las inscripciones de cada categoría con la acción **Gestionar inscripciones** y, si es necesario, añadir participantes manualmente o darlos de baja.
- Generar enfrentamientos pendientes mediante el botón **Generar pendientes** en la pestaña Partidos y editar cualquier partido, categoría o jugador con los botones **Editar** disponibles en cada lista.
- Publicar avisos oficiales desde la sección **Noticias**; cada mensaje enviará notificaciones a los jugadores que podrán marcarlas como leídas.
- Supervisar resultados, aprobar los que queden en revisión y descargar el informe imprimible del ranking cuando sea necesario.

### Participación de los jugadores

- Actualizar su ficha con foto, teléfono, notas, horario preferido y preferencias de notificación desde **Mi cuenta**.
- Inscribirse en categorías compatibles con su género cuando el estado sea **Inscripción abierta** mediante el botón **Inscribirme** visible en la pestaña Categorías.
- Consultar la pestaña **Partidos**, que separa los enfrentamientos programados, los resultados pendientes por aprobar y los partidos ya disputados, además de la lista **Mis partidos** con accesos rápidos para proponer fecha.
- Confirmar o rechazar propuestas recibidas. Al aceptar, el partido queda programado, aparece en el calendario y se notifica al rival y a los administradores suscritos.
- Revisar las secciones **Noticias** y **Notificaciones** para seguir las comunicaciones oficiales y marcar como leídas las alertas pendientes.
- Consultar rankings, temporadas vinculadas y el reglamento del club sin salir de la aplicación.

## Generación y validación de partidos

1. Desde la pestaña **Partidos** pulsa **Generar pendientes** y elige la categoría que quieras completar.
2. El sistema crea todos los emparejamientos posibles entre los jugadores inscritos que todavía no tengan un partido activo entre sí.
3. Cada partido aparece como **Pendiente** en la lista de los jugadores implicados.
4. Uno de los jugadores puede proponer fecha y hora, además de indicar la pista sugerida y un mensaje para su oponente.
5. El oponente recibe la propuesta —junto con los administradores que optaron por las notificaciones de solicitudes— y puede **Aceptar** (el partido pasa a estado **Programado** y se agenda) o **Rechazar** (el partido vuelve a estado **Pendiente** y queda listo para una nueva propuesta).
6. Cualquiera de los jugadores puede registrar el resultado; el enfrentamiento queda en estado **Revisión** y aparece en la lista de "Partidos pendientes por aprobar" hasta que ambos lo confirman. Si hay discrepancias, el administrador puede aprobar o corregir el marcador desde la misma pestaña de Partidos.
7. Al confirmarse un resultado el partido pasa a estado **Completado**, se mueve al apartado de partidos disputados, se notifica a los implicados y el ranking se recalcula automáticamente.
8. Tras cada acción (creación, edición o confirmación) la página recarga los datos para reflejar los cambios sin necesidad de refrescar manualmente.

## Dashboard y navegación por secciones

- **Dashboard independiente**: tras iniciar sesión se muestra un panel inicial con tarjetas resumen de jugadores activos, partidos próximos y notificaciones pendientes. El selector de categoría filtra todas las métricas y el calendario para centrarse en la competición deseada.
- **Calendario mensual interactivo**: la vista fija del mes reúne partidos confirmados, pendientes y sin fecha en un mismo bloque. Cada elemento es accesible y abre el diálogo correspondiente (edición o resultado) con un clic.
- **Vista de Partidos enriquecida**: la pestaña Partidos divide los encuentros en programados, pendientes por aprobación y disputados, mientras que "Mis partidos" mantiene accesos rápidos para proponer fechas o registrar resultados.
- **Menú lateral fijo**: la columna izquierda alberga accesos directos a Dashboard, Categorías, Partidos, Ranking, Noticias, Reglamento, Notificaciones, el directorio de jugadores y Mi cuenta; las opciones reservadas a administradores solo aparecen cuando el usuario tiene ese rol.
- **Área "Mi cuenta"**: concentra la edición del perfil personal (foto, teléfono, horario preferido, notas y contraseña) sin mezclar los datos con las herramientas administrativas o la vista de dashboard.
- **Noticias**: un tablón único recoge los comunicados oficiales; solo los administradores publican y cada aviso genera una notificación que los jugadores pueden marcar como leída desde la sección correspondiente.
- **Impresión moderna del ranking**: el botón **Imprimir ranking** abre un informe estilizado con datos de partidos y movimiento en la clasificación listo para enviar o archivar en PDF.
- **Reglamento visible**: la sección Reglamento resume horarios, estado de las pistas y normas de fair play para que nuevos miembros se familiaricen con el club desde la misma aplicación.

## Estructura del proyecto

```text
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


La API interna permanece disponible en `/app/api/*` para integraciones personalizadas, aunque no es necesario utilizarla manualmente para operar la liga desde la interfaz web.

## Scripts disponibles

| Script        | Descripción                                                   |
| ------------- | ------------------------------------------------------------- |
| `npm start`   | Inicia el servidor en modo producción.                        |
| `npm run dev` | Arranca el servidor con recarga en caliente (`node --watch`). |

---

Si necesitas restablecer el usuario administrador o limpiar la base de datos, basta con eliminar la colección `users` en MongoDB y volver a acceder a la aplicación: se solicitará crear un nuevo administrador inicial.
