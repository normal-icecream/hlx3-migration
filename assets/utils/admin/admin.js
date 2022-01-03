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
      return 'AKfycbyzcWnp5rgMMP7Wd9TiQVJGp71gKmMn2LJwS9RyngBoO-1xRGWA4OQ_exW1nNufQsGDVA';
    case 'text':
      return 'AKfycbxgG4Ihj7PsSRdemmBYVmp0Q0dQUHHkWwA_TdCqysRT9IBNxGV3mnuXhZNovmun8NA9xA';
    case 'shipping':
      return 'AKfycbzsC2PCET2DvZk9UFG5L591i0nUS_DGrzHSmQoQGCc6tgI5FQ3RQ2AeP_0kJeCD5MOmQQ';
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
