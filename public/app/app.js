



  const match = getReservationMatch(reservation);
  if (match && Array.isArray(match.players) && match.players.length) {
    const label = formatMatchPlayersLabel(match.players);
    if (label) {
      return label;
    }
  }

    const participantsLabel = formatReservationParticipantsLabel(reservation);
    if (participantsLabel) {
      participantsRow.appendChild(document.createElement('span')).textContent = participantsLabel;
        const participantsLabel = formatReservationParticipantsLabel(reservation);
        if (participantsLabel) {
          slot.appendChild(document.createElement('span')).textContent = participantsLabel;
        const participantsLabel = formatReservationParticipantsLabel(reservation);
        if (participantsLabel) {
          info.appendChild(document.createElement('span')).textContent = participantsLabel;
