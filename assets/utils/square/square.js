/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
import {
  buildGScriptLink,
  fetchCatalog,
  getCurrentStore,
  toClassName,
} from '../../scripts/scripts.js';

import {
  clearCustomizeBody,
  hideCustomize,
  populateCustomizeBasics,
  showCustomize,
} from '../../blocks/customize/customize.js';

// eslint-disable-next-line import/no-cycle
import {
  showCheckout,
  updateCheckout,
} from '../../blocks/checkout/checkout.js';

import {
  buildSquareForm,
  getSubmissionData,
  validateForm,
} from '../forms/forms.js';

import {
  makeScreensaverError,
} from '../screensaver/screensaver.js';

class Cart {
  constructor(body) {
    this.body = body;
  }

  line_items = [];

  add = async(vari, mods = []) => {
    const li = this.find(vari, mods);
    if (li) {
      li.quantity += 1;
    } else {
      const catalog = await fetchCatalog();
      let fp = vari;
      let price = catalog.byId[fp].item_variation_data.price_money.amount;
      mods.forEach((mod) => {
        fp += `-${mod}`;
        price += catalog.byId[mod].modifier_data.price_money.amount;
      });
      this.line_items.push({
        fp,
        variation: vari,
        mods,
        quantity: 1,
        price,
      });
    }
    this.store();
  };

  find = (vari, mods) => {
    let fp = vari;
    mods.forEach((mod) => {
      fp += `-${mod}`;
    });
    return this.line_items.find((li) => fp === li.fp);
  };

  load = async() => {
    const store = getCurrentStore();
    const cartObj = JSON.parse(localStorage.getItem(`cart-${store}`));
    this.line_items = [];
    // cart.shipping_quantities = [];
    if (cartObj && cartObj.line_items) {
      const catalog = await fetchCatalog();
      cartObj.line_items.forEach(async(li) => {
        if (catalog.byId[li.variation]) {
          let push = true;
          li.mods.forEach((m) => {
            if (!catalog.byId[m]) { push = false; }
          });
          if (push) { await this.line_items.push(li); }
        }
      });
    }
  };

  remove = (fp) => {
    const i = this.line_items.findIndex((li) => fp === li.fp);
    this.line_items.splice(i, 1);
    this.store();
  };

  setQuantity = (fp, q) => {
    const i = this.line_items.findIndex((li) => fp === li.fp);
    this.line_items[i].quantity = q;
    if (q < 1) {
      this.remove(fp);
    } else {
      this.store();
    }
  };

  store = () => {
    const store = getCurrentStore();
    const cartObj = {
      last_update: new Date(),
      line_items: this.line_items,
    };
    localStorage.setItem(`cart-${store}`, JSON.stringify(cartObj));
  };

  totalAmount = () => {
    let total = 0;
    this.line_items.forEach((li) => {
      if (li.quantity > 0) {
        total += li.price * li.quantity;
      }
    });
    return total;
  };

  totalItems = () => {
    let total = 0;
    this.line_items.forEach((li) => {
      if (li.quantity) {
        total += li.quantity;
      }
    });
    return total;
    // const total = 0;
    // cart.line_items.forEach((li) => {
    //   // don't count out-of-stock
    //   if (li.quantity) {
    //     total += li.quantity;
    //   }
    // });
    // return total;
  };
}

