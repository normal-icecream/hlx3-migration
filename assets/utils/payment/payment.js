import {
  toClassName,
} from '../../scripts/scripts.js';

function getStyles(style) {
  const styles = getComputedStyle(document.body);
  return styles.getPropertyValue(`--${toClassName(style)}`).trim();
}

async function initializeCard(payments) {
  // const card = await payments.card();
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
  const body = JSON.stringify({
    locationId: window.location_id,
    sourceId: token,
  });
  const paymentResponse = await fetch('/payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
  if (paymentResponse.ok) {
    return paymentResponse.json();
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

// Helper method for displaying the Payment Status on the screen.
// status is either SUCCESS or FAILURE;
function displayPaymentResults(status) {
  const statusContainer = document.getElementById(
    'payment-status-container',
  );
  if (status === 'SUCCESS') {
    statusContainer.classList.remove('is-failure');
    statusContainer.classList.add('is-success');
  } else {
    statusContainer.classList.remove('is-success');
    statusContainer.classList.add('is-failure');
  }
  statusContainer.style.visibility = 'visible';
}

// eslint-disable-next-line consistent-return
export default async function payment(main) {
  if (!window.Square) {
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

  const cardButton = document.getElementById('card-button');
  const giftCardButton = document.getElementById('gift-card-button');

  async function handlePaymentMethodSubmission(event, paymentMethod) {
    event.preventDefault();
    try {
      // disable the submit button as we await tokenization and make a
      // payment request.
      cardButton.disabled = true;
      giftCardButton.disabled = true;
      const token = await tokenize(paymentMethod);
      const paymentResults = await createPayment(token);
      displayPaymentResults('SUCCESS');
      // eslint-disable-next-line no-console
      console.debug('Payment Success', paymentResults);
    } catch (e) {
      cardButton.disabled = false;
      giftCardButton.disabled = false;
      displayPaymentResults('FAILURE');
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
