import { createDomUtils } from '../utils/dom.js';

export function createModalManager({
  globalMessage,
  modalOverlay,
  modalBody,
  modalTitle,
  modalClose,
  isMobileMenuOpen = () => false,
  closeMobileMenu = () => {},
  documentRef = typeof document !== 'undefined' ? document : null,
} = {}) {
  const {
    setStatusMessage,
    showGlobalMessage,
    openModal,
    closeModal,
    openConfirmationDialog,
    applyRichTextCommand,
  } = createDomUtils({ globalMessage, modalOverlay, modalBody, modalTitle });

  const handleCloseClick = () => {
    closeModal();
  };

  const handleOverlayClick = (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  };

  const handleKeydown = (event) => {
    if (event.key !== 'Escape') {
      return;
    }

    let handled = false;

    if (modalOverlay && !modalOverlay.hidden) {
      closeModal();
      handled = true;
    }

    if (typeof isMobileMenuOpen === 'function' && isMobileMenuOpen()) {
      if (typeof closeMobileMenu === 'function') {
        closeMobileMenu({ restoreFocus: true });
      }
      handled = true;
    }

    if (handled) {
      event.preventDefault();
    }
  };

  if (modalClose) {
    modalClose.addEventListener('click', handleCloseClick);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', handleOverlayClick);
  }

  if (documentRef) {
    documentRef.addEventListener('keydown', handleKeydown);
  }

  function destroy() {
    if (modalClose) {
      modalClose.removeEventListener('click', handleCloseClick);
    }
    if (modalOverlay) {
      modalOverlay.removeEventListener('click', handleOverlayClick);
    }
    if (documentRef) {
      documentRef.removeEventListener('keydown', handleKeydown);
    }
  }

  return {
    setStatusMessage,
    showGlobalMessage,
    openModal,
    closeModal,
    openConfirmationDialog,
    applyRichTextCommand,
    destroy,
  };
}
