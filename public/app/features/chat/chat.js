import { createChatMessagesModule } from './messages.js';

export function createChatModule({
  state,
  noticeLastSeenPrefix,
  noticesMenuBadge,
  generalChatMessagesList,
  generalChatForm,
  generalChatInput,
  generalChatToolbar,
  generalChatEditor,
  generalChatAttachmentInput,
  generalChatImageInput,
  generalChatAttachments,
  generalChatAttachmentsList,
  request,
  sanitizeNoticeHtml,
  readFileAsDataUrl,
  showGlobalMessage,
  applyRichTextCommand,
  isAdmin,
  normalizeId,
  formatRoles,
  formatChatTimestamp,
  NOTICE_INLINE_IMAGE_DATA_URL_PATTERN,
  NOTICE_INLINE_IMAGE_SRC_REGEX,
  MAX_INLINE_NOTICE_IMAGE_SIZE,
  MAX_TOTAL_INLINE_NOTICE_IMAGE_SIZE,
  MAX_NOTICE_RICH_CONTENT_LENGTH,
  MAX_NOTICE_RICH_CONTENT_WITH_IMAGES,
  MAX_NOTICE_ATTACHMENTS,
  MAX_NOTICE_ATTACHMENT_SIZE,
} = {}) {
  if (!state || typeof request !== 'function') {
    throw new Error('Missing required chat dependencies.');
  }
  if (typeof sanitizeNoticeHtml !== 'function') {
    throw new Error('Missing sanitizeNoticeHtml dependency.');
  }
  if (typeof normalizeId !== 'function' || typeof formatRoles !== 'function') {
    throw new Error('Missing identity helpers for chat module.');
  }
  if (typeof formatChatTimestamp !== 'function') {
    throw new Error('Missing chat timestamp formatter.');
  }
  if (typeof readFileAsDataUrl !== 'function') {
    throw new Error('Missing file reader helper.');
  }
  if (typeof showGlobalMessage !== 'function') {
    throw new Error('Missing notification helper.');
  }
  if (typeof applyRichTextCommand !== 'function') {
    throw new Error('Missing rich text command handler.');
  }
  if (typeof isAdmin !== 'function') {
    throw new Error('Missing permission checker.');
  }
  if (!noticeLastSeenPrefix) {
    throw new Error('Missing notice storage prefix.');
  }
  if (!NOTICE_INLINE_IMAGE_DATA_URL_PATTERN || !NOTICE_INLINE_IMAGE_SRC_REGEX) {
    throw new Error('Missing inline image patterns.');
  }

  const { renderChatMessages } = createChatMessagesModule({
    sanitizeNoticeHtml,
    normalizeId,
    formatRoles,
    formatChatTimestamp,
    getCurrentUserId: () => normalizeId(state.user),
  });

  let noticeDraftAttachments = [];

  function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return '';
    }
    if (bytes >= 1024 * 1024) {
      const value = (bytes / (1024 * 1024)).toFixed(1);
      const normalized = value.endsWith('.0') ? value.slice(0, -2) : value;
      return `${normalized} MB`;
    }
    if (bytes >= 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${bytes} B`;
  }

  function extractPlainTextFromHtml(html) {
    if (typeof html !== 'string' || !html) {
      return '';
    }
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.textContent?.trim() || '';
  }

  function estimateDataUrlPayloadSize(dataUrl) {
    if (typeof dataUrl !== 'string') {
      return 0;
    }
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1) {
      return 0;
    }
    const base64 = dataUrl.slice(commaIndex + 1).replace(/\s+/g, '');
    if (!base64) {
      return 0;
    }
    return Math.floor((base64.length * 3) / 4);
  }

  function extractInlineImageSources(html) {
    if (typeof html !== 'string' || !html) {
      return [];
    }
    const sources = [];
    NOTICE_INLINE_IMAGE_SRC_REGEX.lastIndex = 0;
    let match;
    while ((match = NOTICE_INLINE_IMAGE_SRC_REGEX.exec(html))) {
      if (match[1]) {
        sources.push(match[1]);
      }
    }
    NOTICE_INLINE_IMAGE_SRC_REGEX.lastIndex = 0;
    return sources;
  }

  function deriveAltTextFromFilename(filename) {
    if (typeof filename !== 'string') {
      return '';
    }
    const withoutExtension = filename.replace(/\.[^/.]+$/, '');
    return withoutExtension.replace(/[-_]+/g, ' ').trim();
  }

  function updateNoticesMenuBadge(count = 0) {
    if (!noticesMenuBadge) return;
    noticesMenuBadge.textContent = String(count);
    noticesMenuBadge.hidden = count <= 0;
  }

  function getNoticeStorageKey(userId) {
    if (!userId) return null;
    return `${noticeLastSeenPrefix}${userId}`;
  }

  function readNoticeLastSeen(userId) {
    const key = getNoticeStorageKey(userId);
    if (!key) return 0;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return 0;
      const numeric = Number(raw);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
      const parsed = Date.parse(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch (error) {
      console.warn('No se pudo leer la última visita al panel de avisos', error);
      return 0;
    }
  }

  function writeNoticeLastSeen(userId, timestamp) {
    const key = getNoticeStorageKey(userId);
    if (!key) return;
    const value = Number(timestamp);
    if (!Number.isFinite(value) || value <= 0) return;
    try {
      localStorage.setItem(key, String(Math.floor(value)));
    } catch (error) {
      console.warn('No se pudo guardar la última visita al panel de avisos', error);
    }
  }

  function syncNoticeBoardState(messages = state.generalChatMessages) {
    const currentUserId = normalizeId(state.user);
    if (!currentUserId) {
      state.noticeUnreadCount = 0;
      updateNoticesMenuBadge(0);
      return;
    }

    const list = Array.isArray(messages) ? messages : [];
    const lastSeen = readNoticeLastSeen(currentUserId);
    let latestTimestamp = lastSeen;
    let unread = 0;

    list.forEach((message) => {
      const timestamp = Date.parse(message?.createdAt);
      if (!Number.isFinite(timestamp)) {
        return;
      }
      if (timestamp > latestTimestamp) {
        latestTimestamp = timestamp;
      }
      const senderId = normalizeId(message?.sender);
      if (senderId && senderId === currentUserId) {
        return;
      }
      if (!lastSeen || timestamp > lastSeen) {
        unread += 1;
      }
    });

    if (state.activeSection === 'section-chat') {
      if (latestTimestamp > 0) {
        writeNoticeLastSeen(currentUserId, latestTimestamp);
      }
      unread = 0;
    }

    state.noticeUnreadCount = unread;
    updateNoticesMenuBadge(unread);
  }

  function renderGeneralChat() {
    renderChatMessages(
      Array.isArray(state.generalChatMessages) ? state.generalChatMessages : [],
      generalChatMessagesList,
      'Todavía no hay avisos publicados.'
    );
  }

  function insertImageIntoNoticeEditor(source, { alt } = {}) {
    if (!generalChatEditor || !source) {
      return;
    }

    generalChatEditor.focus();
    const selection = window.getSelection();
    const image = document.createElement('img');
    image.src = source;
    image.alt = alt || '';

    let range = selection && selection.rangeCount ? selection.getRangeAt(0) : null;
    if (!range || !generalChatEditor.contains(range.commonAncestorContainer)) {
      generalChatEditor.appendChild(image);
    } else {
      range.deleteContents();
      range.insertNode(image);
    }

    const spacer = document.createElement('p');
    spacer.appendChild(document.createElement('br'));
    image.insertAdjacentElement('afterend', spacer);

    if (selection) {
      selection.removeAllRanges();
      range = document.createRange();
      range.setStart(spacer, 0);
      range.collapse(true);
      selection.addRange(range);
    }
  }

  function renderNoticeAttachmentsDraft() {
    if (!generalChatAttachments || !generalChatAttachmentsList) {
      return;
    }
    generalChatAttachmentsList.innerHTML = '';
    if (!noticeDraftAttachments.length) {
      generalChatAttachments.hidden = true;
      return;
    }

    generalChatAttachments.hidden = false;
    noticeDraftAttachments.forEach((attachment) => {
      const item = document.createElement('li');
      item.className = 'chat-attachment';
      item.dataset.attachmentId = attachment.id;

      if (attachment.type === 'image' && attachment.dataUrl) {
        const preview = document.createElement('img');
        preview.className = 'chat-attachment-preview';
        preview.src = attachment.dataUrl;
        preview.alt = attachment.name || 'Imagen adjunta';
        item.appendChild(preview);
      }

      const info = document.createElement('div');
      info.className = 'chat-attachment-info';

      const title = document.createElement('p');
      title.className = 'chat-attachment-name';
      title.textContent = attachment.name || 'Adjunto';
      info.appendChild(title);

      const meta = document.createElement('p');
      meta.className = 'chat-attachment-meta';
      meta.textContent = [attachment.contentType, formatFileSize(attachment.size)]
        .filter(Boolean)
        .join(' · ');
      info.appendChild(meta);

      item.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'chat-attachment-actions';
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'chat-attachment-remove';
      removeButton.dataset.attachmentRemove = attachment.id;
      removeButton.textContent = 'Eliminar';
      actions.appendChild(removeButton);
      item.appendChild(actions);

      generalChatAttachmentsList.appendChild(item);
    });
  }

  function setNoticeFormBusy(isBusy) {
    if (generalChatToolbar) {
      generalChatToolbar.querySelectorAll('button').forEach((button) => {
        button.disabled = isBusy;
      });
    }
    if (generalChatEditor) {
      generalChatEditor.setAttribute('contenteditable', isBusy ? 'false' : 'true');
      if (!isBusy) {
        generalChatEditor.focus();
      }
    }
    if (generalChatAttachmentInput) {
      generalChatAttachmentInput.disabled = isBusy;
    }
    if (generalChatImageInput) {
      generalChatImageInput.disabled = isBusy;
    }
    const submitButton = generalChatForm?.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = isBusy;
    }
  }

  function resetNoticeComposer() {
    if (generalChatEditor) {
      generalChatEditor.innerHTML = '';
    }
    if (generalChatInput) {
      generalChatInput.value = '';
    }
    if (generalChatAttachmentInput) {
      generalChatAttachmentInput.value = '';
    }
    if (generalChatImageInput) {
      generalChatImageInput.value = '';
    }
    noticeDraftAttachments = [];
    renderNoticeAttachmentsDraft();
  }

  function handleNoticeToolbarClick(event) {
    const button = event.target.closest('button[data-command]');
    if (!button || button.disabled) {
      return;
    }
    const command = button.dataset.command;
    if (!command) {
      return;
    }
    if (!generalChatEditor) {
      return;
    }

    event.preventDefault();
    applyRichTextCommand(generalChatEditor, command, {
      level: button.dataset.level,
      list: button.dataset.list,
      onAttachment: () => generalChatAttachmentInput?.click(),
      onImage: () => generalChatImageInput?.click(),
    });
  }

  function removeNoticeAttachment(attachmentId) {
    if (!attachmentId) return;
    noticeDraftAttachments = noticeDraftAttachments.filter((item) => item.id !== attachmentId);
    renderNoticeAttachmentsDraft();
  }

  async function handleNoticeAttachmentChange(event) {
    const input = event.target;
    const fileList = Array.from(input.files || []);
    input.value = '';

    if (!fileList.length) {
      return;
    }

    const availableSlots = MAX_NOTICE_ATTACHMENTS - noticeDraftAttachments.length;
    if (availableSlots <= 0) {
      showGlobalMessage('Has alcanzado el número máximo de adjuntos por aviso (5).', 'error');
      return;
    }

    const selectedFiles = fileList.slice(0, availableSlots);
    const newAttachments = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_NOTICE_ATTACHMENT_SIZE) {
        showGlobalMessage(
          `El archivo "${file.name}" supera el tamaño máximo permitido (3 MB).`,
          'error'
        );
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        newAttachments.push({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          size: file.size,
          contentType: file.type,
          dataUrl,
          type: file.type && file.type.toLowerCase().startsWith('image/') ? 'image' : 'file',
        });
      } catch (error) {
        showGlobalMessage(error.message, 'error');
      }
    }

    if (newAttachments.length) {
      noticeDraftAttachments = noticeDraftAttachments
        .concat(newAttachments)
        .slice(0, MAX_NOTICE_ATTACHMENTS);
      renderNoticeAttachmentsDraft();
    }
  }

  async function handleNoticeImageSelection(event) {
    const input = event.target;
    const [file] = Array.from(input.files || []);
    input.value = '';

    if (!file) {
      return;
    }

    const mime = (file.type || '').toLowerCase();
    const isImageFile = mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name || '');
    if (!isImageFile) {
      showGlobalMessage('Selecciona un archivo de imagen válido.', 'error');
      return;
    }

    if (file.size > MAX_INLINE_NOTICE_IMAGE_SIZE) {
      showGlobalMessage(
        `La imagen supera el tamaño máximo permitido (${formatFileSize(MAX_INLINE_NOTICE_IMAGE_SIZE)}).`,
        'error'
      );
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      insertImageIntoNoticeEditor(dataUrl, { alt: deriveAltTextFromFilename(file.name) });
    } catch (error) {
      showGlobalMessage(error.message, 'error');
    }
  }

  async function loadGeneralChat() {
    try {
      const messages = await request('/chat/general');
      state.generalChatMessages = Array.isArray(messages) ? messages : [];
      syncNoticeBoardState(state.generalChatMessages);
      renderGeneralChat();
    } catch (error) {
      state.generalChatMessages = [];
      syncNoticeBoardState(state.generalChatMessages);
      renderGeneralChat();
    }
  }

  async function loadChatParticipants() {}

  async function loadDirectChat() {}

  function updateDirectChatFormState() {}

  async function handleNoticeSubmit(event) {
    event.preventDefault();
    if (!isAdmin()) return;

    const rawHtml = generalChatEditor ? generalChatEditor.innerHTML : '';
    const sanitizedRich = sanitizeNoticeHtml(rawHtml);
    const plainText = extractPlainTextFromHtml(sanitizedRich);
    const inlineImageSources = extractInlineImageSources(sanitizedRich);

    let inlineImagesTotalSize = 0;
    for (const source of inlineImageSources) {
      if (!NOTICE_INLINE_IMAGE_DATA_URL_PATTERN.test(source)) {
        continue;
      }
      const estimatedSize = estimateDataUrlPayloadSize(source);
      if (estimatedSize > MAX_INLINE_NOTICE_IMAGE_SIZE) {
        showGlobalMessage(
          `Cada imagen insertada debe pesar menos de ${formatFileSize(MAX_INLINE_NOTICE_IMAGE_SIZE)}.`,
          'error'
        );
        return;
      }
      inlineImagesTotalSize += estimatedSize;
      if (inlineImagesTotalSize > MAX_TOTAL_INLINE_NOTICE_IMAGE_SIZE) {
        showGlobalMessage(
          `Las imágenes insertadas superan el peso máximo total permitido (${formatFileSize(
            MAX_TOTAL_INLINE_NOTICE_IMAGE_SIZE
          )}).`,
          'error'
        );
        return;
      }
    }

    if (!plainText && !sanitizedRich && !noticeDraftAttachments.length) {
      showGlobalMessage('Escribe un aviso o adjunta contenido antes de publicar.', 'error');
      return;
    }

    if (plainText.length > 2000) {
      showGlobalMessage('El aviso supera el límite de 2000 caracteres.', 'error');
      return;
    }

    if (!inlineImageSources.length && sanitizedRich.length > MAX_NOTICE_RICH_CONTENT_LENGTH) {
      showGlobalMessage(
        `El contenido enriquecido es demasiado largo (máximo ${MAX_NOTICE_RICH_CONTENT_LENGTH.toLocaleString('es-ES')} caracteres).`,
        'error'
      );
      return;
    }

    if (inlineImageSources.length && sanitizedRich.length > MAX_NOTICE_RICH_CONTENT_WITH_IMAGES) {
      showGlobalMessage(
        'El aviso supera el tamaño máximo permitido para contenido con imágenes. Reduce el peso de las imágenes e inténtalo de nuevo.',
        'error'
      );
      return;
    }

    if (generalChatInput) {
      generalChatInput.value = plainText;
    }

    const attachmentsPayload = noticeDraftAttachments.map((attachment) => ({
      filename: attachment.name,
      contentType: attachment.contentType,
      size: attachment.size,
      dataUrl: attachment.dataUrl,
      type: attachment.type,
    }));

    const payload = {
      content: plainText,
      richContent: sanitizedRich || undefined,
      attachments: attachmentsPayload,
    };

    setNoticeFormBusy(true);

    try {
      await request('/chat/general', { method: 'POST', body: payload });
      resetNoticeComposer();
      await loadGeneralChat();
    } catch (error) {
      showGlobalMessage(error.message, 'error');
    } finally {
      setNoticeFormBusy(false);
    }
  }

  return {
    renderGeneralChat,
    syncNoticeBoardState,
    updateNoticesMenuBadge,
    handleNoticeToolbarClick,
    handleNoticeAttachmentChange,
    handleNoticeImageSelection,
    removeNoticeAttachment,
    handleNoticeSubmit,
    loadGeneralChat,
    loadChatParticipants,
    loadDirectChat,
    updateDirectChatFormState,
  };
}
