# C.N. Playa San Marcos · Aplicación web

Aplicación completa para gestionar la liga social de tenis del C.N. Playa San Marcos. El servidor Node.js expone una única experiencia web en `http://localhost:3000`, desde la que jugadores y administradores realizan todas las acciones necesarias: alta de usuarios, gestión de categorías, inscripciones, calendario, rankings y temporadas. Los datos se almacenan en MongoDB y la capa de API queda oculta tras la propia aplicación para simplificar la instalación.

## Características principales

- **Primer inicio guiado**: la aplicación detecta si no hay administradores registrados y obliga a crear el usuario inicial antes de mostrar contenido; a partir de entonces, cada nuevo registro queda en rol de jugador hasta que un gestor le otorgue permisos adicionales.
- **Perfiles completos**: nombre, fotografía (almacenada en la base de datos con un límite de 2&nbsp;MB), teléfono, notas, horario preferido y preferencias de notificación editables desde la sección **Mi cuenta**.
- **Roles combinados bajo control**: un mismo usuario puede ejercer como jugador y administrador, pero solo los administradores existentes pueden conceder o revocar el rol; el registro automático siempre crea jugadores.
- **Panel unificado con menú lateral**: el panel izquierdo agrupa Dashboard, Club, Categorías, Partidos, Ranking, Noticias, Reglamento, Notificaciones, Directorio de jugadores y Mi cuenta. Las opciones administrativas se ocultan cuando el usuario no tiene permisos.
- **Identidad del club integrada**: la cabecera muestra el logotipo proporcionado y la sección **Club** permite editar nombre, lema, descripción, direcciones, contacto, horarios de apertura, pistas y servicios desde un único formulario modal.
- **Dashboard filtrable por categoría**: métricas, ranking destacado, próximos partidos y notificaciones personales se recalculan al cambiar la categoría seleccionada. El calendario mensual refleja los partidos confirmados y pendientes del contexto activo.
- **Calendario mensual interactivo**: la vista fija del mes permite navegar con controles anteriores/siguientes y cada evento abre el diálogo correspondiente (edición o resultado) sin abandonar la página; los partidos sin fecha quedan agrupados en un bloque específico.
- **Categorías con estados y autoinscripción**: las categorías pueden estar en estado de inscripción o en curso. Los jugadores solo ven el botón **Inscribirme** cuando su género coincide y la inscripción está abierta; si está en curso, se informa que no admite más altas.
- **Gestión de inscripciones y directorio compacto**: los administradores cuentan con formularios modales para editar categorías, gestionar inscripciones o crear jugadores sin salir de la lista. El directorio ofrece filtros por texto, género, rol o categoría y un diseño más compacto para escanear la información rápidamente.
- **Partidos filtrables y generación automática**: el selector de categorías organiza los partidos programados, pendientes por aprobar y completados. El botón **Generar pendientes** crea todos los enfrentamientos posibles entre los inscritos restantes.
- **Propuestas, confirmaciones y notificaciones**: las propuestas de fecha notifican automáticamente a oponentes y administradores suscritos. Al confirmarse un resultado se recalcula el ranking y se avisa tanto a los jugadores implicados como a los administradores que solicitan avisos de cierre de partidos.
- **Ranking imprimible con movimiento visual**: los rankings otorgan 10 puntos por victoria más un punto por cada juego ganado, muestran iconos de movimiento (ascenso, descenso o mantenimiento) y permiten generar un informe listo para imprimir con avatar y métricas clave.
- **Noticias con notificaciones personales**: solo los administradores publican en el tablón y cada aviso genera una notificación que los jugadores pueden marcar como leída desde la sección Notificaciones.
- **Reglamento accesible**: la sección dedicada resume filosofía del club, disponibilidad de pistas y normas de juego para mantener a todos informados desde la misma aplicación.

## Puesta en marcha

