/* eslint-disable import/no-cycle */
import {
  buildGScriptLink,
  buildGQs,
  createEl,
  fetchLabels,
  toClassName,
  getCurrentStore,
} from '../../scripts/scripts.js';

import {
  getOrderCredentials,
  setupCart,
  updateCartItems,
} from '../square/square.js';

import {
  buildScreensaver,
  makeScreensaverError,
  removeScreensaver,
} from '../screensaver/screensaver.js';

import {
  getSubmissionData,
} from '../forms/forms.js';

import {
  addToShippingSheet,
  sendText,
} from '../admin/admin.js';

function getStyles(style) {
  const styles = getComputedStyle(document.body);
  return styles.getPropertyValue(`--${toClassName(style)}`).trim();
}

function getData() {
  const data = {};
  const tipEl = document.querySelector('.checkout-foot-tip');
  if (tipEl) {
    data.tip_amount = tipEl.getAttribute('data-total');
  }
  const totalEl = document.querySelector('.checkout-foot-total');
  if (totalEl) {
    data.order_amount = totalEl.getAttribute('data-original-total');
  }
  const tFoot = document.querySelector('.checkout .checkout-table-foot');
  if (tFoot) {
    data.reference_id = tFoot.getAttribute('data-ref');
  }
  return data;
}

async function initializeCard(payments) {
  const card = await payments.card({
    style: {
      '.input-container': {
        borderColor: getStyles('color-blue'),
        borderRadius: '0px',
      },
      '.input-container.is-focus': {
        borderColor: getStyles('color-blue'),
      },
      '.input-container.is-error': {
        borderColor: getStyles('color-red'),
      },
      '.message-text.is-error': {
        color: getStyles('color-blue'),
      },
      '.message-icon.is-error': {
        color: getStyles('color-blue'),
      },
      input: {
        backgroundColor: getStyles('color-white'),
        color: getStyles('color-blue'),
        fontFamily: 'monospace',
      },
      'input::placeholder': {
        color: getStyles('color-dk-gray'),
      },
      'input.is-error': {
        backgroundColor: getStyles('color-pink'),
        color: getStyles('color-blue'),
      },
    },
  });
  await card.attach('#card-container');
  return card;
}

async function initializeGiftCard(payments) {
  const giftCard = await payments.giftCard({
    style: {
      '.input-container': {
        borderColor: getStyles('color-blue'),
        borderRadius: '0px',
      },
      '.input-container.is-focus': {
        borderColor: getStyles('color-blue'),
      },
      '.input-container.is-error': {
        borderColor: getStyles('color-red'),
      },
      '.message-text.is-error': {
        color: getStyles('color-blue'),
      },
      '.message-icon.is-error': {
        color: getStyles('color-blue'),
      },
      input: {
        backgroundColor: getStyles('color-white'),
        color: getStyles('color-blue'),
        fontFamily: 'monospace',
      },
      'input::placeholder': {
        color: getStyles('color-dk-gray'),
      },
      'input.is-error': {
        backgroundColor: getStyles('color-pink'),
        color: getStyles('color-blue'),
      },
    },
  });
  await giftCard.attach('#gift-card-container');
  return giftCard;
}

