function reloadToSection(sectionId) {
  if (typeof window === 'undefined') {
    return false;
  }

  const targetPath = buildPathFromSection(sectionId);
  if (!targetPath) {
    return false;
  }

  const normalizedTarget = normalizeHistoryPath(targetPath);
  const normalizedCurrent = normalizeHistoryPath(window.location.pathname || '/');

  if (normalizedTarget !== normalizedCurrent) {
    window.location.assign(targetPath);
  } else {
    window.location.reload();
  }

  return true;
}


    const currentSectionId =
      state.activeSection ||
      (typeof window !== 'undefined' ? getSectionIdFromPath(window.location.pathname || '/') : null);

    if (targetId !== currentSectionId) {
      const reloaded = reloadToSection(targetId);
      if (reloaded) {
        return;
      }
    }

