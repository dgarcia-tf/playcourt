const courtReservationMenuButton = appMenu
  ? appMenu.querySelector('[data-target="section-court-reservations"]')
  : null;
const courtReservationSection = document.getElementById('section-court-reservations');
function updateMemberCourtReservationAccess() {
  const isMember = state.user?.isMember === true;

  if (courtReservationMenuButton) {
    const initialHidden = menuButtonInitialHidden.get(courtReservationMenuButton) === true;
    courtReservationMenuButton.hidden = isMember ? true : initialHidden;
  }

  if (isMember) {
    if (courtReservationSection) {
      courtReservationSection.hidden = true;
    }
    if (state.activeSection === 'section-court-reservations') {
      showSection('section-dashboard');
    }
  }
}

  } else if (state.user?.isMember === true && sectionId === 'section-court-reservations') {
    resolvedSectionId = 'section-dashboard';
    showGlobalMessage('Tu perfil no tiene acceso a la reserva de pistas.', 'error');
  updateMemberCourtReservationAccess();
      updateMemberCourtReservationAccess();
    updateMemberCourtReservationAccess();
