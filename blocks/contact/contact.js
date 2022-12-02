import { fetchPlaceholders, createEl } from '../../scripts/lib.js';

import { getCurrentStore } from '../../scripts/scripts.js';

/**
 * loads and decorates the contact
 * @param {Element} block The contact block element
 */
export default async function decorate(block) {
  const ph = await fetchPlaceholders();
  block.textContent = '';

  block.classList.add('default-content-wrapper');
  const heading = createEl('h2', {
    id: 'contact-us',
    text: 'contact us',
  });
  block.append(heading);
  const text = ph.contact.split('\n');
  text.forEach((line) => {
    if (line.includes('{{phone}}')) {
      const phone = ph[`${getCurrentStore()}Phone`];
      const a = createEl('a', {
        href: `tel:${phone.replace(/[^0-9]/gi, '')}`,
        text: phone,
      });
      // eslint-disable-next-line no-param-reassign
      line = line.replace('{{phone}}', a.outerHTML);
    }
    if (line.includes('{{email}}')) {
      const a = createEl('a', {
        href: `mailto:${ph.email}`,
        text: ph.email,
      });
      // eslint-disable-next-line no-param-reassign
      line = line.replace('{{email}}', a.outerHTML);
    }
    const p = createEl('p', {
      html: line,
    });
    block.append(p);
  });
}