const cart = {
  line_items: [],
  shipping_quantities: [],
  shipping_item: {},
  remove: (fp) => {
    const index = cart.line_items.findIndex((li) => fp === li.fp);
    cart.line_items.splice(index, 1);
    cart.store();
  },
  removeShipping: () => {
    cart.shipping_item = {};
  },
  removeShippingQuantity: (fp) => {
    const index = cart.shipping_quantities.findIndex((sq) => fp === sq.fp);
    cart.shipping_quantities.splice(index, 1);
    cart.store();
  },
  add: (variation, mods) => {
    if (!mods) { mods = []; }
    const li = cart.find(variation, mods);
    if (li) {
      li.quantity++;
    } else {
      const fp = variation;
      const price =
        catalog.byId[variation].item_variation_data.price_money.amount;
      mods.forEach((m) => {
        fp += "-" + m;
        price += catalog.byId[m].modifier_data.price_money.amount;
      });
      cart.line_items.push({
        fp: fp,
        variation: variation,
        mods: mods,
        quantity: 1,
        price: price,
      });
    }
    cart.store();
  },
  addShipping: (variation, quantity = 1) => {
    const fp = variation;
    const price = catalog.byId[variation].item_variation_data.price_money.amount;
    cart.shipping_item = {
      fp: fp,
      variation: variation,
      mods: [],
      quantity: quantity,
      price: price,
    };
  },
  addShippingQuantities: (obj) => {
    cart.shipping_quantities.push(obj);
    cart.store();
  },
  find: (variation, mods) => {
    const fp = variation;
    mods.forEach((m) => {
      fp += "-" + m;
    });
    return cart.line_items.find((li) => fp === li.fp);
  },
  setQuantity: (fp, q) => {
    const index = cart.line_items.findIndex((li) => fp === li.fp);
    cart.line_items[index].quantity = q;
    cart.store();
  },
  totalAmount: () => {
    const currentStore = getCurrentStore();
    const total = 0;
    cart.line_items.forEach((li) => {
      if (li.quantity > 0) {
        total += li.price * li.quantity;
      }
    });
    return total;
  },
  totalAmountWithShipping: () => {
    let total = cart.totalAmount();
    if (cart.shipping_item.price) {
      total += (cart.shipping_item.price * cart.shipping_item.quantity);
    }
    return total;
  },
  totalItems: () => {
    const total = 0;
    cart.line_items.forEach((li) => {
      // don't count out-of-stock
      if (li.quantity) {
        total += li.quantity;
      }
    });
    return total;
  },
  clear: () => {
    cart.line_items = [];
    cart.shipping_quantities = [];
    cart.shipping_item = {};
    cart.store();
  },
  store: () => {
    const currentStore = getCurrentStore();
    const cartObj = {
      lastUpdate: new Date(),
      line_items: cart.line_items
    };
    if (cart.shipping_quantities && currentStore === "shipping") {
      cartObj.shipping_quantities = cart.shipping_quantities
    }
    localStorage.setItem("cart-" + currentStore, JSON.stringify(cartObj));
  },
  load: () => {
    const cartObj = JSON.parse(localStorage.getItem("cart-" + getLastStore()));
    cart.line_items = [];
    cart.shipping_quantities = [];

    if (cartObj && cartObj.line_items) {
      // validate
      cartObj.line_items.forEach((li) => {
        if (catalog.byId[li.variation]) {
          const push = true;
          li.mods.forEach((m) => {
            if (!catalog.byId[m]) { push = false };
          });
          if (push) { cart.line_items.push(li) };
        }
      });
    }

    if (cartObj && cartObj.shipping_quantities) {
      cartObj.shipping_quantities.forEach((sq) => {
        cart.shipping_quantities.push(sq);
      });
    }
  }
};

export function formatMoney(num) {
  return Number(num / 100).toFixed(2);
}

export function removeStoreFromString(str) {
  const stores = ['lab', 'store', 'composed cone'];
  stores.forEach((store) => {
    if (str.toLowerCase().startsWith(store)) {
      // eslint-disable-next-line no-param-reassign
      str = str.toLowerCase().replace(store, '').trim();
    }
  });
  return str;
}

function writeLabelText(str, vari) {
  let text = removeStoreFromString(str);
  if (text === 'soft serve') {
    text += ' flavor (select 1)';
  } else if (text === 'topping') {
    text += 's (select up to 3';
  } else if ((vari && vari.includes(' size')) ||
    (vari && vari.includes(' oz'))) {
    text = 'select a size';
  }
  return text;
}

export async function populateSquareBody(item) {
  clearCustomizeBody();
  const body = document.querySelector('.customize .customize-body');
  if (body) {
    const catalog = await fetchCatalog();
    // const { id } = item;
    const data = item.item_data;
    const { name, variations } = data;
    const label = writeLabelText(name, variations[0].item_variation_data.name);
    const fields = [];
    if (variations.length > 1) {
      // create radio btns
      const field = {
        category: 'square-variation',
        label,
        options: [],
        required: true,
        store: false,
        title: toClassName(name),
        type: 'radio',
      };
      variations.forEach((v) => {
        const option = {
          id: v.id,
          name: v.item_variation_data.name,
          price: formatMoney(v.item_variation_data.price_money.amount),
        };
        field.options.push(option);
      });
      fields.push(field);
    } else {
      const field = {
        category: 'square-variation',
        label,
        options: [{
          id: variations[0].id,
          name: variations[0].item_variation_data.name,
          price: formatMoney(variations[0].item_variation_data.price_money.amount),
          checked: true,
        }],
        required: true,
        store: false,
        title: toClassName(name),
        type: 'radio',
      };
      fields.push(field);
    }
    const modifiers = data.modifier_list_info;
    modifiers.forEach((mod) => {
      const modData = catalog.byId[mod.modifier_list_id].modifier_list_data;
      const modName = modData.name;
      const modLabel = writeLabelText(modName);
      const fieldType = modName.includes('topping') ? 'checkbox' : 'radio';
      const field = {
        category: 'square-modifier',
        label: modLabel,
        options: [],
        required: (fieldType === 'radio'),
        store: false,
        title: toClassName(modName),
        type: fieldType,
      };
      const modMods = modData.modifiers;
      modMods.forEach((m) => {
        const mName = m.modifier_data.name;
        if (fieldType === 'radio' || (fieldType === 'checkbox' && !mName.startsWith('no '))) {
          const mId = m.id;
          const option = {
            id: mId,
            name: mName,
            price: formatMoney(m.modifier_data.price_money.amount),
          };
          field.options.push(option);
        }
      });
      fields.push(field);
    });
    await buildSquareForm(body, fields);
  }
}

