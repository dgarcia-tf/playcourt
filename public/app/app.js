    const href = button.getAttribute('href');
    if (href) {
      closeMobileMenu();
      window.location.assign(href);
      return;

    event.preventDefault();
    window.location.reload();
