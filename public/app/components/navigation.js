import { buildPathFromSection as defaultBuildPathFromSection } from '../config/routes.js';

function noop() {}
function asyncNoop() {
  return Promise.resolve();
}

export function createNavigationManager(deps = {}) {
  const {
    state,
    authView = null,
    appView = null,
    appMenu = null,
    appSidebar = null,
    appSections: rawSections = [],
    mobileMenuToggle = null,
    mobileMenuBackdrop = null,
    mobileMenuClose = null,
    mobileTopbarLogo = null,
    mobileTopbarTitle = null,
    matchesMenuBadge = null,
    adminToggleElements: rawAdminToggleElements = [],
    generalChatForm = null,
    generalChatInput = null,
    showGlobalMessage = noop,
    toggleProfileForm = noop,
    syncNoticeBoardState = noop,
    loadGlobalOverview: loadGlobalOverviewHandler,
    loadLeagueDashboard: loadLeagueDashboardHandler,
    refreshLeaguePayments: refreshLeaguePaymentsHandler,
    loadTournamentDashboard: loadTournamentDashboardHandler,
    refreshTournamentDoubles: refreshTournamentDoublesHandler,
    refreshTournamentDetail: refreshTournamentDetailHandler,
    updateBracketCategoryOptions: updateBracketCategoryOptionsHandler,
    loadTournamentBracketContext: loadTournamentBracketContextHandler,
    loadAccountSummary: loadAccountSummaryHandler,
    getLeaguesWithEnrollmentFee: getLeaguesWithEnrollmentFeeHandler = () => [],
    getTournamentsWithEnrollmentFee: getTournamentsWithEnrollmentFeeHandler = () => [],
    isAdmin = () => false,
    isCourtManager = () => false,
    hasCourtManagementAccess = () => false,
    refreshTournamentBracketLayoutColumns: refreshTournamentBracketLayoutColumnsHandler = noop,
    updateProfileCard = noop,
    updatePushSettingsUI = noop,
    resetData = noop,
    setStatusMessage = noop,
    tournamentBracketStatus = null,
    getShouldReplaceHistory = () => false,
    setShouldReplaceHistory = noop,
    syncSectionRoute = noop,
    buildPathFromSection = defaultBuildPathFromSection,
    normalizeHistoryPath = (value) => value || '/',
    getSectionIdFromPath = () => null,
    documentRef = typeof document !== 'undefined' ? document : null,
    windowRef = typeof window !== 'undefined' ? window : null,
  } = deps;

  if (!state) {
    throw new Error('Navigation manager requires application state.');
  }

  const requestAnimation =
    typeof windowRef?.requestAnimationFrame === 'function'
      ? windowRef.requestAnimationFrame.bind(windowRef)
      : (callback) => setTimeout(callback, 0);

  const appSections = Array.from(rawSections || []);
  const adminToggleElements = Array.from(rawAdminToggleElements || []);

  const menuButtons = appMenu ? Array.from(appMenu.querySelectorAll('.menu-button')) : [];
  const adminMenuButtons = menuButtons.filter((button) => button.dataset.requiresAdmin === 'true');
  const adminSectionIds = new Set(adminMenuButtons.map((button) => button.dataset.target));
  const courtManagerMenuButtons = menuButtons.filter(
    (button) => button.dataset.requiresCourtManager === 'true'
  );
  const courtManagerSectionIds = new Set(
    courtManagerMenuButtons.map((button) => button.dataset.target)
  );
  const menuButtonInitialHidden = new Map(menuButtons.map((button) => [button, button.hidden]));

  const collapsibleMenuGroups = appMenu
    ? Array.from(appMenu.querySelectorAll('[data-collapsible="true"]'))
        .map((group) => {
          const parentButton = group.querySelector('.menu-button--parent');
          const submenu = group.querySelector('.menu-submenu');
          if (!parentButton || !submenu) {
            return null;
          }
          const menuGroup = {
            group,
            parentButton,
            submenu,
            target: parentButton.dataset.target || null,
            collapseTimeoutId: null,
          };
          setMenuGroupExpanded(menuGroup, false);
          return menuGroup;
        })
        .filter(Boolean)
    : [];

  const collapsibleMenuGroupsByElement = new Map();
  const collapsibleMenuGroupsByTarget = new Map();
  collapsibleMenuGroups.forEach((menuGroup) => {
    if (menuGroup.target) {
      collapsibleMenuGroupsByTarget.set(menuGroup.target, menuGroup);
    }
    if (menuGroup.group) {
      collapsibleMenuGroupsByElement.set(menuGroup.group, menuGroup);
    }
  });

  const handlers = {
    loadGlobalOverview:
      typeof loadGlobalOverviewHandler === 'function' ? loadGlobalOverviewHandler : asyncNoop,
    loadLeagueDashboard:
      typeof loadLeagueDashboardHandler === 'function' ? loadLeagueDashboardHandler : asyncNoop,
    refreshLeaguePayments:
      typeof refreshLeaguePaymentsHandler === 'function' ? refreshLeaguePaymentsHandler : asyncNoop,
    loadTournamentDashboard:
      typeof loadTournamentDashboardHandler === 'function'
        ? loadTournamentDashboardHandler
        : asyncNoop,
    refreshTournamentDoubles:
      typeof refreshTournamentDoublesHandler === 'function'
        ? refreshTournamentDoublesHandler
        : asyncNoop,
    refreshTournamentDetail:
      typeof refreshTournamentDetailHandler === 'function'
        ? refreshTournamentDetailHandler
        : asyncNoop,
    updateBracketCategoryOptions:
      typeof updateBracketCategoryOptionsHandler === 'function'
        ? updateBracketCategoryOptionsHandler
        : noop,
    loadTournamentBracketContext:
      typeof loadTournamentBracketContextHandler === 'function'
        ? loadTournamentBracketContextHandler
        : asyncNoop,
    loadAccountSummary:
      typeof loadAccountSummaryHandler === 'function' ? loadAccountSummaryHandler : asyncNoop,
    getLeaguesWithEnrollmentFee: getLeaguesWithEnrollmentFeeHandler,
    getTournamentsWithEnrollmentFee: getTournamentsWithEnrollmentFeeHandler,
    refreshTournamentBracketLayoutColumns: refreshTournamentBracketLayoutColumnsHandler,
    updateLeaguePaymentMenuVisibility: noop,
    updateTournamentPaymentMenuVisibility: noop,
  };

  function updateHandlers(newHandlers = {}) {
    if (typeof newHandlers.loadGlobalOverview === 'function') {
      handlers.loadGlobalOverview = newHandlers.loadGlobalOverview;
    }
    if (typeof newHandlers.loadLeagueDashboard === 'function') {
      handlers.loadLeagueDashboard = newHandlers.loadLeagueDashboard;
    }
    if (typeof newHandlers.refreshLeaguePayments === 'function') {
      handlers.refreshLeaguePayments = newHandlers.refreshLeaguePayments;
    }
    if (typeof newHandlers.loadTournamentDashboard === 'function') {
      handlers.loadTournamentDashboard = newHandlers.loadTournamentDashboard;
    }
    if (typeof newHandlers.refreshTournamentDoubles === 'function') {
      handlers.refreshTournamentDoubles = newHandlers.refreshTournamentDoubles;
    }
    if (typeof newHandlers.refreshTournamentDetail === 'function') {
      handlers.refreshTournamentDetail = newHandlers.refreshTournamentDetail;
    }
    if (typeof newHandlers.updateBracketCategoryOptions === 'function') {
      handlers.updateBracketCategoryOptions = newHandlers.updateBracketCategoryOptions;
    }
    if (typeof newHandlers.loadTournamentBracketContext === 'function') {
      handlers.loadTournamentBracketContext = newHandlers.loadTournamentBracketContext;
    }
    if (typeof newHandlers.loadAccountSummary === 'function') {
      handlers.loadAccountSummary = newHandlers.loadAccountSummary;
    }
    if (typeof newHandlers.getLeaguesWithEnrollmentFee === 'function') {
      handlers.getLeaguesWithEnrollmentFee = newHandlers.getLeaguesWithEnrollmentFee;
    }
    if (typeof newHandlers.getTournamentsWithEnrollmentFee === 'function') {
      handlers.getTournamentsWithEnrollmentFee = newHandlers.getTournamentsWithEnrollmentFee;
    }
    if (typeof newHandlers.refreshTournamentBracketLayoutColumns === 'function') {
      handlers.refreshTournamentBracketLayoutColumns =
        newHandlers.refreshTournamentBracketLayoutColumns;
    }
    if (typeof newHandlers.updateLeaguePaymentMenuVisibility === 'function') {
      handlers.updateLeaguePaymentMenuVisibility = newHandlers.updateLeaguePaymentMenuVisibility;
    }
    if (typeof newHandlers.updateTournamentPaymentMenuVisibility === 'function') {
      handlers.updateTournamentPaymentMenuVisibility =
        newHandlers.updateTournamentPaymentMenuVisibility;
    }
  }

  function setMenuGroupExpanded(menuGroup, expanded) {
    if (!menuGroup) return;
    const { parentButton, submenu, group } = menuGroup;
    if (expanded) {
      cancelScheduledCollapse(menuGroup);
    }
    if (parentButton) {
      parentButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
    if (group) {
      group.classList.toggle('menu-group--expanded', expanded);
    }
    if (submenu) {
      submenu.hidden = !expanded;
    }
  }

  function focusFirstSubmenuButton(menuGroup) {
    const candidate = menuGroup?.submenu?.querySelector(
      '.menu-button:not([disabled]):not([hidden])'
    );
    if (!candidate) {
      return;
    }
    requestAnimation(() => {
      candidate.focus();
    });
  }

  function expandMenuGroup(menuGroup, { focusFirstItem = false } = {}) {
    if (!menuGroup) {
      return;
    }
    collapsibleMenuGroups.forEach((otherGroup) => {
      if (otherGroup !== menuGroup) {
        setMenuGroupExpanded(otherGroup, false);
      }
    });
    setMenuGroupExpanded(menuGroup, true);
    if (focusFirstItem) {
      focusFirstSubmenuButton(menuGroup);
    }
  }

  function cancelScheduledCollapse(menuGroup) {
    if (!menuGroup || menuGroup.collapseTimeoutId == null) {
      return;
    }
    if (typeof windowRef?.clearTimeout === 'function') {
      windowRef.clearTimeout(menuGroup.collapseTimeoutId);
    } else {
      clearTimeout(menuGroup.collapseTimeoutId);
    }
    menuGroup.collapseTimeoutId = null;
  }

  const desktopMediaQuery =
    windowRef?.matchMedia instanceof Function ? windowRef.matchMedia('(min-width: 1025px)') : null;
  const hoverMediaQuery =
    windowRef?.matchMedia instanceof Function ? windowRef.matchMedia('(hover: hover)') : null;

  function shouldUseHoverNavigation() {
    return Boolean(desktopMediaQuery?.matches && hoverMediaQuery?.matches);
  }

  function isMenuGroupActive(menuGroup) {
    if (!menuGroup) {
      return false;
    }

    if (shouldUseHoverNavigation()) {
      const activeElement = documentRef?.activeElement || null;
      const hasFocus = menuGroup.group?.contains(activeElement);
      const isHovered = menuGroup.group?.matches(':hover');
      if (!hasFocus && !isHovered) {
        return false;
      }
    }

    if (menuGroup.parentButton?.classList.contains('active')) {
      return true;
    }
    return Boolean(menuGroup.submenu?.querySelector('.menu-button.active'));
  }

  function scheduleCollapseIfInactive(menuGroup) {
    if (!menuGroup) {
      return;
    }
    cancelScheduledCollapse(menuGroup);
    const delay = shouldUseHoverNavigation() ? 120 : 0;
    const collapse = () => {
      const activeElement = documentRef?.activeElement || null;
      if (menuGroup.group?.contains(activeElement)) {
        return;
      }
      if (isMenuGroupActive(menuGroup)) {
        return;
      }
      setMenuGroupExpanded(menuGroup, false);
      menuGroup.collapseTimeoutId = null;
    };
    if (delay > 0) {
      menuGroup.collapseTimeoutId = (windowRef || window).setTimeout(collapse, delay);
    } else {
      requestAnimation(collapse);
    }
  }

  function collapseInactiveMenuGroups() {
    collapsibleMenuGroups.forEach((menuGroup) => {
      if (!isMenuGroupActive(menuGroup)) {
        setMenuGroupExpanded(menuGroup, false);
      }
    });
  }

  function handleOutsideMenuClick(event) {
    if (!shouldUseHoverNavigation()) {
      return;
    }
    if (event.defaultPrevented) {
      return;
    }
    const menuGroupElement = event.target.closest?.('.menu-group');
    if (menuGroupElement) {
      return;
    }
    collapsibleMenuGroups.forEach((menuGroup) => {
      if (!isMenuGroupActive(menuGroup)) {
        setMenuGroupExpanded(menuGroup, false);
      }
    });
  }

  function isMobileMenuSupported() {
    return Boolean(appSidebar && mobileMenuToggle);
  }

  function isMobileMenuOpen() {
    return appSidebar?.classList.contains('sidebar--mobile-open');
  }

  function openMobileMenu() {
    if (!isMobileMenuSupported()) return;

    appSidebar.classList.add('sidebar--mobile-open');
    documentRef?.body?.classList.add('mobile-menu-open');
    if (mobileMenuToggle) {
      mobileMenuToggle.setAttribute('aria-expanded', 'true');
    }
    if (mobileMenuBackdrop) {
      mobileMenuBackdrop.hidden = false;
      requestAnimation(() => {
        mobileMenuBackdrop.classList.add('is-active');
      });
    }

    const focusTarget = menuButtons.find((button) => !button.hidden && !button.disabled) || appSidebar;
    if (focusTarget) {
      requestAnimation(() => {
        focusTarget.focus();
      });
    }
  }

  function closeMobileMenu({ restoreFocus = false } = {}) {
    if (!isMobileMenuSupported()) return;

    appSidebar.classList.remove('sidebar--mobile-open');
    documentRef?.body?.classList.remove('mobile-menu-open');
    if (mobileMenuToggle) {
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }

    if (mobileMenuBackdrop && !mobileMenuBackdrop.hidden) {
      const finalize = () => {
        mobileMenuBackdrop.hidden = true;
        mobileMenuBackdrop.classList.remove('is-active');
      };

      mobileMenuBackdrop.addEventListener('transitionend', finalize, { once: true });
      mobileMenuBackdrop.addEventListener('transitioncancel', finalize, { once: true });

      requestAnimation(() => {
        mobileMenuBackdrop.classList.remove('is-active');
        const getStyle =
          typeof windowRef?.getComputedStyle === 'function'
            ? windowRef.getComputedStyle.bind(windowRef)
            : typeof getComputedStyle === 'function'
            ? getComputedStyle
            : null;
        const styles = getStyle ? getStyle(mobileMenuBackdrop) : null;
        const durations = styles?.transitionDuration
          ? styles.transitionDuration.split(',').map((value) => parseFloat(value) || 0)
          : [0];
        const hasDuration = durations.some((duration) => duration > 0);
        if (!hasDuration) {
          finalize();
        }
      });
    }

    if (restoreFocus && mobileMenuToggle) {
      mobileMenuToggle.focus();
    }
  }

  function toggleMobileMenu() {
    if (!isMobileMenuSupported()) return;
    if (isMobileMenuOpen()) {
      closeMobileMenu({ restoreFocus: true });
    } else {
      openMobileMenu();
    }
  }

  function handleDesktopMediaChange(event) {
    if (event.matches) {
      closeMobileMenu();
      setActiveMenu(state.activeSection);
    } else {
      collapseInactiveMenuGroups();
    }
  }

  function handleHoverMediaChange() {
    if (shouldUseHoverNavigation()) {
      setActiveMenu(state.activeSection);
    } else {
      collapseInactiveMenuGroups();
    }
  }

  function addParentTargets(button, activeTargets, visitedTargets = new Set()) {
    let currentButton = button;
    while (currentButton) {
      const parentTarget = currentButton.dataset?.parentTarget;
      if (!parentTarget || visitedTargets.has(parentTarget)) {
        return;
      }

      visitedTargets.add(parentTarget);
      activeTargets.add(parentTarget);

      const parentButton = menuButtons.find((candidate) => candidate.dataset.target === parentTarget);
      if (!parentButton || parentButton === currentButton) {
        return;
      }
      currentButton = parentButton;
    }
  }

  function setActiveMenu(targetId = null) {
    if (!menuButtons.length) return;

    const activeTargets = new Set();

    if (targetId) {
      activeTargets.add(targetId);
      const matchingButtons = menuButtons.filter((button) => button.dataset.target === targetId);
      const targetButton = matchingButtons[0];
      if (targetButton) {
        addParentTargets(targetButton, activeTargets);
      }
    }

    menuButtons.forEach((button) => {
      const target = button.dataset.target;
      button.classList.toggle('active', target ? activeTargets.has(target) : false);
    });

    if (collapsibleMenuGroups.length) {
      const allowAutomaticExpansion = !shouldUseHoverNavigation();
      collapsibleMenuGroups.forEach((menuGroup) => {
        const shouldExpand =
          allowAutomaticExpansion && menuGroup.target ? activeTargets.has(menuGroup.target) : false;
        setMenuGroupExpanded(menuGroup, shouldExpand);
      });
    }
  }

  function updateMatchesMenuBadge(count = 0) {
    if (!matchesMenuBadge) return;
    const numeric = Number(count);
    const resolved = Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0;
    matchesMenuBadge.textContent = String(resolved);
    matchesMenuBadge.hidden = resolved <= 0;
  }

  function updateAdminMenuVisibility() {
    if (!adminMenuButtons.length) return;
    const shouldShow = isAdmin();
    adminMenuButtons.forEach((button) => {
      button.hidden = !shouldShow;
    });

    if (adminToggleElements.length) {
      adminToggleElements.forEach((element) => {
        if (!element) return;
        element.hidden = !shouldShow;
      });
      handlers.refreshTournamentBracketLayoutColumns();
    }

    if (generalChatForm) {
      generalChatForm.hidden = !shouldShow;
    }

    if (generalChatInput) {
      generalChatInput.disabled = !shouldShow;
    }

    handlers.updateLeaguePaymentMenuVisibility();
    handlers.updateTournamentPaymentMenuVisibility();

    if (!shouldShow && adminSectionIds.size) {
      adminSectionIds.forEach((sectionId) => {
        const section = documentRef?.getElementById?.(sectionId);
        if (section) {
          section.hidden = true;
        }
      });
    }

    if (!shouldShow && adminSectionIds.has(state.activeSection)) {
      showSection('section-dashboard');
    }
  }

  function updateCourtManagerMenuVisibility() {
    if (!courtManagerMenuButtons.length) return;
    const shouldShow = hasCourtManagementAccess();
    courtManagerMenuButtons.forEach((button) => {
      button.hidden = !shouldShow;
    });

    if (!shouldShow && courtManagerSectionIds.has(state.activeSection)) {
      showSection('section-dashboard');
    }
  }

  function applyCourtManagerMenuRestrictions() {
    if (!menuButtons.length) return;

    const restricted = isCourtManager() && !isAdmin();
    const allowedTargets = new Set([
      'section-court-reservations',
      'section-court-admin',
      'section-account',
    ]);

    menuButtons.forEach((button) => {
      if (button.dataset.requiresAdmin === 'true' || button.dataset.requiresCourtManager === 'true') {
        return;
      }

      const initialHidden = menuButtonInitialHidden.get(button) === true;
      if (!restricted) {
        button.hidden = initialHidden;
        return;
      }

      const target = button.dataset.target;
      if (!target || button.dataset.action === 'logout') {
        button.hidden = initialHidden;
        return;
      }

      button.hidden = !allowedTargets.has(target);
    });
  }

  function showSection(sectionId, { syncHistory = true, replace = false } = {}) {
    if (!sectionId || !appSections.length || !documentRef) return;

    const targetSection = documentRef.getElementById(sectionId);
    if (!targetSection) return;

    let resolvedSectionId = sectionId;
    if (targetSection.dataset.adminOnly === 'true' && !isAdmin()) {
      resolvedSectionId = 'section-dashboard';
      showGlobalMessage('Necesitas permisos de administrador para acceder a esta sección.', 'error');
    } else if (targetSection.dataset.requiresCourtManager === 'true' && !hasCourtManagementAccess()) {
      resolvedSectionId = 'section-dashboard';
      showGlobalMessage('Necesitas permisos de gestor de pistas para acceder a esta sección.', 'error');
    } else if (isCourtManager() && !isAdmin()) {
      const allowed = new Set(['section-court-reservations', 'section-court-admin', 'section-account']);
      if (!allowed.has(sectionId)) {
        resolvedSectionId = 'section-court-admin';
        showGlobalMessage('Tu perfil solo tiene acceso a la gestión de pistas y reservas.', 'error');
      }
    }

    const previousSectionId = state.activeSection;
    state.activeSection = resolvedSectionId;

    if (syncHistory) {
      const shouldReplaceHistory = replace || getShouldReplaceHistory() || !previousSectionId;
      syncSectionRoute(resolvedSectionId, { replace: shouldReplaceHistory });
    }
    setShouldReplaceHistory(false);

    appSections.forEach((section) => {
      if (section) {
        section.hidden = section.id !== resolvedSectionId;
      }
    });

    if (resolvedSectionId !== 'section-account') {
      toggleProfileForm(false);
    }

    setActiveMenu(resolvedSectionId);
    closeMobileMenu();
    syncNoticeBoardState();

    switch (resolvedSectionId) {
      case 'section-dashboard':
        handlers.loadGlobalOverview({ force: false });
        break;
      case 'section-league-dashboard':
        handlers.loadLeagueDashboard({ force: false });
        break;
      case 'section-league-payments':
        Promise.resolve(handlers.refreshLeaguePayments({ force: false })).catch((error) => {
          console.warn('No se pudo cargar los pagos de liga', error);
        });
        break;
      case 'section-tournament-dashboard':
        handlers.loadTournamentDashboard({ force: false });
        break;
      case 'section-tournament-doubles':
        handlers.refreshTournamentDoubles();
        break;
      case 'section-tournament-brackets':
        Promise.resolve(handlers.refreshTournamentDetail(state.selectedBracketTournamentId))
          .catch((error) => {
            if (tournamentBracketStatus) {
              setStatusMessage(tournamentBracketStatus, 'error', error.message);
            }
          })
          .finally(() => {
            handlers.updateBracketCategoryOptions();
          });
        if (state.selectedBracketTournamentId && state.selectedBracketCategoryId) {
          handlers.loadTournamentBracketContext({ forceMatches: false });
        }
        break;
      case 'section-account':
        handlers.loadAccountSummary({ force: false });
        break;
      default:
        break;
    }

    return resolvedSectionId;
  }

  function updateAuthUI() {
    const loggedIn = Boolean(state.token && state.user);
    if (authView) {
      authView.hidden = loggedIn;
      authView.classList.toggle('is-hidden', loggedIn);
    }
    if (appView) {
      appView.hidden = !loggedIn;
    }
    if (appMenu) {
      appMenu.hidden = !loggedIn;
    }
    if (appSidebar) {
      appSidebar.hidden = !loggedIn;
    }

    if (!loggedIn) {
      closeMobileMenu();
      if (typeof resetData === 'function') {
        resetData();
      }
      showGlobalMessage('Inicia sesión para acceder al panel de la liga.');
      appSections.forEach((section) => {
        if (section) {
          section.hidden = true;
        }
      });
      state.activeSection = 'section-dashboard';
      setActiveMenu(null);
    } else {
      showGlobalMessage('');
      updateProfileCard();
      state.activeSection = state.activeSection || 'section-dashboard';
      showSection(state.activeSection);
    }

    updateAdminMenuVisibility();
    updateCourtManagerMenuVisibility();
    applyCourtManagerMenuRestrictions();
    updatePushSettingsUI();
  }

  function handleMenuClick(event) {
    const button = event.target.closest?.('.menu-button');
    if (!button || button.hidden || button.disabled) return;

    const targetId = button.dataset.target;
    const menuGroupElement = button.closest('.menu-group');
    const menuGroup = menuGroupElement ? collapsibleMenuGroupsByElement.get(menuGroupElement) : null;
    const hasSubmenu = Boolean(menuGroup?.submenu);
    const submenuExpanded = hasSubmenu ? !menuGroup.submenu.hidden : false;
    const focusFirstItem = shouldUseHoverNavigation();
    const isParentButton = menuGroup?.parentButton === button;
    const instantNavigate = button.dataset.instantNavigate === 'true';

    if (hasSubmenu && !submenuExpanded) {
      if (isParentButton && instantNavigate) {
        setMenuGroupExpanded(menuGroup, true);
      } else {
        event.preventDefault();
        expandMenuGroup(menuGroup, { focusFirstItem });
        return;
      }
    }

    if (hasSubmenu && !focusFirstItem && isParentButton) {
      if (!instantNavigate) {
        event.preventDefault();
        setMenuGroupExpanded(menuGroup, false);
        return;
      }
    }

    if (!targetId) {
      return;
    }

    event.preventDefault();
    showSection(targetId);

    if (menuGroup && shouldUseHoverNavigation()) {
      requestAnimation(() => {
        button.blur();
        setMenuGroupExpanded(menuGroup, false);
      });
    }
  }

  function handlePopState(event) {
    if (!windowRef) {
      return;
    }
    const stateSection = typeof event.state?.section === 'string' ? event.state.section : null;
    let targetSectionId = stateSection || null;

    if (!targetSectionId) {
      const resolvedFromPath = getSectionIdFromPath(windowRef.location.pathname);
      targetSectionId = resolvedFromPath || 'section-dashboard';
      if (!resolvedFromPath) {
        setShouldReplaceHistory(true);
      }
    }

    if (!state.token) {
      state.activeSection = targetSectionId;
      const expectedPath = buildPathFromSection(targetSectionId);
      const normalizedExpected = normalizeHistoryPath(expectedPath);
      const normalizedCurrent = normalizeHistoryPath(windowRef.location.pathname || '/');
      if (normalizedExpected !== normalizedCurrent) {
        setShouldReplaceHistory(true);
      }
      return;
    }

    if (!documentRef.getElementById(targetSectionId)) {
      setShouldReplaceHistory(true);
      showSection('section-dashboard', { replace: true });
      return;
    }

    if (targetSectionId === state.activeSection) {
      const expectedPath = buildPathFromSection(state.activeSection);
      const normalizedExpected = normalizeHistoryPath(expectedPath);
      const normalizedCurrent = normalizeHistoryPath(windowRef.location.pathname || '/');
      if (normalizedExpected !== normalizedCurrent) {
        showSection(targetSectionId, { replace: true });
      }
      return;
    }

    showSection(targetSectionId, { replace: true });
  }

  const cleanupCallbacks = [];

  if (appMenu) {
    appMenu.addEventListener('click', handleMenuClick);
    cleanupCallbacks.push(() => appMenu.removeEventListener('click', handleMenuClick));
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', (event) => {
      event.preventDefault();
      toggleMobileMenu();
    });
  }

  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.addEventListener('click', () => {
      closeMobileMenu({ restoreFocus: true });
    });
  }

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', () => {
      closeMobileMenu({ restoreFocus: true });
    });
  }

  if (desktopMediaQuery?.addEventListener) {
    desktopMediaQuery.addEventListener('change', handleDesktopMediaChange);
    cleanupCallbacks.push(() => desktopMediaQuery.removeEventListener('change', handleDesktopMediaChange));
  } else if (desktopMediaQuery?.addListener) {
    desktopMediaQuery.addListener(handleDesktopMediaChange);
    cleanupCallbacks.push(() => desktopMediaQuery.removeListener(handleDesktopMediaChange));
  }

  if (desktopMediaQuery) {
    handleDesktopMediaChange(desktopMediaQuery);
  }

  if (hoverMediaQuery?.addEventListener) {
    hoverMediaQuery.addEventListener('change', handleHoverMediaChange);
    cleanupCallbacks.push(() => hoverMediaQuery.removeEventListener('change', handleHoverMediaChange));
  } else if (hoverMediaQuery?.addListener) {
    hoverMediaQuery.addListener(handleHoverMediaChange);
    cleanupCallbacks.push(() => hoverMediaQuery.removeListener(handleHoverMediaChange));
  }

  if (hoverMediaQuery) {
    handleHoverMediaChange();
  }

  if (documentRef) {
    documentRef.addEventListener('click', handleOutsideMenuClick);
    cleanupCallbacks.push(() => documentRef.removeEventListener('click', handleOutsideMenuClick));
  }

  if (windowRef) {
    windowRef.addEventListener('popstate', handlePopState);
    cleanupCallbacks.push(() => windowRef.removeEventListener('popstate', handlePopState));
  }

  function destroy() {
    cleanupCallbacks.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        // Ignore cleanup errors.
      }
    });
    cleanupCallbacks.length = 0;
  }

  return {
    showSection,
    updateAuthUI,
    updateMatchesMenuBadge,
    closeMobileMenu,
    isMobileMenuOpen,
    updateHandlers,
    destroy,
    setActiveMenu,
    updateAdminMenuVisibility,
    updateCourtManagerMenuVisibility,
    applyCourtManagerMenuRestrictions,
  };
}