export async function addConfigToCart(data) {
  let vari;
  const mods = [];
  Object.keys(data).forEach((key) => {
    if (!vari) {
      vari = data[key];
    } else if (typeof data[key] === 'object') {
      // push all checkboxes
      data[key].forEach((k) => {
        mods.push(k);
      });
    } else {
      mods.push(data[key]);
    }
  });
  await setupCart();
  if (!mods) {
    await window.cart.add(vari);
  } else {
    await window.cart.add(vari, mods);
  }
  updateCartItems();
}

export function populateSquareFoot() {
  const foot = document.querySelector('.customize .customize-foot');
  if (foot) {
    const btn = foot.querySelector('a');
    if (btn) {
      btn.addEventListener('click', () => {
        const form = document.querySelector('form.customize-body');
        const valid = validateForm(form);
        if (valid) {
          const data = getSubmissionData(form);
          addConfigToCart(data);
          hideCustomize();
        }
      });
    }
  }
}

export async function configItem(item) {
  const itemName = item.item_data.name.trim();
  // const paths = window.location.pathname.split('/').filter((i) => i);

  populateCustomizeBasics(`customize your ${removeStoreFromString(itemName)}`, {
    text: 'add to cart',
  });
  await populateSquareBody(item);
  populateSquareFoot();
  showCustomize();
}

export async function addToCart(e) {
  const { target } = e;
  const id = target.getAttribute('data-id');
  if (id) {
    await setupCart;
    const catalog = await fetchCatalog();
    const obj = catalog.byId[id];
    if (obj.type === 'ITEM') {
      if (
        obj.item_data.modifier_list_info ||
        obj.item_data.variations.length > 1
      ) {
        configItem(obj);
      } else {
        await window.cart.add(obj.item_data.variations[0].id);
        updateCartItems();
      }
    } else {
      await window.cart.add(obj.id);
      updateCartItems();
    }
  }
}

export async function setupCart() {
  if (!window.cart) {
    window.cart = await new Cart(document.querySelector('main'));
  }
  await window.cart.load();
}

export function setupCartBtn() {
  updateCartItems();
  const cartBtn = document.querySelector('.header-cart');
  if (cartBtn && typeof cartBtn.onclick !== 'function') {
    cartBtn.addEventListener('click', async() => {
      if (cartBtn.textContent > 0) { // only open carts with items
        await updateCheckout();
        showCheckout();
      }
    });
  }
}

export function updateCartItems() {
  const cartBtn = document.querySelector('.header-cart');
  if (cartBtn) {
    const amount = cartBtn.querySelector('.header-cart-amount');
    if (amount && window.cart) {
      console.log('updating cart items:', window.cart.totalItems());
      amount.textContent = window.cart.totalItems();
    }
  }
}

function generateId(data) {
  const now = new Date().toISOString();
  const day = new Date().toString().substring(0, 1); // first char of today's date
  const a = data.name.substring(0, 1); // first char of name
  const b = data.email.match(/@./)[0].replace('@', day); // first char of email domain
  const c = now.match(/T[0-9]{1,}/)[0].replace('T', a).toUpperCase(); // digits from date
  const d = now.match(/[0-9]{1,}Z/)[0].replace('Z', b).toUpperCase(); // digits from time
  const id = `${c}${d}`.replace(/[^0-9a-z]/gi, 'N'); // replace nonalphanumeric with N
  return id;
}

