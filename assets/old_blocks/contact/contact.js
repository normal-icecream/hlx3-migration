import {
  createEl,
  fetchLabels,
} from '../../scripts/scripts.js';

async function writeContactText() {
  const labels = await fetchLabels();
  let text = labels.contact;
  // phone
  let location = 'store';
  const paths = window.location.pathname.split('/').filter((i) => i);
  if (paths.indexOf('lab') > 0) {
    location = 'lab';
  }
  const phone = labels[`${location}_phone`];
  const phoneEl = createEl('a', {
    href: `tel:+${phone.replace(/\D/g, '')}`,
    text: phone,
  });
  text = text.replace('<phone>', phoneEl.outerHTML);
  // email
  const { email } = labels;
  const emailEl = createEl('a', {
    href: `mailto:${email}`,
    text: email,
  });
  text = text.replace('<email>', emailEl.outerHTML);

  const wrapper = createEl('div', {
    class: 'contact-body',
  });
  text.split('\n').forEach((line) => {
    const p = createEl('p', {
      html: line,
    });
    wrapper.append(p);
  });
  return wrapper;
}

export default async function decorateContact(block) {
  const body = await writeContactText();
  const title = createEl('h2', {
    class: 'contact-head',
    text: 'contact us',
  });
  body.prepend(title);
  block.append(body);
}
