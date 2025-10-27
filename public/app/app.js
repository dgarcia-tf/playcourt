  const isTournament = enrollment.scope === 'tournament';
  const container = isTournament ? enrollment.tournament : enrollment.league;
  const titleParts = [];
  if (container?.name) {
    titleParts.push(container.name);
  }
  if (!isTournament && container?.year) {
    titleParts.push(container.year);
  }
  if (enrollment.category?.name) {
    titleParts.push(enrollment.category.name);
  }

  if (titleParts.length) {
    title.textContent = titleParts.join(' · ');
  } else {
    title.textContent = isTournament ? 'Inscripción a torneo' : 'Inscripción a liga';
  }
  if (isTournament && enrollment.status) {
    const statusSpan = document.createElement('span');
    statusSpan.textContent = `Estado: ${formatTournamentEnrollmentStatusLabel(enrollment.status)}`;
    content.appendChild(statusSpan);
  }

  meta.appendChild(document.createElement('span')).textContent = `Tipo: ${isTournament ? 'Torneo' : 'Liga'}`;
  if (isTournament && enrollment.seedNumber) {
    meta.appendChild(document.createElement('span')).textContent = `Cabeza de serie nº ${enrollment.seedNumber}`;
  }

        ? 'Tus inscripciones en ligas o torneos, tus partidos y tus pagos aparecerán aquí en cuanto participes.'
