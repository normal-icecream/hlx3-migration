import {
  readBlockConfig, toClassName, decorateIcons, createEl,
} from '../../scripts/lib.js';

/**
 * decorates the anchor
 * @param {Element} block The anchor block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  // apply config
  if (config.color) block.parentElement.classList.add(toClassName(`anchor-color-${config.color}`));
  if (config.position) block.parentElement.classList.add(toClassName(`anchor-position-${config.position}`));

  // validate anchor target
  let anchor;
  let target;
  if (config.anchor && config.anchor.startsWith('#')) { // anchor to id
    anchor = document.getElementById(toClassName(config.anchor.slice(1)));
  } else if (config.anchor && config.anchor.startsWith('.')) { // anchor to class
    anchor = document.querySelector(`.${toClassName(config.anchor.slice(1))}`);
  }
  if (anchor) {
    let parent = anchor;
    while (![...parent.classList].includes('block') && ![...parent.classList].includes('default-content-wrapper')) {
      parent = parent.parentElement;
    }
    target = parent;
  }

  if (anchor && target && (config.icon || config.logo)) {
    target.classList.add('anchor-target');

    // create icon
    const icon = createEl('span', {
      class: `icon icon-${toClassName(config.icon || config.logo)}`,
    });

    // create text
    let text;
    if (config.text) {
      text = createEl('p', {
        text: config.text,
      });
    }

    if (config.link) { // wrap in link
      const a = createEl('a', {
        href: config.link,
        'aria-label': config.text || `link to ${config.link}`,
      });
      a.append(icon);
      if (text) a.prepend(text);
      block.append(a);
    } else { // append to block
      block.append(icon);
      if (text) block.prepend(text);
    }

    decorateIcons(block);

    // place anchor in target content
    const section = target.closest('.section');
    if (section && (section !== block.parentElement.parentElement)) {
      block.parentElement.parentElement.classList.remove('anchor-container');
      section.classList.add('anchor-container');
    }
    const aside = createEl('aside', {
      class: block.parentElement.className,
    });
    aside.append(block);
    target.prepend(aside);
  }
}
