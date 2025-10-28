export function createChatMessagesModule({
  sanitizeNoticeHtml,
  normalizeId,
  formatRoles,
  formatChatTimestamp,
  getCurrentUserId,
} = {}) {
  if (
    typeof sanitizeNoticeHtml !== 'function' ||
    typeof normalizeId !== 'function' ||
    typeof formatRoles !== 'function' ||
    typeof formatChatTimestamp !== 'function' ||
    typeof getCurrentUserId !== 'function'
  ) {
    throw new Error('Missing required dependencies for chat messages module.');
  }

  function renderChatMessages(messages = [], container, emptyMessage) {
    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (!Array.isArray(messages) || !messages.length) {
      if (emptyMessage) {
        container.innerHTML = `<li class="empty-state">${emptyMessage}</li>`;
      }
      return;
    }

    const currentUserId = getCurrentUserId();

    messages.forEach((message) => {
      if (!message) {
        return;
      }

      const item = document.createElement('li');
      item.className = 'chat-message';

      const senderId = normalizeId(message.sender);
      if (senderId && senderId === currentUserId) {
        item.classList.add('mine');
      }

      const header = document.createElement('div');
      header.className = 'chat-message-header';

      const name = document.createElement('strong');
      name.textContent = message.sender?.fullName || message.sender?.email || 'Participante';
      header.appendChild(name);

      const senderRoles = message.sender?.roles || message.sender?.role;
      if (senderRoles) {
        const role = document.createElement('span');
        role.className = 'tag';
        role.textContent = formatRoles(senderRoles);
        header.appendChild(role);
      }

      const timestamp = document.createElement('time');
      timestamp.dateTime = message.createdAt || '';
      timestamp.textContent = formatChatTimestamp(message.createdAt);
      header.appendChild(timestamp);

      const body = document.createElement('div');
      const sanitizedRich = sanitizeNoticeHtml(message.richContent || '');
      const plainContent = (message.content || '').trim();

      if (sanitizedRich) {
        const richContainer = document.createElement('div');
        richContainer.className = 'chat-message-rich';
        richContainer.innerHTML = sanitizedRich;
        body.appendChild(richContainer);
      } else if (plainContent) {
        const paragraph = document.createElement('p');
        paragraph.textContent = plainContent;
        body.appendChild(paragraph);
      }

      if (Array.isArray(message.attachments) && message.attachments.length) {
        const attachmentsWrapper = document.createElement('div');
        attachmentsWrapper.className = 'chat-message-attachments';

        message.attachments.forEach((attachment) => {
          if (!attachment) {
            return;
          }

          const attachmentBlock = document.createElement('div');
          attachmentBlock.className = 'chat-message-attachment';

          const source = attachment.dataUrl || attachment.url;
          const filename = attachment.filename || attachment.description || 'Adjunto';
          const attachmentType = (attachment.type || '').toLowerCase();
          const isImage =
            attachmentType === 'image' || (attachment.contentType || '').toLowerCase().startsWith('image/');

          if (isImage && source) {
            const img = document.createElement('img');
            img.src = source;
            img.alt = filename;
            attachmentBlock.appendChild(img);
          }

          if (source) {
            const link = document.createElement('a');
            link.href = source;
            link.textContent = filename;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            if (attachment.filename) {
              link.download = attachment.filename;
            }
            attachmentBlock.appendChild(link);
          } else if (!attachmentBlock.childElementCount) {
            const label = document.createElement('span');
            label.textContent = filename;
            attachmentBlock.appendChild(label);
          }

          attachmentsWrapper.appendChild(attachmentBlock);
        });

        if (attachmentsWrapper.childElementCount) {
          body.appendChild(attachmentsWrapper);
        }
      }

      item.appendChild(header);
      if (body.childElementCount) {
        item.appendChild(body);
      }

      container.appendChild(item);
    });
  }

  return { renderChatMessages };
}
