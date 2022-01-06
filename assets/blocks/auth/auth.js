import {
  createEl,
} from '../../scripts/scripts.js';

import {
  buildForm,
  getSubmissionData,
  validateForm,
} from '../../utils/forms/forms.js';

import {
  buildScreensaver,
  // makeScreensaverError,
  removeScreensaver,
} from '../../utils/screensaver/screensaver.js';

import {
  checkAuthToken,
  getAuthToken,
  setAuthToken,
} from '../../utils/admin/admin.js';

function togglePasswordView(form) {
  const password = form.querySelector('[name="password"]');
  if (password) {
    password.addEventListener('dblclick', (e) => {
      const type = e.target.getAttribute('type');
      if (type === 'password') {
        e.target.setAttribute('type', 'text');
      } else if (type === 'text') {
        e.target.setAttribute('type', 'password');
      }
    });
  }
}

export default async function decorateAuth(block) {
  const wrapper = document.querySelector('.auth-container');
  const storageToken = getAuthToken();
  if (storageToken) {
    // validate
    const res = await checkAuthToken(storageToken);
    if (res) {
      wrapper.setAttribute('aria-expanded', false);
    }
  } else {
    const form = block.querySelector('form.auth-form');
    await buildForm(form, ['auth']);
    togglePasswordView(form);
    const btn = createEl('button', {
      class: 'btn auth-btn',
      id: 'auth-btn',
      text: 'login',
    });
    form.append(btn);
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const valid = validateForm(form);
      if (valid) {
        buildScreensaver('validating credentials...');
        const data = getSubmissionData(form);
        const token = await setAuthToken(data);
        if (!token) {
          // eslint-disable-next-line no-alert
          alert('invalid credentials!');
          form.querySelectorAll('input').forEach((input) => {
            input.value = '';
          });
        } else {
          form.querySelectorAll('input').forEach((input) => {
            input.value = '';
          });
          wrapper.setAttribute('aria-expanded', false);
        }
        removeScreensaver();
      }
    });
  }
}