function getOrderCredentials(store = getCurrentStore()) {
  if (store === 'store') {
    window.location_id = '6EXJXZ644ND0E';
    return {
      name: store,
      endpoint: 'AKfycbxRO3In21tjrjr2kfElmU3g8GyTSy8gkR4-DfnlxTWCMa36gxs-Gp4-C6wybbYdL2_G',
      location: '6EXJXZ644ND0E',
    };
  }
  // switch (storefront) {
  //     case "store":
  //       return {
  //         name: storefront,
  //         endpoint: "https://script.google.com/macros/s/AKfycbzPFOTS5HT-Vv1mAYv3ktpZfNhGtRPdHz00Qi9Alw/exec",
  //         locationId: "6EXJXZ644ND0E"
  //       };
  //     case "lab":
  //       return {
  //         name: storefront,
  //         endpoint: "https://script.google.com/macros/s/AKfycbyQ1tQesQanw1Dd13t0c7KLxBRwKTesCfbHJQdHMMvc02aWiLGZ/exec",
  //         locationId: "3HQZPV73H8BHM"
  //       };
  //     case "delivery":
  //       return {
  //         name: storefront,
  //         endpoint: "https://script.google.com/macros/s/AKfycbwXsVa_i4JBUjyH7DyWVizeU3h5Rg5efYTtf4pcF4FXxy6zJOU/exec",
  //         locationId: "WPBKJEG0HRQ9F"
  //       };
  //     case "shipping":
  //       return {
  //         name: storefront,
  //         endpoint: "https://script.google.com/macros/s/AKfycbwyNjfGbBg0MBVfmTaIx4Mi5n-b3SfZ59J8n-YAFVEEXbo84qAM2mxC8gi0d8CXq_br/exec",
  //         locationId: "WPBKJEG0HRQ9F"
  //       };
  //     case "pint-club":
  //       return {
  //         name: storefront,
  //         endpoint: "https://script.google.com/macros/s/AKfycbwFL62Dr7SaWDlq8nezAJbRRxsmN1uSlA_nqkQ6lzmtcBUzFwTn1GO7Jo0wCb1s6rtv/exec",
  //         locationId: "WPBKJEG0HRQ9F"
  //       };
  //     case "merch-pickup":
  //       return {
  //         name: storefront,
  //         endpoint: "https://script.google.com/macros/s/AKfycbxzfw2T-Cx3lJMSK2TXqjhlTg1vjcGkTW5_eufayZGHzRrHkM6rUK5thYgTMbWK56ca/exec",
  //         locationId: "6EXJXZ644ND0E"
  //       };
  //     case "merch-shipping":
  //       return {
  //         name: storefront,
  //         endpoint: "https://script.google.com/macros/s/AKfycbxzfw2T-Cx3lJMSK2TXqjhlTg1vjcGkTW5_eufayZGHzRrHkM6rUK5thYgTMbWK56ca/exec",
  //         locationId: "WPBKJEG0HRQ9F"
  //       };
  //     default:
  //       console.error(`location ${storefront} is not configured`);
  //       return {
  //         name: storefront
  //       };
  //   }
  return false;
}

async function buildOrderParams(data) {
  const params = {};
  if (data.name) {
    params.display_name = data.name;
  }
  if (data.cell) {
    params.cell = data.cell;
  }
  if (data.email) {
    params.email_address = data.email;
  }
  if (data['pickup-time']) {
    params.pickup_at = data['pickup-time'];
  }
  params.reference_id = generateId(data);
  params.line_items = [];

  await setupCart();
  window.cart.line_items.forEach((li) => {
    const mods = li.mods.map((mod) => ({ catalog_object_id: mod }));
    const lineItem = {
      catalog_object_id: li.variation,
      quantity: li.quantity.toString(),
    };
    if (mods.length) { lineItem.modifiers = mods; }
    params.line_items.push(lineItem);
  });
  return params;
}

export async function submitOrder(data) {
  const params = await buildOrderParams(data);
  let qs = '';
  Object.keys(params).forEach((key) => {
    if (key in params) {
      if (key === 'line_items') {
        qs += `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`;
      } else {
        qs += `${key}=${encodeURIComponent(params[key])}`;
      }
      qs += '&';
    }
  });
  const store = getCurrentStore();
  const cred = getOrderCredentials(store);
  const url = buildGScriptLink(cred.endpoint);

  const orderObj = await fetch(`${url}?${qs}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      return makeScreensaverError('something went wrong and your order didn\'t go through. try again?');
    })
    .then((resp) => {
      if (!resp.ok) {
        return resp.text().then((errorInfo) => { Promise.reject(errorInfo); });
      }
      return resp.text();
    }).then((text) => {
      const obj = JSON.parse(text);
      if (typeof obj.order !== 'undefined') {
        return obj.order;
      }
      // eslint-disable-next-line no-console
      console.error('errors:', data);
      return makeScreensaverError('something went wrong and your order didn\'t go through. try again?');
    });
  return orderObj;
}

export default async function square(main) {
  await setupCart();
  setupCartBtn();
  main.querySelectorAll('.btn-cart[data-id]').forEach((btn) => {
    btn.addEventListener('click', addToCart);
  });
}
