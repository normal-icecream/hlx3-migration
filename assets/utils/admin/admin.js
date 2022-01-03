import {
  buildGQs,
  buildGScriptLink,
  getCurrentStore,
} from '../../scripts/scripts.js';

function setAuthToken() {

}

function getAuthToken() {

}

function getGId(type) {
  switch (type) {
    case 'text':
      return 'AKfycbwzpCx1vseXQmW76WwiB4QYdNotMLkrhnkBH8IM5Ow79fsVCkK2-NFrg0KZ7kVINA16zw';
    case 'shipping':
      return 'AKfycbwpKnEkCnug80R5aEIQhwUhqXp-ctjJgZoswhdEfcfkpmQms2VPny9JQddIpaScHmK_4g';
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

export async function sendEmail() {
  console.log('tba');
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
