import {
  buildGQs,
  buildGScriptLink,
  getCurrentStore,
} from '../../scripts/scripts.js';

// function setAuthToken() {

// }

// function getAuthToken() {

// }

function getGId(type) {
  switch (type) {
    case 'email':
      return 'AKfycbzHfg45o-Uw2_NwYNjfz9jpJc-kf61FIW8fX_V8tKM5kkTy3Bm2usT481WM6lQFv_Hq8g';
    case 'text':
      return 'AKfycbxgG4Ihj7PsSRdemmBYVmp0Q0dQUHHkWwA_TdCqysRT9IBNxGV3mnuXhZNovmun8NA9xA';
    case 'shipping':
      return 'AKfycbzsC2PCET2DvZk9UFG5L591i0nUS_DGrzHSmQoQGCc6tgI5FQ3RQ2AeP_0kJeCD5MOmQQ';
    case 'club': // see square.js
      return 'AKfycbxQSGSH3hT7vkujzXPVme2EN5Ux_DMczr67svPbcCw8aCcXeE_7TSYdgV5jRixaJEV5';
    default:
      return false;
  }
}

export async function sendText(num, data) {
  const store = getCurrentStore();
  const id = getGId('text');
  const url = buildGScriptLink(id);
  const params = { store, num };
  if (data.confirmation) { params.confirmation = true; }
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

function buildEmailParams(store, info, results) {
  const params = {};
  params.type = 'confirmation';
  params.name = info.name;
  params.email = info.email;
  params.store = store;
  params.order_id = results.payment.receipt_number;
  params.receipt_url = results.payment.receipt_url;
  if (store === 'store' || store === 'lab') {
    params.pickup_at = info['pickup-time'];
  } else if (store === 'shipping') {
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
      return false;
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