1. Copia el archivo de variables de entorno y personaliza los valores necesarios.

   ```bash
   cp .env.example .env
   ```

   Si no defines `MONGODB_URI` se usará automáticamente `mongodb://127.0.0.1:27017/cn-playa-san-marcos`.

   Si quieres habilitar las notificaciones push del navegador, añade también las claves VAPID y el correo de contacto que se
   usará como subject del servicio web push:

   ```dotenv
   VAPID_PUBLIC_KEY=tu_clave_publica
   VAPID_PRIVATE_KEY=tu_clave_privada
   PUSH_NOTIFICATIONS_SUBJECT=mailto:tu-correo@example.com
   ```

   Puedes generar el par de claves ejecutando `npx web-push generate-vapid-keys` (o `npx --yes web-push generate-vapid-keys`
   en CI). Sin estas variables el servidor arrancará, pero ignorará el envío de avisos push.

   Para habilitar el envío de correos electrónicos define la configuración SMTP correspondiente. Como mínimo debes indicar el
   host, el puerto y la dirección de origen que se utilizará para los avisos:

   ```dotenv
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=usuario
   SMTP_PASS=contraseña
   MAIL_FROM="C.N. Playa San Marcos <notificaciones@example.com>"
   MAIL_REPLY_TO=soporte@example.com
   ```

   Si el proveedor requiere TLS estricto puedes activar `SMTP_SECURE=true` o ajustar las opciones adicionales (`SMTP_POOL`,
   `SMTP_REQUIRE_TLS`, `SMTP_TLS_REJECT_UNAUTHORIZED`, etc.) descritas en `src/config/mail.js`.

2. Instala las dependencias del proyecto.

   ```bash
   npm install
   ```

3. Asegúrate de tener una instancia de MongoDB en ejecución.

   - En Windows, comprueba que el servicio está iniciado desde una terminal con permisos elevados:

     ```powershell
     net start MongoDB
     ```

4. El servidor acepta cuerpos JSON de hasta **5&nbsp;MB**, margen suficiente para las fotografías en Base64 de 2&nbsp;MB permitidas.

     Si aparece `Error de sistema 5. Acceso denegado.` abre PowerShell o CMD como administrador o inicia el servicio desde `services.msc`.

   - Alternativamente puedes lanzar MongoDB con Docker:

     ```bash
     docker run --name cn-playa-san-marcos-mongo -p 27017:27017 -d mongo:6
     ```

   - También es posible utilizar una instancia de Atlas configurando `MONGODB_URI` con la cadena de conexión correspondiente.

4. Inicia el servidor.

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
├── app.js               # Configuración de Express, API interna y entrega de la SPA
├── server.js            # Punto de entrada del servidor HTTP
├── config/
│   └── db.js            # Conexión y reconexión a MongoDB
├── controllers/         # Lógica de negocio (autenticación, categorías, partidos, etc.)
├── middleware/          # Autenticación JWT y manejo de errores
├── models/              # Modelos de Mongoose (usuarios, categorías, inscripciones, partidos, temporadas, chat...)
├── routes/              # Rutas internas consumidas por la aplicación web (auth, categorías, partidos, chat, etc.)
└── utils/               # Utilidades, como gestión segura de contraseñas
public/
└── app/                 # Aplicación web (HTML, CSS y JavaScript)
```

La API interna permanece disponible en `/app/api/*` para integraciones personalizadas, aunque no es necesario utilizarla manualmente para operar la liga desde la interfaz web.

## Scripts disponibles

| Script        | Descripción                                                   |
| ------------- | ------------------------------------------------------------- |
| `npm start`   | Inicia el servidor en modo producción.                        |
| `npm run dev` | Arranca el servidor con recarga en caliente (`node --watch`). |

## Versionado y registro de cambios

El proyecto sigue **versionado semántico** (`MAJOR.MINOR.PATCH`) y documenta cada entrega en `CHANGELOG.md`.

| Tipo de cambio      | Comando recomendado                     | Cuándo utilizarlo                                                     |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| Corrección o fix    | `npm version patch --no-git-tag-version` | Bugs resueltos, ajustes pequeños y mejoras compatibles.               |
| Nueva funcionalidad | `npm version minor --no-git-tag-version` | Incorporar capacidades sin romper integraciones existentes.           |
| Cambio rompedor     | `npm version major --no-git-tag-version` | Modificaciones que requieren acciones manuales o rompen compatibilidad |

Tras subir de versión:

1. Anota la novedad en `CHANGELOG.md` bajo la cabecera correspondiente.
2. Ejecuta las pruebas o comprobaciones disponibles.
3. Genera el commit y etiqueta Git que identifique la versión publicada.

---

Si necesitas restablecer el usuario administrador o limpiar la base de datos, basta con eliminar la colección `users` en MongoDB y volver a acceder a la aplicación: se solicitará crear un nuevo administrador inicial.
