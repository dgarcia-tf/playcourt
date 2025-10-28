import { NOTICE_INLINE_IMAGE_DATA_URL_PATTERN } from '../config/constants.js';

export const NOTICE_ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
export const NOTICE_ALLOWED_IMAGE_SCHEMES = new Set(['http:', 'https:']);
export const NOTICE_ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'OL',
  'UL',
  'LI',
  'BLOCKQUOTE',
  'A',
  'H1',
  'H2',
  'H3',
  'H4',
  'IMG',
]);

export function sanitizeNoticeHtml(html) {
  if (typeof html !== 'string' || !html.trim()) {
    return '';
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  const cleanNode = (node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === 'SPAN') {
          const style = child.getAttribute('style') || '';
          if (/text-decoration\s*:\s*underline/i.test(style)) {
            const underline = document.createElement('u');
            while (child.firstChild) {
              underline.appendChild(child.firstChild);
            }
            child.replaceWith(underline);
            cleanNode(underline);
            continue;
          }
        }

        if (!NOTICE_ALLOWED_TAGS.has(child.tagName)) {
          const fragment = document.createDocumentFragment();
          while (child.firstChild) {
            fragment.appendChild(child.firstChild);
          }
          child.replaceWith(fragment);
          cleanNode(fragment);
          continue;
        }

        if (child.tagName === 'IMG') {
          const attributes = Array.from(child.attributes);
          let hasValidSource = false;
          for (const attribute of attributes) {
            const name = attribute.name.toLowerCase();
            if (name === 'src') {
              const value = attribute.value.trim();
              if (NOTICE_INLINE_IMAGE_DATA_URL_PATTERN.test(value)) {
                child.setAttribute('src', value);
                hasValidSource = true;
              } else if (value) {
                try {
                  const url = new URL(value, window.location.origin);
                  if (NOTICE_ALLOWED_IMAGE_SCHEMES.has(url.protocol)) {
                    child.setAttribute('src', url.toString());
                    hasValidSource = true;
                  } else {
                    child.removeAttribute(attribute.name);
                  }
                } catch (error) {
                  child.removeAttribute(attribute.name);
                }
              } else {
                child.removeAttribute(attribute.name);
              }
              continue;
            }
            if (name === 'alt') {
              const altText = attribute.value.trim().slice(0, 240);
              child.setAttribute('alt', altText);
              continue;
            }
            child.removeAttribute(attribute.name);
          }
          if (!hasValidSource) {
            child.remove();
            continue;
          }
          if (!child.hasAttribute('alt')) {
            child.setAttribute('alt', '');
          }
          continue;
        }

        const attributes = Array.from(child.attributes);
        for (const attribute of attributes) {
          const name = attribute.name.toLowerCase();
          if (child.tagName === 'A') {
            if (name === 'href') {
              let href = attribute.value.trim();
              if (href && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) {
                href = `https://${href}`;
              }
              try {
                const url = new URL(href);
                if (!NOTICE_ALLOWED_SCHEMES.has(url.protocol)) {
                  child.removeAttribute(attribute.name);
                  continue;
                }
                child.setAttribute('href', url.toString());
                child.setAttribute('rel', 'noopener noreferrer');
                child.setAttribute('target', '_blank');
              } catch (error) {
                child.removeAttribute(attribute.name);
              }
              continue;
            }
            if (name === 'title') {
              continue;
            }
            if (name === 'rel') {
              child.setAttribute('rel', 'noopener noreferrer');
              continue;
            }
            if (name === 'target') {
              child.setAttribute('target', '_blank');
              continue;
            }
          }
          child.removeAttribute(attribute.name);
        }

        cleanNode(child);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      } else if (child.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        cleanNode(child);
      }
    }
  };

  cleanNode(template.content);
  return template.innerHTML.trim();
}
