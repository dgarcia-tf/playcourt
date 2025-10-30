const tournamentBracketPreviewButton = document.getElementById('tournament-bracket-preview');
const tournamentBracketClearButton = document.getElementById('tournament-bracket-clear');
  const cachedMatches = hasBracketSelection
    ? getCachedTournamentBracketMatches(
        state.selectedBracketTournamentId,
        state.selectedBracketCategoryId
      )
    : [];

  if (tournamentBracketPreviewButton) {
    tournamentBracketPreviewButton.disabled = !isAdmin() || !hasBracketSelection;
  }

      if (bracketMatchesHaveRecordedResults(cachedMatches)) {
      } else if (cachedMatches.length) {
  if (tournamentBracketClearButton) {
    tournamentBracketClearButton.disabled =
      !isAdmin() || !hasBracketSelection || cachedMatches.length === 0;
  }

function renderTournamentBracket(
  matches = [],
  { loading = false, error = '', preview = false, previewDrawSize = null } = {}
) {
  if (tournamentBracketViewCard) {
    if (preview) {
      tournamentBracketViewCard.dataset.preview = 'true';
    } else {
      delete tournamentBracketViewCard.dataset.preview;
    }
  }

  const normalizedPreviewDrawSize = Number(previewDrawSize);
  const hasPreviewDrawSize =
    Number.isFinite(normalizedPreviewDrawSize) && normalizedPreviewDrawSize > 0;
    if (preview) {
      tournamentBracketEmpty.textContent = 'La previsualización del cuadro no tiene partidos que mostrar.';
      showConsolationMessage('La previsualización del cuadro de consolación no tiene partidos.');
    } else {
      tournamentBracketEmpty.textContent = 'Aún no se ha generado el cuadro para esta categoría.';
      showConsolationMessage('Aún no se ha generado el cuadro de consolación para esta categoría.');
    }
  const effectiveDrawSize = hasPreviewDrawSize
    ? normalizedPreviewDrawSize
    : Number(category?.drawSize);
      drawSize: effectiveDrawSize,
tournamentBracketPreviewButton?.addEventListener('click', async () => {
  if (!isAdmin()) {
    return;
  }

  const tournamentId = state.selectedBracketTournamentId;
  const categoryId = state.selectedBracketCategoryId;
  if (!tournamentId || !categoryId) {
    setStatusMessage(
      tournamentBracketStatus,
      'error',
      'Selecciona un torneo y una categoría válidos.'
    );
    return;
  }

  const assignments = collectTournamentSeedAssignments();
  const validationError = validateTournamentSeedAssignments(assignments);
  if (validationError) {
    setStatusMessage(tournamentBracketStatus, 'error', validationError);
    return;
  }

  const drawSizeValue = Number(tournamentBracketSizeSelect?.value);

  tournamentBracketPreviewButton.disabled = true;
  setStatusMessage(tournamentBracketStatus, 'info', 'Generando previsualización del cuadro...');

  try {
    const body = {
      previewOnly: true,
      seeds: assignments,
    };

    if (Number.isFinite(drawSizeValue) && drawSizeValue > 0) {
      body.drawSizeOverride = drawSizeValue;
    }

    const response = await request(
      `/tournaments/${tournamentId}/categories/${categoryId}/brackets/auto`,
      {
        method: 'POST',
        body,
      }
    );

    let list = Array.isArray(response) ? response : [];
    list = await hydrateTournamentMatchesWithPairs(list, { tournamentId, categoryId });

    renderTournamentBracket(list, {
      preview: true,
      previewDrawSize: Number.isFinite(drawSizeValue) ? drawSizeValue : undefined,
    });

    setStatusMessage(
      tournamentBracketStatus,
      'success',
      'Mostrando previsualización del cuadro. Genera el cuadro para confirmarlo.'
    );
  } catch (error) {
    setStatusMessage(tournamentBracketStatus, 'error', error.message);
  } finally {
    tournamentBracketPreviewButton.disabled = false;
    updateTournamentActionAvailability();
  }
});

tournamentBracketClearButton?.addEventListener('click', async () => {
  if (!isAdmin()) {
    return;
  }

  const tournamentId = state.selectedBracketTournamentId;
  const categoryId = state.selectedBracketCategoryId;
  if (!tournamentId || !categoryId) {
    setStatusMessage(
      tournamentBracketStatus,
      'error',
      'Selecciona un torneo y una categoría válidos.'
    );
    return;
  }

  const cachedMatches = getCachedTournamentBracketMatches(tournamentId, categoryId);
  if (!cachedMatches.length) {
    setStatusMessage(tournamentBracketStatus, 'error', 'No hay partidos que limpiar en esta categoría.');
    return;
  }

  const confirmed = await openConfirmationDialog({
    title: 'Limpiar cuadro',
    message: 'Se eliminarán todos los partidos generados en esta categoría. ¿Deseas continuar?',
    confirmLabel: 'Limpiar cuadro',
    cancelLabel: 'Cancelar',
  });

  if (!confirmed) {
    updateTournamentActionAvailability();
    return;
  }

  tournamentBracketClearButton.disabled = true;
  setStatusMessage(tournamentBracketStatus, 'info', 'Eliminando cuadro...');

  try {
    await request(`/tournaments/${tournamentId}/categories/${categoryId}/brackets`, {
      method: 'DELETE',
    });

    const cacheKey = getTournamentBracketCacheKey(tournamentId, categoryId);
    if (cacheKey && state.tournamentBracketMatches instanceof Map) {
      state.tournamentBracketMatches.delete(cacheKey);
    }

    await refreshTournamentDetail(tournamentId);
    await loadTournamentBracketContext({ tournamentId, categoryId, forceMatches: true });

    setStatusMessage(tournamentBracketStatus, 'success', 'Cuadro eliminado correctamente.');
  } catch (error) {
    setStatusMessage(tournamentBracketStatus, 'error', error.message);
  } finally {
    tournamentBracketClearButton.disabled = false;
    updateTournamentActionAvailability();
  }
});

