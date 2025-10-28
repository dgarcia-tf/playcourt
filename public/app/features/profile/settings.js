export function createProfileSettingsModule(deps = {}) {
  const {
    state,
    profileForm,
    profileEditButton,
    profileCancelButton,
    profileStatus,
    profileIsMemberCheckbox,
    profileMembershipWrapper,
    profileMembershipNumberInput,
    accountOverview,
    setStatusMessage,
    request,
    extractPhotoFromForm,
    persistSession,
    showGlobalMessage,
    fillProfileForm,
    updateProfileCard,
    toggleMembershipField,
  } = deps;

  if (!state || typeof state !== 'object') {
    throw new Error('Missing application state for profile settings module.');
  }
  if (typeof setStatusMessage !== 'function') {
    throw new Error('Missing setStatusMessage dependency for profile settings module.');
  }
  if (typeof request !== 'function') {
    throw new Error('Missing request dependency for profile settings module.');
  }
  if (typeof extractPhotoFromForm !== 'function') {
    throw new Error('Missing extractPhotoFromForm dependency for profile settings module.');
  }
  if (typeof persistSession !== 'function') {
    throw new Error('Missing persistSession dependency for profile settings module.');
  }
  if (typeof showGlobalMessage !== 'function') {
    throw new Error('Missing showGlobalMessage dependency for profile settings module.');
  }
  if (typeof fillProfileForm !== 'function') {
    throw new Error('Missing fillProfileForm dependency for profile settings module.');
  }
  if (typeof updateProfileCard !== 'function') {
    throw new Error('Missing updateProfileCard dependency for profile settings module.');
  }
  if (typeof toggleMembershipField !== 'function') {
    throw new Error('Missing toggleMembershipField dependency for profile settings module.');
  }

  function toggleProfileForm(show) {
    if (!profileForm) return;

    if (show) {
      fillProfileForm();
      profileForm.hidden = false;
      if (profileEditButton) {
        profileEditButton.hidden = true;
      }
      if (accountOverview) {
        accountOverview.hidden = true;
      }
      setStatusMessage(profileStatus, '', '');
      return;
    }

    profileForm.hidden = true;
    if (profileEditButton) {
      profileEditButton.hidden = false;
    }
    if (accountOverview) {
      accountOverview.hidden = false;
    }
    profileForm.reset();
    if (profileForm.elements?.password) {
      profileForm.elements.password.value = '';
    }
    toggleMembershipField(profileIsMemberCheckbox, profileMembershipWrapper, profileMembershipNumberInput, {
      clearWhenDisabled: true,
    });
    setStatusMessage(profileStatus, '', '');
  }

  function handleProfileMembershipChange() {
    toggleMembershipField(profileIsMemberCheckbox, profileMembershipWrapper, profileMembershipNumberInput, {
      clearWhenDisabled: true,
    });
  }

  function handleProfileEditClick() {
    toggleProfileForm(true);
    profileForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleProfileCancelClick() {
    toggleProfileForm(false);
  }

  async function handleProfileFormSubmit(event) {
    event.preventDefault();
    if (!profileForm || !state.user) {
      return;
    }

    const formData = new FormData(profileForm);
    const payload = {
      fullName: (formData.get('fullName') || '').trim(),
      email: (formData.get('email') || '').trim(),
      phone: (formData.get('phone') || '').trim(),
      preferredSchedule: formData.get('preferredSchedule'),
      gender: formData.get('gender'),
      birthDate: formData.get('birthDate'),
      notifyMatchRequests: formData.has('notifyMatchRequests'),
      notifyMatchResults: formData.has('notifyMatchResults'),
    };

    const shirtSizeRaw = (formData.get('shirtSize') || '').trim().toUpperCase();
    if (!shirtSizeRaw) {
      setStatusMessage(profileStatus, 'error', 'Selecciona tu talla de camiseta para continuar.');
      return;
    }
    payload.shirtSize = shirtSizeRaw;

    const isMember = formData.has('isMember');
    payload.isMember = isMember;
    const membershipNumberRaw = (formData.get('membershipNumber') || '').trim();
    if (isMember) {
      if (!membershipNumberRaw) {
        setStatusMessage(profileStatus, 'error', 'Indica tu número de socio para continuar.');
        return;
      }
      payload.membershipNumber = membershipNumberRaw;
    } else {
      payload.membershipNumber = '';
    }

    const notesRaw = (formData.get('notes') || '').trim();
    payload.notes = notesRaw;

    const password = formData.get('password');
    if (password) {
      payload.password = password;
    }

    setStatusMessage(profileStatus, 'info', 'Guardando cambios...');

    try {
      const photoData = await extractPhotoFromForm(profileForm);
      if (photoData) {
        payload.photo = photoData;
      }
      const data = await request('/auth/me', { method: 'PATCH', body: payload });
      state.user = data.user;
      persistSession();
      updateProfileCard();
      showGlobalMessage('Perfil actualizado correctamente.');
      toggleProfileForm(false);
    } catch (error) {
      setStatusMessage(profileStatus, 'error', error.message);
    }
  }

  return {
    toggleProfileForm,
    handleProfileMembershipChange,
    handleProfileEditClick,
    handleProfileCancelClick,
    handleProfileFormSubmit,
  };
}
