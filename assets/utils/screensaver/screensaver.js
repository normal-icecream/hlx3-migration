import {
  createEl,
  createSVG,
  loadCSS,
} from '../../scripts/scripts.js';

export function removeScreensaver() {
  const screen = document.querySelector('.screensaver');
  if (screen) {
    screen.remove();
  }
}

export function makeScreensaverError(error) {
  const screen = document.querySelector('.screensaver');
  screen.classList.add('screensaver-error');
  if (screen) {
    const message = screen.querySelector('.screensaver-message');
    if (message) {
      message.querySelector('h2').textContent = error;
      const btn = createEl('btn', {
        class: 'btn btn-rect screensaver-btn',
        text: 'refresh the page',
      });
      btn.addEventListener('click', () => window.location.reload());
      message.append(btn);
    }
  }
}

export function buildScreensaver(message) {
  loadCSS('/assets/utils/screensaver/screensaver.css');
  const screen = createEl('section', {
    class: 'screensaver',
  });
  const wrapper = createEl('div', {
    class: 'screensaver-message',
    html: `<h2>${message}</h2>`,
  });
  const svg = createSVG('normal');
  const bounceBox = createEl('div', {
    class: 'screensaver-box',
  });
  bounceBox.append(svg);
  screen.append(wrapper, bounceBox);
  document.querySelector('main').prepend(screen);
}
