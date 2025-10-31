    const isModifiedClick =
      event.defaultPrevented ||
      event.button === 1 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey;

    if (isModifiedClick) {
    closeMobileMenu();
    showSection(targetId);
