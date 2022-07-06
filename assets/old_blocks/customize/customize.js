import {
  createEl,
  createSVG,
  noScroll,
} from '../../scripts/scripts.js';

export function showCustomize() {
  const customize = document.querySelector('.customize-container');
  if (customize) {
    customize.setAttribute('aria-expanded', true);
    document.querySelector('body').classList.add('no-scroll');
    window.addEventListener('scroll', noScroll);
  }
}

export function hideCustomize() {
  const customize = document.querySelector('.customize-container');
  if (customize) {
    customize.setAttribute('aria-expanded', false);
    document.querySelector('body').classList.remove('no-scroll');
    window.removeEventListener('scroll', noScroll);
  }
}

export function clearCustomizeBasics() {
  const head = document.querySelector('.customize .customize-head h2');
  if (head) {
    head.textContent = '';
  }
  const foot = document.querySelector('.customize .customize-foot a');
  if (foot) {
    foot.textContent = '';
    // remove event listeners
    const newBtn = foot.cloneNode(true);
    foot.parentNode.replaceChild(newBtn, foot);
  }
}

export function clearCustomizeBody() {
  const body = document.querySelector('.customize .customize-body');
  if (body) {
    body.innerHTML = '';
  }
}

export function populateCustomizeBasics(title, btnInfo) {
  clearCustomizeBasics();
  const customize = document.querySelector('.customize');
  if (customize) {
    const h2 = customize.querySelector('.customize-head h2');
    h2.textContent = title;
    const a = customize.querySelector('.customize-foot a');
    a.textContent = btnInfo.text;
    if (btnInfo.data) {
      a.setAttribute('data-info', btnInfo.data);
    }
  }
}

export default function decorateCustomize(block) {
  const wrapper = block.firstChild.firstChild;
  const btn = wrapper.querySelector('.btn-close');
  if (!btn) {
    const newBtn = createEl('aside', {
      class: 'btn btn-close',
    });
    const close = createSVG('close');
    newBtn.append(close);
    newBtn.addEventListener('click', hideCustomize);
    wrapper.prepend(newBtn);
  } else {
    const close = createSVG('close');
    btn.addEventListener('click', hideCustomize);
    btn.append(close);
  }
  const head = wrapper.querySelector('.customize-head');
  if (!head) {
    const newHead = createEl('div', {
      class: 'customize-head',
      html: '<h2></h2>',
    });
    wrapper.append(newHead);
  }
  const body = wrapper.querySelector('.customize-body');
  if (!body) {
    const newBody = createEl('form', {
      class: 'customize-body',
    });
    wrapper.append(newBody);
  }
  const foot = wrapper.querySelector('.customize-foot');
  if (!foot) {
    const newFoot = createEl('div', {
      class: 'customize-foot',
      html: '<a class="btn btn-rect"></a>',
    });
    wrapper.append(newFoot);
  }
}