// Call this function to send a payment token, buyer name, and other details
// to the project server code so that a payment can be created with
// Payments API
async function createPayment(token) {
  const store = getCurrentStore();
  const cred = getOrderCredentials(store);
  const url = buildGScriptLink(cred.endpoint);
  const data = getData();
  const qs = buildGQs({
    order_amount: data.order_amount,
    tip_amount: data.tip_amount,
    source_id: token,
    location_id: window.location_id,
    reference_id: data.reference_id,
  });
  const paymentResponse = await fetch(`${url}?${qs}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  });
  if (paymentResponse.ok) {
    const json = await paymentResponse.json();
    if (json.errors) {
      throw new Error(JSON.stringify(json.errors));
    } else {
      return json;
    }
  }
  const errorBody = await paymentResponse.text();
  throw new Error(errorBody);
}

// This function tokenizes a payment method.
// The ‘error’ thrown from this async function denotes a failed tokenization,
// which is due to buyer error (such as an expired card). It is up to the
// developer to handle the error and provide the buyer the chance to fix
// their mistakes.
async function tokenize(paymentMethod) {
  const tokenResult = await paymentMethod.tokenize();
  if (tokenResult.status === 'OK') {
    return tokenResult.token;
  }
  let errorMessage = `Tokenization failed-status: ${tokenResult.status}`;
  if (tokenResult.errors) {
    errorMessage += ` and errors: ${JSON.stringify(
      tokenResult.errors,
    )}`;
  }
  throw new Error(errorMessage);
}

export function hidePaymentForm() {
  const form = document.getElementById('payment-form');
  if (form) {
    form.remove();
  }
}

async function storeSpecificResults(info, results, cart) {
  const store = getCurrentStore();
  switch (store) {
    case 'store':
      // send text
      await sendText(`+1${info.cell}`, { confirmation: true });
      // send email
      break;
    case 'lab':
      // send email
      break;
    case 'shipping':
      // add to shipping sheet
      await addToShippingSheet(info, results.payment.receipt_number, cart);
      // send email
      break;
    default:
      break;
  }
}

async function displaySuccessMessage(results) {
  const foot = document.querySelector('.checkout .checkout-foot');
  if (foot) {
    const store = getCurrentStore();
    const wrapper = createEl('div', {
      class: 'payment-success-message',
    });
    const labels = await fetchLabels();
    const message = labels[`${store}_thankyou`].split('\n');
    message.forEach((line) => {
      const p = createEl('p', {
        text: line,
      });
      wrapper.append(p);
    });
    // contact button
    const phone = labels[`${store}_phone`] ? labels[`${store}_phone`] : labels.store_phone;
    const contactBtn = createEl('a', {
      class: 'btn btn-rect btn-fixed',
      text: phone,
      href: `sms:+${phone.replace(/\D/g, '')}`,
    });
    wrapper.append(contactBtn);
    // receipt button
    if (results.payment && results.payment.receipt_url) {
      const receiptBtn = createEl('a', {
        class: 'btn btn-rect btn-fixed',
        text: 'view receipt',
        href: results.payment.receipt_url,
        target: '_blank',
      });
      wrapper.append(receiptBtn);
    }
    foot.append(wrapper);
  }
}

// Helper method for displaying the Payment Status on the screen.
// status is either SUCCESS or FAILURE;
async function displayPaymentResults(status, results) {
  const statusContainer = document.getElementById('payment-status-container');
  if (status === 'SUCCESS') {
    statusContainer.classList.remove('is-failure');
    statusContainer.classList.add('is-success');
    const customerInfo = getSubmissionData(document.querySelector('form.checkout-form'));
    hidePaymentForm();
    console.log('results:', results);
    console.log('customer info:', customerInfo);
    console.log('cart:', window.cart.line_items);
    // send email
    // send text
    await setupCart();
    await storeSpecificResults(customerInfo, results, window.cart.line_items);
    // empty cart
    window.cart.empty();
    updateCartItems();
    // display message
    await displaySuccessMessage(results);
    removeScreensaver();
  } else {
    statusContainer.classList.remove('is-success');
    statusContainer.classList.add('is-failure');
    removeScreensaver();
  }
  statusContainer.style.visibility = 'visible';
}

// eslint-disable-next-line consistent-return
export default async function payment() {
  if (!window.Square) {
    buildScreensaver('something went wrong. try again?');
    makeScreensaverError('something went wrong. try again?');
    throw new Error('Square.js failed to load properly');
  }

  const payments = window.Square.payments('sq0idp-7jw3abEgrV94NrJOaRXFTw', window.location_id);
  let card;
  try {
    card = await initializeCard(payments);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Initializing Card failed', e);
    return false;
  }

  let giftCard;
  try {
    giftCard = await initializeGiftCard(payments);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Initializing Gift Card failed', e);
    return false;
  }

  if (!card && !giftCard) {
    buildScreensaver('something went wrong. try again?');
    return makeScreensaverError('something went wrong. try again?');
  }

  const cardButton = document.getElementById('card-button');
  const giftCardButton = document.getElementById('gift-card-button');

  async function handlePaymentMethodSubmission(event, paymentMethod) {
    event.preventDefault();
    buildScreensaver('submitting your payment...');
    try {
      // disable the submit button as we await tokenization
      // and make a payment request.
      cardButton.disabled = true;
      giftCardButton.disabled = true;
      const token = await tokenize(paymentMethod);
      const paymentResults = await createPayment(token);
      await displayPaymentResults('SUCCESS', paymentResults);
      // eslint-disable-next-line no-console
      console.debug('Payment Success', paymentResults);
    } catch (e) {
      cardButton.disabled = false;
      giftCardButton.disabled = false;
      await displayPaymentResults('FAILURE');
      // eslint-disable-next-line no-console
      console.error(e.message);
    }
  }

  cardButton.addEventListener('click', async (event) => {
    await handlePaymentMethodSubmission(event, card);
  });

  giftCardButton.addEventListener('click', async (event) => {
    await handlePaymentMethodSubmission(event, giftCard);
  });
}
