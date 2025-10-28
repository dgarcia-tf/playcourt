import { CATEGORY_COLOR_PALETTE, MAX_PHOTO_SIZE } from '../config/constants.js';
import { hexToRgba, resolveCategoryColor } from './format.js';
import { NOTICE_ALLOWED_SCHEMES } from './sanitize.js';

export function createDomUtils({ globalMessage, modalOverlay, modalBody, modalTitle } = {}) {
  let activeModalCleanup = null;

  function setStatusMessage(element, type, message) {
    if (!element) return;
    element.textContent = message || '';
    element.className = 'status-message';
    if (!message) {
      element.style.display = 'none';
      return;
    }
    if (type) {
      element.classList.add(type);
    }
    element.style.display = 'block';
  }

  function closeModal() {
    if (!modalOverlay || !modalBody) return;
    if (activeModalCleanup) {
      try {
        activeModalCleanup();
      } catch (error) {
        console.warn('Error al ejecutar la limpieza del modal', error);
      }
      activeModalCleanup = null;
    }
    modalOverlay.classList.remove('open');
    modalOverlay.hidden = true;
    modalBody.innerHTML = '';
    if (modalTitle) {
      modalTitle.textContent = '';
    }
  }

  function openModal({ title, content, onClose } = {}) {
    if (!modalOverlay || !modalBody) return;
    if (modalTitle) {
      modalTitle.textContent = title || '';
    }
    modalBody.innerHTML = '';
    if (typeof content === 'function') {
      content(modalBody);
    } else if (content instanceof Node) {
      modalBody.appendChild(content);
    }
    activeModalCleanup = typeof onClose === 'function' ? onClose : null;
    modalOverlay.hidden = false;
    requestAnimationFrame(() => {
      modalOverlay.classList.add('open');
    });
  }

  function openConfirmationDialog({
    title = 'Confirmación',
    message = '',
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
  } = {}) {
    return new Promise((resolve) => {
      let settled = false;
      const settle = (value) => {
        if (!settled) {
          settled = true;
          resolve(Boolean(value));
        }
      };

      const container = document.createElement('div');
      container.className = 'confirmation-dialog';

      const text = document.createElement('p');
      text.className = 'confirmation-dialog__message';
      text.textContent = message;
      container.appendChild(text);

      const actions = document.createElement('div');
      actions.className = 'form-actions';

      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.className = 'ghost';
      cancelButton.textContent = cancelLabel;
      cancelButton.addEventListener('click', () => {
        settle(false);
        closeModal();
      });

      const confirmButton = document.createElement('button');
      confirmButton.type = 'button';
      confirmButton.className = 'primary';
      confirmButton.textContent = confirmLabel;
      confirmButton.addEventListener('click', () => {
        settle(true);
        closeModal();
      });

      actions.appendChild(cancelButton);
      actions.appendChild(confirmButton);
      container.appendChild(actions);

      openModal({
        title,
        content: container,
        onClose: () => {
          settle(false);
        },
      });
    });
  }

  function showGlobalMessage(message = '', type = 'info') {
    if (!globalMessage) {
      return;
    }
    globalMessage.textContent = message;
    globalMessage.classList.remove('show', 'error');
    if (!message) {
      return;
    }
    if (type === 'error') {
      globalMessage.classList.add('error');
    }
    globalMessage.classList.add('show');
  }

  function applyRichTextCommand(editor, command, { level, list, onAttachment, onImage } = {}) {
    if (!editor || !command) {
      return;
    }

    editor.focus();

    switch (command) {
      case 'bold':
      case 'italic':
      case 'underline':
        document.execCommand(command);
        break;
      case 'heading': {
        const headingLevel = level || '2';
        document.execCommand('formatBlock', false, `H${headingLevel}`);
        break;
      }
      case 'list':
        if (list === 'ordered') {
          document.execCommand('insertOrderedList');
        } else {
          document.execCommand('insertUnorderedList');
        }
        break;
      case 'quote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      case 'link': {
        const url = window.prompt('Introduce la URL del enlace (incluye https://)');
        if (!url) {
          break;
        }
        let sanitizedUrl = url.trim();
        if (sanitizedUrl && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(sanitizedUrl)) {
          sanitizedUrl = `https://${sanitizedUrl}`;
        }
        try {
          const parsed = new URL(sanitizedUrl);
          if (!NOTICE_ALLOWED_SCHEMES.has(parsed.protocol)) {
            showGlobalMessage(
              'Introduce un enlace con un protocolo permitido (http, https, mailto o tel).',
              'error',
            );
            break;
          }
          document.execCommand('createLink', false, parsed.toString());
        } catch (error) {
          showGlobalMessage('No se pudo crear el enlace. Revisa la URL e inténtalo de nuevo.', 'error');
        }
        break;
      }
      case 'clear':
        document.execCommand('removeFormat');
        document.execCommand('formatBlock', false, 'p');
        break;
      case 'attachment':
        if (typeof onAttachment === 'function') {
          onAttachment();
        }
        break;
      case 'image':
        if (typeof onImage === 'function') {
          onImage();
        }
        break;
      default:
        break;
    }
  }

  return {
    setStatusMessage,
    showGlobalMessage,
    openModal,
    closeModal,
    openConfirmationDialog,
    applyRichTextCommand,
  };
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    reader.readAsDataURL(file);
  });
}

