import {
  createEl,
  decorateIcons,
  readBlockConfig,
  toClassName,
} from '../../scripts/scripts.js';

/**
 * loads and decorates the footer
 * @param {Element} block The header block element
 */
export default function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  const targetType = config.anchor?.substring(0, 1);
  if (targetType) { // anchor must have anchor property to be valid
    // setup config fallbacks
    if (!config.position) config.position = 'right';
    if (!config.color) config.color = 'blue';
    if (!config.logo) config.logo = 'starburst';
    // find element to anchor to
    let target;
    if (targetType === '#') { // anchoring to an id
      target = document.getElementById(toClassName(config.anchor.substring(1)));
    } else if (targetType === '.') { // anchoring to a class
      target = document.querySelector(`.${toClassName(config.anchor.substring(1))}`);
    }
    // find the anchor block/content parent
    while (![...target.classList].includes('block') && ![...target.classList].includes('default-content-wrapper')) {
      target = target.parentNode;
    }
    const targetClasses = [...target.classList];
    target.classList.add('anchor-target');
    target.style.position = 'relative';
    // build anchor wrapper
    const wrapper = createEl('aside', { class: 'anchor-wrapper' });
    if (targetClasses.includes('block')) {
      wrapper.classList.add('anchor-block-wrapper');
    } else if (targetClasses.includes('default-content-wrapper')) {
      wrapper.classList.add('anchor-content-wrapper');
    }
    // build anchor
    const anchor = createEl('div', {
      class: `anchor
        anchor-${toClassName(config.position)}
        anchor-${toClassName(config.color)}`,
    });
    // build anchor text
    if (config.text) {
      const text = createEl('p', {
        class: 'anchor-text',
        text: config.text,
      });
      anchor.append(text);
    }
    // build anchor logo
    const logo = createEl('span', { class: `icon icon-${toClassName(config.logo)}` });
    anchor.append(logo);
    if (config.link) {
      // add anchor link
      const link = createEl('a', {
        href: config.link,
        html: anchor.outerHTML,
      });
      wrapper.append(link);
    } else {
      wrapper.append(anchor);
    }
    // style logo & add to page
    decorateIcons(wrapper);
    target.prepend(wrapper);
  }
  block.parentNode.remove(); // remove empty block wrapper
}
