import {
  buildGQs,
  buildGScriptLink,
  getCurrentStore,
} from '../../scripts/scripts.js';

function getGId(type) {
  switch (type) {
    case 'auth':
      return 'AKfycbxX6iCeru2Y3sS5z-GHT-a3lzsAGLGz_6SbNjdDL1lz2mBKfCfytL8RPTnKtntf7--D';
    case 'email':
      return 'AKfycbwgQ3cEgPfJvDk_AEhntT-Loedg-LMYStzuNVRtMI9V_K9cdYlntTRpwaefyQq0QYO4KA';
    case 'text': // see messages.js
      return 'AKfycbyj25ygCc6SvxJ9KCzdQSmiqz3emxuIJdNVzTXKjw3F88gdxClNLtq3PyNGgB2ca7FELA';
    case 'shipping':
      return 'AKfycbzsC2PCET2DvZk9UFG5L591i0nUS_DGrzHSmQoQGCc6tgI5FQ3RQ2AeP_0kJeCD5MOmQQ';
    case 'club': // see square.js
      return 'AKfycbxQSGSH3hT7vkujzXPVme2EN5Ux_DMczr67svPbcCw8aCcXeE_7TSYdgV5jRixaJEV5';
    default:
      return false;
  }
}

export async function setAuthToken(data) {
  const id = getGId('auth');
  const url = buildGScriptLink(id);
  const qs = buildGQs(data);
  const resp = await fetch(`${url}?${qs}`, { method: 'POST' });
  if (resp.ok) {
    const json = await resp.json();
    if (json['error-text']) {
      // eslint-disable-next-line no-console
      console.error(json);
    } else if (json.token) {
      sessionStorage.setItem('normal-token', json.token);
      return json.token;
    }
  }
  return false;
}

export function getAuthToken() {
  return sessionStorage.getItem('normal-token') || false;
}

export function removeAuthToken() {
  sessionStorage.removeItem('normal-token');
}

export async function checkAuthToken(token) {
  const id = getGId('auth');
  const url = buildGScriptLink(id);
  const qs = buildGQs({ token });
  const resp = await fetch(`${url}?${qs}`, { method: 'POST' });
  if (resp.ok) {
    const json = await resp.json();
    if (json.result === 'error' || !json.valid) {
      // eslint-disable-next-line no-console
      console.error(json);
      removeAuthToken();
    } else if (json.result === 'success' && json.valid) {
      return json.valid;
    }
  }
  return false;
}

export async function sendText(params) {
  const id = getGId('text');
  const url = buildGScriptLink(id);
  const qs = buildGQs(params);
  const resp = await fetch(`${url}?${qs}`, { method: 'POST' });
  if (resp.ok) {
    const json = await resp.json();
    if (json['error-text']) {
      // eslint-disable-next-line no-console
      console.error(json);
    }
    return json;
  }
  return false;
}

function buildEmailParams(store, info, results) {
  const params = {};
  params.type = 'confirmation';
  params.name = info.name;
  params.email = info.email;
  params.store = store;
  params.order_id = results.payment.receipt_number;
  params.receipt_url = results.payment.receipt_url;
  let merchShip = false;
  let merchPickup = false;
  if (store === 'merch') {
    if (info['merch-ship'] && info['merch-ship'].includes('true')) {
      merchShip = true;
    } else { merchPickup = true; }
  }
  if (store === 'store' || store === 'lab' || merchPickup) {
    params.pickup_at = info['pickup-time'];
  } else if (store === 'shipping' || merchShip) {
    let addrStr = info.addr1;
    if (info.addr2) {
      addrStr += `, ${info.addr2}`;
    }
    if (info.city) {
      addrStr += `, ${info.city}`;
    }
    if (info.state) {
      addrStr += `, ${info.state}`;
    }
    if (info.zip) {
      addrStr += ` ${info.zip}`;
    }
    params.address = addrStr;
  }
  return params;
}

