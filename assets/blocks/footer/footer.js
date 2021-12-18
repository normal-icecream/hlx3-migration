import {
  createEl,
} from '../../scripts/scripts.js';

async function fetchFooterContent(url) {
  const resp = await fetch(`${url}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();
    const placeholder = createEl('div', { html });
    return placeholder;
  }
  const year = new Date().getFullYear();
  const fallback = createEl('div', {
    html: `
    <div>
      <p>
        © normal® ice cream, inc. ${year} |
        all rights reserved | 
        slc, ut
      </p>
    </div>`,
  });
  return fallback;
}

export default async function decorateFooter(block) {
  const url = block.getAttribute('data-source');
  const content = await fetchFooterContent(url);
  block.append(content);
}
