import {
  clearCustomizeBody,
  populateCustomizeBasics,
  showCustomize,
} from '../../blocks/customize/customize.js';

import {
  buildForm,
} from '../../utils/forms/forms.js';

function setupShipping() {
  const pickupMethod = document.querySelector('input#pickup[name="method"]');
  const shipMethod = document.querySelector('input#shipping[name="method"]');
  const addressInfo = document.querySelectorAll('input[data-category="address"');
  if (pickupMethod && shipMethod && addressInfo) {
    addressInfo.forEach((field) => {
      field.classList.add('form-field-hide');
    });
    shipMethod.addEventListener('click', () => {
      addressInfo.forEach((field) => {
        field.classList.remove('form-field-hide');
      });
    });
    pickupMethod.addEventListener('click', () => {
      addressInfo.forEach((field) => {
        field.classList.add('form-field-hide');
      });
    });
  }
}

function setupGifting() {
  const giftOption = document.querySelector('input[name="gift-option"]');
  const recipientInfo = document.querySelectorAll('input[data-category="club-gift"');
  if (recipientInfo) {
    recipientInfo.forEach((field) => {
      field.classList.add('form-field-hide');
    });
  }
  if (giftOption && recipientInfo) {
    const wrapper = giftOption.parentNode.parentNode;
    wrapper.setAttribute('aria-expanded', true);
    wrapper.previousSibling.setAttribute('aria-expanded', true);
    giftOption.addEventListener('change', () => {
      if (giftOption.checked) {
        // display recipient info
        recipientInfo.forEach((field) => {
          field.classList.remove('form-field-hide');
        });
        const addressInfo = document.querySelectorAll('input[data-category="address"');
        if (addressInfo) {
          addressInfo.forEach((field) => {
            field.placeholder = field.placeholder.replace('your', 'recipient');
          });
        }
      } else {
        // hide recipient info
        const addressInfo = document.querySelectorAll('input[data-category="address"');
        if (addressInfo) {
          addressInfo.forEach((field) => {
            field.placeholder = field.placeholder.replace('recipient', 'your');
          });
        }
        recipientInfo.forEach((field) => {
          field.classList.add('form-field-hide');
        });
      }
    });
  }
}

async function populateCustomizeBody(type) {
  clearCustomizeBody();
  const customize = document.querySelector('.customize');
  if (customize) {
    const clubFields = ['club', 'club-gift', 'address'];
    if (type === 'prepay') {
      clubFields.push(`club-${type}`);
    }
    const formEl = customize.querySelector('form.customize-body');
    await buildForm(formEl, clubFields);
  }
}

export default function decoratePintClub(main) {
  const columnLinks = main.querySelectorAll('.columns a');
  columnLinks.forEach((a) => {
    const { hash } = new URL(a.href);
    if (hash) {
      // setup customize screen
      a.removeAttribute('href');
      const type = hash.replace('#', '');
      a.addEventListener('click', async () => {
        populateCustomizeBasics(`customize your ${type} subscription`, {
          text: 'join the club',
        });
        await populateCustomizeBody(type);
        await setupShipping();
        await setupGifting();
        showCustomize();
      });
    }
  });
}