export async function extractPhotoFromForm(form, fieldName = 'photo') {
  if (!form?.elements?.[fieldName]) return undefined;
  const input = form.elements[fieldName];
  const file = input.files?.[0];
  if (!file) return undefined;
  if (!file.type.startsWith('image/')) {
    throw new Error('La fotografía debe ser una imagen válida.');
  }
  if (file.size > MAX_PHOTO_SIZE) {
    throw new Error('La fotografía no puede superar los 2 MB.');
  }

  return readFileAsDataUrl(file);
}

export function applyCategoryColorStyles(
  element,
  color,
  { backgroundAlpha = 0.12, borderAlpha = 0.28, shadowAlpha } = {},
) {
  if (!element) return;
  const normalized = resolveCategoryColor(color);

  const background = hexToRgba(normalized, backgroundAlpha);
  const border = hexToRgba(normalized, borderAlpha);

  if (background) {
    element.style.backgroundColor = background;
  }
  if (border) {
    element.style.borderColor = border;
  }
  element.style.setProperty('--category-color', normalized);
  if (typeof shadowAlpha === 'number') {
    const shadow = hexToRgba(normalized, shadowAlpha);
    element.style.boxShadow = `0 10px 22px ${shadow}`;
  }

  element.classList.add('category-colored');
}

export function applyCategoryTagColor(tag, color, { backgroundAlpha = 0.18 } = {}) {
  if (!tag) return;
  const normalized = resolveCategoryColor(color);

  const background = hexToRgba(normalized, backgroundAlpha);
  if (background) {
    tag.style.backgroundColor = background;
  }
  tag.style.color = normalized;
}

export function createCategoryColorIndicator(color, label = '') {
  const normalized = resolveCategoryColor(color);
  if (!normalized) return null;

  const indicator = document.createElement('span');
  indicator.className = 'category-color-indicator';
  indicator.style.setProperty('--category-color', normalized);
  indicator.setAttribute('aria-hidden', 'true');
  if (label) {
    indicator.title = `Color de ${label}`;
  } else {
    indicator.title = `Color ${normalized}`;
  }
  return indicator;
}

export function renderCategoryColorField({
  name = 'color',
  legend = 'Color identificativo',
  hint = '',
  selected,
} = {}) {
  const activeColor = resolveCategoryColor(selected);
  const options = CATEGORY_COLOR_PALETTE.map((color) => {
    const checked = color === activeColor ? 'checked' : '';
    return `
      <label class="color-select-option">
        <input type="radio" name="${name}" value="${color}" ${checked} />
        <span class="color-swatch" style="--option-color: ${color}" aria-hidden="true"></span>
        <span class="color-select-label">${color}</span>
      </label>
    `;
  }).join('');

  return `
    <fieldset class="color-select">
      <legend>${legend}</legend>
      <div class="color-select-options">
        ${options}
      </div>
      ${hint ? `<span class="form-hint">${hint}</span>` : ''}
    </fieldset>
  `;
}
