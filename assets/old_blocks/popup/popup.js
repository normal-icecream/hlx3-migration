import {
  createEl,
  createSVG,
  noScroll,
  readBlockConfig,
  toClassName,
} from '../../scripts/scripts.js';

function close(e) {
  const target = e.target.closest('.popup');
  const title = target.querySelector('h2').textContent;
  sessionStorage.setItem(`${toClassName(title)} popup`, 'viewed');
  target.setAttribute('aria-expanded', false);
  document.querySelector('body').classList.remove('no-scroll');
  window.removeEventListener('scroll', noScroll);
}

export default function decoratePopup(block) {
  const config = readBlockConfig(block);
  const wrapper = createEl('div', {
    class: 'popup-wrapper',
  });
  let popupStored = false;
  // set color
  if (config.color) {
    block.classList.add(`popup-${config.color}`);
  }
  // build logo
  if (config.logo) {
    const svg = createSVG(config.logo);
    svg.classList.add('popup-logo');
    wrapper.append(svg);
  }
  // build head and set visibility
  if (config.head) {
    const head = createEl('h2', {
      class: 'popup-head',
      html: config.head,
    });
    popupStored = sessionStorage.getItem(`${toClassName(config.head)} popup`);
    block.setAttribute('aria-expanded', !popupStored);
    wrapper.append(head);
  }
  // build body
  if (config.body) {
    const body = createEl('div', {
      class: 'popup-body',
    });
    if (typeof config.body === 'object') {
      config.body.forEach((line) => {
        const p = createEl('p', {
          html: line,
        });
        body.append(p);
      });
    } else {
      const p = createEl('p', {
        html: config.body,
      });
      body.append(p);
    }
    wrapper.append(body);
  }
  // build link
  if (config.link && config['link-text']) {
    const foot = createEl('div', {
      class: 'popup-foot',
    });
    const btn = createEl('a', {
      class: 'btn btn-rect',
      text: config['link-text'],
      href: new URL(config.link),
    });
    foot.append(btn);
    wrapper.append(foot);
  }
  block.innerHTML = '';
  block.append(wrapper);
  // build close button
  const btn = createEl('aside', {
    class: 'btn btn-close',
    title: 'close popup',
  });
  const closeSvg = createSVG('close');
  btn.append(closeSvg);
  block.prepend(btn);
  btn.addEventListener('click', close);
  if (!popupStored) {
    document.querySelector('body').classList.add('no-scroll');
    window.addEventListener('scroll', noScroll);
  }
}