export async function sendEmail(info, results) {
  const store = getCurrentStore();
  const id = getGId('email');
  const url = buildGScriptLink(id);
  const params = buildEmailParams(store, info, results);
  const qs = buildGQs(params);
  const resp = await fetch(`${url}?${qs}`, { method: 'POST' });
  if (resp.ok) {
    const json = await resp.json();
    if (json['error-text']) {
      // eslint-disable-next-line no-console
      console.error(json);
    }
  }
}

function writeCartNote(cart) {
  let note = '';
  cart.forEach((li) => {
    if (li.modQuantities) {
      Object.keys(li.modQuantities).forEach((id) => {
        if (li.modQuantities[id].quantity > 1) {
          note += `${li.modQuantities[id].quantity} ${li.modQuantities[id].name.replace('the ', '')},`;
        }
      });
    }
  });
  const store = getCurrentStore();
  if (store === 'merch') {
    note += 'merch order';
  }
  return note;
}

export async function addToShippingSheet(info, receiptNum, cart) {
  const id = getGId('shipping');
  const url = buildGScriptLink(id);
  const note = writeCartNote(cart);
  const qs = buildGQs({
    receipt_number: receiptNum,
    name: info.name,
    email: info.email,
    cell: info.cell,
    addr1: info.addr1,
    addr2: info.addr2,
    city: info.city,
    state: info.state,
    zip: info.zip,
    notes: note,
  });
  const resp = await fetch(`${url}?${qs}`, { method: 'POST' });
  if (resp.ok) {
    const json = await resp.json();
    if (json['error-text']) {
      // eslint-disable-next-line no-console
      console.error(json);
    }
  }
}

export async function createCustomer(data, info) {
  const id = getGId('club');
  const url = buildGScriptLink(id);
  const qs = buildGQs({ ...data, ...info });
  const resp = await fetch(`${url}?${qs}`, { method: 'POST' });
  if (resp.ok) {
    const json = await resp.json();
    if (json['error-text']) {
      // eslint-disable-next-line no-console
      console.error(json);
    }
    return { ...json, ...data, ...info };
  }
  return false;
}

function buildClubParams(info, results, cart) {
  const d = cart[0].clubDetails;
  const params = { sign_up: true };
  if (d && info) {
    params.name = d['gift-option'] ? d['recipient-name'] : info.name;
    params.email = d['gift-option'] ? d['recipient-email'] : info.email;
    params.cell = d['gift-option'] ? d['recipient-cell'] : info.cell;
    if (d.addr2) {
      params.address = `${d.addr1}, ${d.addr2}, ${d.city}, ${d.state} ${d.zip}`;
    } else if (d.addr1) {
      params.address = `${d.addr1}, ${d.city}, ${d.state} ${d.zip}`;
    }
    params.method = d.method;
    params.plan = d['prepay-months'] ? `${d.type} ${d['prepay-months']}` : d.type;
    if (d['customize-pints']) {
      params.customize_pints = d['customize-pints'].join(',').replace('®', '');
    } else {
      params.customize_pints = 'keep it normal';
    }
    if (d.allergies) {
      params.allergy = d.allergies;
    }
    if (d['gift-option']) {
      params.gift = true;
      params.notes = `this is a gift from ${info.name} (${info.cell}, ${info.email})`;
    }
  }
  if (results && results.subscription && results.subscription.customer_id) {
    params.customer_id = results.subscription.customer_id;
  }
  return params;
}

export async function addToClubSheet(info, results, cart) {
  const id = getGId('club');
  const url = buildGScriptLink(id);
  const params = buildClubParams(info, results, cart);
  const qs = buildGQs(params);
  const resp = await fetch(`${url}?${qs}`, { method: 'GET' });
  if (resp.ok) {
    const json = await resp.json();
    if (json['error-text']) {
      // eslint-disable-next-line no-console
      console.error(json);
    }
  }
}
