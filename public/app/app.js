const DASHBOARD_MY_MATCH_LIMIT = 5;
const dashboardMyMatchesList = document.getElementById('dashboard-my-matches');
const dashboardMyMatchesEmpty = document.getElementById('dashboard-my-matches-empty');
  if (dashboardMyMatchesList) {
    dashboardMyMatchesList.innerHTML = '';
    dashboardMyMatchesList.hidden = true;
  }
  if (dashboardMyMatchesEmpty) {
    dashboardMyMatchesEmpty.hidden = false;
    dashboardMyMatchesEmpty.textContent = 'Inicia sesión para consultar tus partidos pendientes.';
  }
function renderDashboardMyMatches(matches = []) {
  if (!dashboardMyMatchesList || !dashboardMyMatchesEmpty) {
    return;
  }

  const isAuthenticated = Boolean(state.token);
  dashboardMyMatchesList.innerHTML = '';

  if (!isAuthenticated) {
    dashboardMyMatchesList.hidden = true;
    dashboardMyMatchesEmpty.hidden = false;
    dashboardMyMatchesEmpty.textContent = 'Inicia sesión para consultar tus partidos pendientes.';
    return;
  }

  const allowedStatuses = new Set(['pendiente', 'propuesto', 'programado', 'revision']);
  const relevantMatches = Array.isArray(matches)
    ? matches.filter((match) => allowedStatuses.has((match?.status || '').toLowerCase()))
    : [];

  if (!relevantMatches.length) {
    dashboardMyMatchesList.hidden = true;
    dashboardMyMatchesEmpty.hidden = false;
    dashboardMyMatchesEmpty.textContent = 'No tienes partidos pendientes ni programados.';
    return;
  }

  const getMatchPriority = (match) => {
    const status = (match?.status || '').toLowerCase();
    if (status === 'programado' || status === 'revision') {
      return 0;
    }
    if (status === 'propuesto') {
      return 1;
    }
    return 2;
  };

  const sortedMatches = relevantMatches
    .map((match) => {
      const scheduledTime = match?.scheduledAt ? new Date(match.scheduledAt).getTime() : Infinity;
      const proposedTime = match?.proposal?.proposedFor
        ? new Date(match.proposal.proposedFor).getTime()
        : Infinity;
      const createdTime = match?.createdAt
        ? new Date(match.createdAt).getTime()
        : match?.updatedAt
        ? new Date(match.updatedAt).getTime()
        : Infinity;
      return {
        match,
        priority: getMatchPriority(match),
        scheduledTime: Number.isFinite(scheduledTime) ? scheduledTime : Infinity,
        proposedTime: Number.isFinite(proposedTime) ? proposedTime : Infinity,
        createdTime: Number.isFinite(createdTime) ? createdTime : Infinity,
      };
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      if (a.priority === 0) {
        return a.scheduledTime - b.scheduledTime;
      }
      if (a.priority === 1) {
        return a.proposedTime - b.proposedTime;
      }
      return a.createdTime - b.createdTime;
    })
    .slice(0, DASHBOARD_MY_MATCH_LIMIT)
    .map((entry) => entry.match);

  const fragment = document.createDocumentFragment();
  sortedMatches.forEach((match) => {
    if (!match) {
      return;
    }

    const matchId = match._id || match.id;
    const item = document.createElement('li');
    item.className = 'match-list-item';
    if (matchId) {
      item.dataset.matchId = matchId;
    }

    const teams = buildMatchTeams(match.players);
    const playerLabel = Array.isArray(match.players) && match.players.length
      ? match.players.map((player) => getPlayerDisplayName(player)).join(' vs ')
      : 'Jugadores por definir';

    const accessibleTitle = document.createElement('strong');
    accessibleTitle.className = 'sr-only';
    accessibleTitle.textContent = playerLabel;
    item.appendChild(accessibleTitle);

    if (teams.length) {
      const participants = document.createElement('div');
      participants.className = 'match-list-item__participants';

      teams.forEach((team, index) => {
        if (index > 0) {
          const separator = document.createElement('span');
          separator.className = 'match-list-item__vs';
          separator.textContent = 'vs';
          participants.appendChild(separator);
        }

        const teamElement = document.createElement('div');
        teamElement.className = 'match-list-item__team';

        team.forEach((player) => {
          const normalized = normalizeMatchPlayer(player);
          if (!normalized) return;

          const playerElement = document.createElement('div');
          playerElement.className = 'match-list-item__player';
          playerElement.title = getPlayerDisplayName(normalized);
          playerElement.appendChild(createAvatarElement(normalized, { size: 'sm' }));

          const name = document.createElement('span');
          name.className = 'match-list-item__player-name';
          name.textContent = getPlayerDisplayName(normalized);
          playerElement.appendChild(name);

          teamElement.appendChild(playerElement);
        });

        participants.appendChild(teamElement);
      });

      item.appendChild(participants);
    } else {
      const title = document.createElement('strong');
      title.textContent = playerLabel;
      item.appendChild(title);
    }

    const meta = document.createElement('div');
    meta.className = 'meta match-list-item__meta';

    const statusLabel = STATUS_LABELS[match.status] || match.status;
    if (statusLabel) {
      const statusTag = document.createElement('span');
      statusTag.className = `tag status-${match.status}`;
      statusTag.textContent = statusLabel;
      meta.appendChild(statusTag);
    }

    const scheduledLabel = formatDate(match.scheduledAt);
    if (scheduledLabel) {
      meta.appendChild(document.createElement('span')).textContent = scheduledLabel;
      if (match.court) {
        meta.appendChild(document.createElement('span')).textContent = `Pista ${match.court}`;
      }
    } else if (match.proposal?.proposedFor) {
      const proposer = match.proposal?.requestedBy?.fullName || 'Un jugador';
      meta.appendChild(document.createElement('span')).textContent = `${proposer} propuso ${formatDate(
        match.proposal.proposedFor
      )}`;
      if (match.court) {
        meta.appendChild(document.createElement('span')).textContent = `Pista sugerida: ${match.court}`;
      }
    } else {
      meta.appendChild(document.createElement('span')).textContent = 'Sin horario asignado.';
    }

    if (match.category?.name) {
      const categoryTag = document.createElement('span');
      categoryTag.className = 'tag match-category-tag';
      categoryTag.textContent = match.category.name;
      applyCategoryTagColor(categoryTag, match.category.color);
      meta.appendChild(categoryTag);
    }

    if (match.scope === 'league' && match.league?.name) {
      const scopeTag = document.createElement('span');
      scopeTag.className = 'tag';
      scopeTag.textContent = match.league.name;
      meta.appendChild(scopeTag);
    } else if (match.scope === 'tournament' && match.tournament?.name) {
      const scopeTag = document.createElement('span');
      scopeTag.className = 'tag';
      scopeTag.textContent = match.tournament.name;
      meta.appendChild(scopeTag);
    }

    item.appendChild(meta);

    const needsReservation = !match.scheduledAt;
    if (needsReservation && matchId) {
      const actions = document.createElement('div');
      actions.className = 'dashboard-my-matches__actions';
      const reserveButton = document.createElement('button');
      reserveButton.type = 'button';
      reserveButton.className = 'link-button';
      reserveButton.dataset.action = 'open-reservation';
      reserveButton.dataset.matchId = matchId;
      reserveButton.textContent = 'Generar reserva';
      actions.appendChild(reserveButton);
      item.appendChild(actions);
    }

    fragment.appendChild(item);
  });

  dashboardMyMatchesList.hidden = false;
  dashboardMyMatchesList.appendChild(fragment);
  dashboardMyMatchesEmpty.hidden = true;
}

