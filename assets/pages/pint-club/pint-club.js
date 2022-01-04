import {
  createEl,
  fetchCatalog,
} from '../../scripts/scripts.js';

import {
  clearCustomizeBody,
  hideCustomize,
  populateCustomizeBasics,
  showCustomize,
} from '../../blocks/customize/customize.js';

import {
  hideCheckoutForm,
  populateCheckoutFoot,
  populateCheckoutTable,
  resetCheckoutFootBtn,
  showCheckout,
} from '../../blocks/checkout/checkout.js';

import {
  addConfigToCart,
} from '../../utils/square/square.js';

import {
  buildForm,
  buildPaymentForm,
  getFromLocalStorage,
  getSubmissionData,
  saveToLocalStorage,
  validateForm,
} from '../../utils/forms/forms.js';

import {
  createCustomer,
} from '../../utils/admin/admin.js';

import {
  buildScreensaver,
  makeScreensaverError,
  removeScreensaver,
} from '../../utils/screensaver/screensaver.js';

function setupShipping() {
  const pickupMethod = document.querySelector('input#pickup[name="method"]');
  const shipMethod = document.querySelector('input#shipping[name="method"]');
  const addressInfo = document.querySelectorAll('input[data-category="address"');
  if (pickupMethod && shipMethod && addressInfo) {
    addressInfo.forEach((field) => {
      field.classList.add('form-field-hide');
      field.value = '';
      field.required = false;
    });
    shipMethod.addEventListener('click', () => {
      addressInfo.forEach((field) => {
        field.classList.remove('form-field-hide');
        if (field.id !== 'addr2') { field.required = true; }
      });
      getFromLocalStorage(addressInfo[0].parentElement);
    });
    pickupMethod.addEventListener('click', () => {
      addressInfo.forEach((field) => {
        field.classList.add('form-field-hide');
        field.value = '';
        field.required = false;
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
      field.value = '';
      field.required = false;
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
          field.required = true;
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
          field.value = '';
          field.required = false;
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
    await getFromLocalStorage(formEl);
  }
}

async function prepClubCheckout(type, data) {
  const { method } = data;
  let term = Number(data['prepay-months']); // no term = monthly sub
  if (!term) {
    term = (method === 'pickup') ? 1 : 'ship';
  }
  const catalog = await fetchCatalog();
  const CLUB_ID = 'DONYA6SLBFMWSSJIPK5YRK32';
  const obj = catalog.byId[CLUB_ID];
  const { variations } = obj.item_data;
  const match = variations.find((v) => (v.item_variation_data.name.includes(term)));
  if (match) {
    await addConfigToCart({ id: match.id });
    window.cart.addClubDetails(match.id, data, type);
  }
  if (type === 'prepay' && method === 'shipping') {
    window.cart.setShipping(match.id);
    const SHIPPING_VARI_ID = 'W7DAWRCFA47SUUNUNPTLGR76';
    // add shipping to cart
    await window.cart.addShipping(SHIPPING_VARI_ID, term);
  }
}

async function prepayClub() {
  populateCheckoutFoot('join the club');
  window.cart.setStoreParams({ type: 'shipping' });
  removeScreensaver();
}

async function attachCardToSub() {
  await hideCheckoutForm();
  resetCheckoutFootBtn();
  await buildPaymentForm(['payment']);
  removeScreensaver();
}

async function enrollInSubscription(data, type) {
  // enroll in subscription!
  const form = document.querySelector('form.checkout-form');
  const formData = getSubmissionData(form);
  const customer = await createCustomer(data, formData);
  if (customer) {
    window.cart.setStoreParams({
      customer_id: customer.customer.id,
      pint_type: type,
      pint_method: data.method,
    });
    attachCardToSub(customer);
  } else {
    makeScreensaverError('something went wrong and your subscription didn\'t go through. try again?');
    window.cart.empty();
  }
}

function updateClubFoot(type, data) {
  const foot = document.querySelector('.checkout .checkout-foot');
  if (foot) {
    const btn = foot.querySelector('a');
    if (btn) {
      btn.remove();
      const newBtn = createEl('a', {
        class: 'btn btn-rect',
        text: 'join the club',
      });
      newBtn.addEventListener('click', () => {
        buildScreensaver('joining the club...');
        if (type === 'prepay') {
          // checkout with cart
          prepayClub();
        } else if (type === 'monthly') {
          // enroll in subscription
          enrollInSubscription(data, type);
        }
      });
      foot.append(newBtn);
    }
  }
}

async function updateCheckoutForClub(type, data) {
  await prepClubCheckout(type, data);
  // remove pickup info
  const form = document.querySelector('form.checkout-form');
  if (form) {
    const pickups = form.querySelectorAll('[name^="pickup"]');
    pickups.forEach((pickup) => pickup.parentNode.remove());
  }
  updateClubFoot(type, data);
  populateCheckoutTable();
}

async function populateCustomizeFoot() {
  const btn = document.querySelector('.customize .customize-foot a');
  if (btn) {
    btn.addEventListener('click', async () => {
      const form = document.querySelector('form.customize-body');
      const valid = validateForm(form);
      if (valid) {
        buildScreensaver('joining the club...');
        await saveToLocalStorage(form);
        const type = btn.getAttribute('data-info');
        if (type === 'prepay') {
          window.cart.setStoreParams({ type: 'shipping' });
        }
        const data = await getSubmissionData(form);
        await updateCheckoutForClub(type, data);
        showCheckout();
        hideCustomize();
        removeScreensaver();
      }
    });
  }
}

export default function decoratePintClub(main) {
  const cart = document.querySelector('.header-cart');
  cart.classList.add('header-cart-hide');
  // set up columns
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
          data: type,
        });
        if (window.cart) {
          window.cart.empty();
        }
        await populateCustomizeBody(type);
        await populateCustomizeFoot();
        await setupShipping();
        await setupGifting();
        showCustomize();
      });
    }
  });
}