async function openReservationForMatch(matchId) {
  if (!matchId) {
    return;
  }

  if (!state.token) {
    showGlobalMessage('Debes iniciar sesión para reservar una pista.', 'error');
    return;
  }

  const match = findMatchById(matchId);
  if (!match) {
    showGlobalMessage('No fue posible encontrar los datos del partido.', 'error');
    return;
  }

  showSection('section-court-reservations');

  const players = Array.isArray(match.players) ? match.players : [];
  const currentUserId = normalizeId(state.user);
  const participantIds = players
    .map((player) => normalizeId(player))
    .filter((id) => id && id !== currentUserId);

  const uniqueParticipantIds = Array.from(new Set(participantIds));
  const matchLabel = formatMatchPlayersLabel(players);
  const defaultGameType = uniqueParticipantIds.length > 1 ? 'dobles' : 'individual';

  await openReservationEditorFromCalendar({
    participantIds: uniqueParticipantIds,
    gameType: defaultGameType,
    match,
    matchLabel,
  });
}

  const participantIdsRaw = Array.isArray(eventData.participantIds) ? eventData.participantIds : [];
  const preselectedParticipants = participantIdsRaw
    .map((id) => normalizeId(id))
    .filter(Boolean);
  const uniquePreselectedParticipants = Array.from(new Set(preselectedParticipants));
  const matchContext = eventData.match || null;
  const providedMatchLabel = typeof eventData.matchLabel === 'string' ? eventData.matchLabel.trim() : '';
  const matchPlayers = Array.isArray(matchContext?.players) ? matchContext.players : [];
  const computedMatchLabel = providedMatchLabel || formatMatchPlayersLabel(matchPlayers) || '';
  const matchCategoryLabel = matchContext?.category?.name || '';
  const matchScopeLabel = (() => {
    if (matchContext?.scope === 'league') {
      return matchContext.league?.name || '';
    }
    if (matchContext?.scope === 'tournament') {
      return matchContext.tournament?.name || '';
    }
    return '';
  })();
  const defaultGameType =
    eventData.gameType === 'dobles'
      ? 'dobles'
      : eventData.gameType === 'individual'
      ? 'individual'
      : uniquePreselectedParticipants.length > 1
      ? 'dobles'
      : 'individual';
  if (computedMatchLabel || matchCategoryLabel || matchScopeLabel) {
    const contextBox = document.createElement('div');
    contextBox.className = 'reservation-modal-context';
    const title = document.createElement('strong');
    title.textContent = 'Reserva vinculada a un partido';
    contextBox.appendChild(title);

    if (computedMatchLabel) {
      const matchLine = document.createElement('span');
      matchLine.textContent = computedMatchLabel;
      contextBox.appendChild(matchLine);
    }

    const detailParts = [];
    if (matchCategoryLabel) {
      detailParts.push(`Categoría: ${matchCategoryLabel}`);
    }
    if (matchScopeLabel) {
      detailParts.push(matchScopeLabel);
    }

    if (detailParts.length) {
      const detailsLine = document.createElement('span');
      detailsLine.textContent = detailParts.join(' · ');
      contextBox.appendChild(detailsLine);
    }

    form.appendChild(contextBox);
  }

  let preselectionApplied = false;
  const applyPreselectedParticipants = () => {
    if (preselectionApplied) {
      return;
    }
    if (!uniquePreselectedParticipants.length) {
      return;
    }
    const selects = Array.from(participantsContainer.querySelectorAll('select'));
    if (!selects.length) {
      return;
    }

    let applied = false;
    selects.forEach((select, index) => {
      const participantId = uniquePreselectedParticipants[index];
      if (!participantId) {
        return;
      }
      const option = Array.from(select.options).find((opt) => opt.value === participantId);
      if (option) {
        select.value = participantId;
        applied = true;
      }
    });

    if (applied) {
      preselectionApplied = true;
    }
  };

    applyPreselectedParticipants();
    renderDashboardMyMatches(state.myMatches);
dashboardMyMatchesList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action="open-reservation"]');
  if (!button) return;

  const { matchId } = button.dataset;
  if (!matchId) return;

  button.disabled = true;

  try {
    await openReservationForMatch(matchId);
  } catch (error) {
    showGlobalMessage(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

