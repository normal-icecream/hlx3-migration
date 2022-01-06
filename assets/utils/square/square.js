/* eslint-disable import/no-cycle */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
import {
  buildBlock,
  buildGScriptLink,
  buildGQs,
  createEl,
  createSVG,
  fetchCatalog,
  fetchMenu,
  getCurrentStore,
  loadBlock,
  toClassName,
} from '../../scripts/scripts.js';

import {
  clearCustomizeBody,
  hideCustomize,
  populateCustomizeBasics,
  showCustomize,
} from '../../blocks/customize/customize.js';

import {
  showCheckout,
  updateCheckout,
} from '../../blocks/checkout/checkout.js';

import {
  buildSquareForm,
  getShippingData,
  getSubmissionData,
  validateDiscount,
  validateForm,
  validateShippingForm,
} from '../forms/forms.js';

import {
  buildScreensaver,
  makeScreensaverError,
  removeScreensaver,
} from '../screensaver/screensaver.js';

import {
  hidePaymentForm,
} from '../payment/payment.js';

class Cart {
  constructor(body) {
    this.body = body;
  }

  line_items = [];

  shipping_item = {};

  current_store = {};

  add = async (vari, mods = []) => {
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

  addShipping = async (vari, q = 1) => {
    const si = this.shipping_item;
    if (si.fp === vari) {
      si.quantity += q;
    } else {
      const catalog = await fetchCatalog();
      const fp = vari;
      const price = catalog.byId[fp].item_variation_data.price_money.amount;
      this.shipping_item = {
        fp,
        variation: vari,
        mods: [],
        quantity: q,
        price,
      };
    }
    this.store();
  };

  addClubDetails = (vari, data, type) => {
    const li = this.find(vari);
    if (li) {
      li.clubDetails = data;
      if (type) {
        li.clubDetails.type = type;
      }
      this.store();
    }
  };

  addShippingModQuantities = (vari, mods, data) => {
    const li = this.find(vari, mods);
    if (li) {
      li.modQuantities = data;
      this.store();
    }
  };

  setShipping = (vari, mods = []) => {
    const li = this.find(vari, mods);
    if (li) {
      li.shipped = true;
      this.store();
    }
  };

  unsetShipping = (vari, mods = []) => {
    const li = this.find(vari, mods);
    if (li) {
      delete li.shipped;
      this.store();
    }
  };

  checkShipping = () => {
    const shipped = this.line_items.find((li) => li.shipped);
    if (!shipped) {
      this.removeShipping();
    }
    return !!shipped;
  };

  find = (vari, mods = []) => {
    let fp = vari;
    mods.forEach((mod) => {
      fp += `-${mod}`;
    });
    return this.line_items.find((li) => fp === li.fp);
  };

  load = async () => {
    const store = getCurrentStore();
    const cartObj = JSON.parse(localStorage.getItem(`cart-${store}`));
    this.line_items = [];
    this.shipping_item = {};
    if (cartObj && cartObj.line_items) {
      const catalog = await fetchCatalog();
      cartObj.line_items.forEach(async (li) => {
        if (catalog.byId[li.variation]) {
          let push = true;
          li.mods.forEach((m) => {
            if (!catalog.byId[m]) { push = false; }
          });
          if (push) { await this.line_items.push(li); }
        }
      });
    }
    if (cartObj && cartObj.shipping_item) {
      this.shipping_item = cartObj.shipping_item;
    }
    if (cartObj && cartObj.current_store) {
      this.current_store = cartObj.current_store;
    }
  };

  empty = () => {
    this.line_items = [];
    this.shipping_item = {};
    this.resetStore();
    this.store();
  };

  remove = (fp) => {
    const i = this.line_items.findIndex((li) => fp === li.fp);
    this.line_items.splice(i, 1);
    this.store();
  };

  removeShipping = () => {
    this.shipping_item = {};
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

  setStore = () => {
    const store = getCurrentStore();
    this.current_store = { store };
  };

  setStoreParams = (params) => {
    this.current_store = { ...this.current_store, ...params };
    this.store();
  };

  resetStore = () => {
    this.current_store = {};
    this.setStore();
  };

  store = () => {
    const store = getCurrentStore();
    const cartObj = {
      last_update: new Date(),
      line_items: this.line_items,
      shipping_item: this.shipping_item,
      current_store: this.current_store,
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

  totalAmountShipped = () => {
    let total = 0;
    this.line_items.forEach((li) => {
      if (li.quantity > 0) {
        total += li.price * li.quantity;
      }
    });
    total += (this.shipping_item.price * this.shipping_item.quantity);
    return total;
  };

  totalItems = () => {
    let total = 0;
    this.line_items.forEach((li) => {
      if (li.quantity) {
        total += li.quantity;
      }
    });
    if (total < 1) {
      this.removeShipping();
    }
    return total;
  };
}

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
  } else if ((vari && vari.includes(' size'))
    || (vari && vari.includes(' oz'))) {
    text = 'select a size';
  }
  return text;
}

export async function populateSquareBody(item) {
  clearCustomizeBody();
  const body = document.querySelector('.customize .customize-body');
  if (body) {
    const catalog = await fetchCatalog();
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
    if (modifiers) {
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
    }
    await buildSquareForm(body, fields);
  }
}

function getLimits(id) {
  const target = document.querySelector(`[data-id="${id}"]`).parentNode.previousElementSibling;
  const options = target.textContent.replace('select ', '').split(',').map((t) => t.trim());
  const limits = {};
  options.forEach((option) => {
    const limit = Number(option.match(/\d+/)[0]);
    const text = option.replace(limit, '').trim();
    limits[text] = limit;
  });
  return limits;
}

function getCarouselSum(carousel) {
  const allVals = [...carousel.querySelectorAll('.customize-item-quantity')].map((v) => Number(v.textContent));
  return allVals.reduce((a, b) => a + b);
}

function validateLimit(limit, carousel) {
  const sum = getCarouselSum(carousel);
  return sum < limit;
}

function updateCounter(carousel) {
  const counter = carousel.querySelector('.carousel-head-count');
  counter.textContent = getCarouselSum(carousel);
}

function customizeBtn(e) {
  const op = e.target.getAttribute('data-op');
  const wrapper = e.target.closest('.customize-btn-wrapper');
  const carousel = e.target.closest('.carousel');
  const slide = e.target.closest('.carousel-slide');
  if (op && wrapper && carousel && slide) {
    const limit = carousel.getAttribute('data-limit');
    const valid = validateLimit(limit, carousel);
    if (!valid) {
      carousel.setAttribute('data-limit-hit', true);
    } else {
      carousel.removeAttribute('data-limit-hit');
    }
    const currentEl = wrapper.querySelector('.customize-item-quantity');
    const currentVal = Number(currentEl.textContent);
    if (op === 'plus' && valid) {
      currentEl.textContent = currentVal + 1;
      slide.setAttribute('data-mod-selected', true);
      updateCounter(carousel);
      const stillValid = validateLimit(limit, carousel);
      if (!stillValid) {
        carousel.setAttribute('data-limit-hit', true);
      }
    } else if (op === 'minus' && currentVal > 0) {
      currentEl.textContent = currentVal - 1;
      if (currentVal - 1 === 0) {
        slide.removeAttribute('data-mod-selected');
      }
      updateCounter(carousel);
      carousel.removeAttribute('data-limit-hit');
    }
  }
}

function buildMinus() {
  const btn = createEl('span', {
    class: 'customize-btn customize-minus',
    'data-op': 'minus',
    text: '-',
    title: 'remove item from pack',
  });
  btn.addEventListener('click', customizeBtn);
  return btn;
}

function buildPlus() {
  const btn = createEl('span', {
    class: 'customize-btn customize-plus',
    'data-op': 'plus',
    text: '+',
    title: 'add another item to pack',
  });
  btn.addEventListener('click', customizeBtn);
  return btn;
}

function buildShippingBtns(carousel) {
  const type = carousel.getAttribute('data-item-type');
  const slides = carousel.querySelectorAll('.carousel-slide');
  slides.forEach((slide) => {
    const id = slide.getAttribute('data-mod-id');
    const wrapper = createEl('div', {
      class: 'customize-btn-wrapper',
      'data-item-type': type,
    });
    const minusBtn = buildMinus();
    const plusBtn = buildPlus();
    const quantity = createEl('span', {
      class: 'customize-item-quantity',
      text: 0,
      'data-mod-id': id,
    });
    wrapper.append(minusBtn, quantity, plusBtn);
    slide.append(wrapper);
  });
}

function buildHeadCounter(carousel, limit) {
  const head = carousel.querySelector('.carousel-head > div');
  const counter = createEl('p', {
    class: 'carousel-head-counter',
    html: `<span class="carousel-head-count">0</span>/${limit}`,
  });
  head.append(counter);
}

export async function populateShippingBody(item) {
  clearCustomizeBody();
  const body = document.querySelector('.customize .customize-body');
  if (body) {
    const limits = getLimits(item.id);
    const catalog = await fetchCatalog();
    const menu = await fetchMenu();
    const data = item.item_data;
    const { name, variations } = data;
    body.setAttribute('data-name', toClassName(name));
    body.setAttribute('data-id', variations[0].id);
    const mods = data.modifier_list_info;
    mods.forEach(async (mod) => { // loop through pack options
      const modCat = catalog.byId[mod.modifier_list_id];
      const modName = modCat.modifier_list_data.name.replace('SHIPPING', '').trim();
      const modNameSingle = modName.substring(0, modName.length - 1);
      // build carousel title row
      const wrapper = createEl('div');
      const h2 = createEl('div', {
        html: `<div><h2>select ${limits[modName]} ${modName}</h2></div>`,
      });
      wrapper.append(h2);
      // populate elems for buildBlock
      const elems = [wrapper.outerHTML];
      const catMods = modCat.modifier_list_data.modifiers;
      catMods.forEach((i) => { // loop through option items
        const iName = i.modifier_data.name;
        const match = menu.find((m) => {
          if ((m.name === iName && m.type === modNameSingle) || `${m.name} ${m.type}` === iName) {
            return m;
          }
          return false;
        });
        if (match) {
          // build slide for item
          const slideWrapper = createEl('div');
          const slide = createEl('div', {
            'data-mod-id': i.id,
            'data-mod-name': toClassName(iName),
          });
          const img = createEl('p', {
            html: `<picture>
              <img src=${match.image} alt="${match.name} ${match.type}" />
            </picture>`,
          });
          const h3 = createEl('h3', {
            id: toClassName(match.name),
            text: match.name,
          });
          if (match.allergies) {
            const allergies = match.allergies.split(',').map((a) => a.trim());
            allergies.forEach((a) => {
              const svg = createSVG(a);
              h3.append(svg);
            });
          }
          slide.append(img, h3);
          if (match.description) {
            const p = createEl('p', {
              text: match.description,
            });
            slide.append(p);
          }
          slideWrapper.append(slide);
          elems.push(slideWrapper.outerHTML);
        }
      });
      const block = buildBlock('carousel', { elems });
      const carousel = block.firstChild.firstChild;
      carousel.classList.add('carousel', 'block');
      carousel.setAttribute('data-block-name', 'carousel');
      carousel.setAttribute('data-item-type', modName);
      carousel.setAttribute('data-limit', limits[modName]);
      body.append(carousel);
      await loadBlock(carousel);
      buildHeadCounter(carousel, limits[modName]);
      buildShippingBtns(carousel);
    });
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

async function addShippingConfigToCart(data, form) {
  await setupCart();
  const fp = Object.keys(data).map((key) => data[key]);
  const vari = fp[0];
  const mods = fp.slice(1);
  const selectedMods = form.querySelectorAll('[data-mod-selected="true"]');
  const modData = {};
  selectedMods.forEach((mod) => {
    const id = mod.getAttribute('data-mod-id');
    const name = mod.querySelector('h3').textContent;
    const quantity = Number(mod.querySelector('.customize-item-quantity').textContent);
    modData[id] = {
      name,
      quantity,
    };
  });
  window.cart.addShippingModQuantities(vari, mods, modData);
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

function populateShippingFoot() {
  const foot = document.querySelector('.customize .customize-foot');
  if (foot) {
    const btn = foot.querySelector('a');
    if (btn) {
      btn.addEventListener('click', async () => {
        const form = document.querySelector('form.customize-body');
        const valid = validateShippingForm(form);
        if (valid) {
          const data = getShippingData(form);
          await addConfigToCart(data);
          await addShippingConfigToCart(data, form);
          hideCustomize();
        }
      });
    }
  }
}

export async function configItem(item) {
  const itemName = item.item_data.name.trim();
  populateCustomizeBasics(`customize your ${removeStoreFromString(itemName)}`, {
    text: 'add to cart',
  });
  await populateSquareBody(item);
  populateSquareFoot();
  showCustomize();
}

export async function configShippingItem(item) {
  buildScreensaver('prepping your pack options...');
  const itemName = item.item_data.name.trim();
  populateCustomizeBasics(`customize your ${removeStoreFromString(itemName)} pack`, {
    text: 'add to cart',
  });
  await populateShippingBody(item);
  populateShippingFoot();
  await showCustomize();
  removeScreensaver();
}

export async function addToCart(e) {
  const { target } = e;
  const id = target.getAttribute('data-id');
  if (id) {
    await setupCart;
    const catalog = await fetchCatalog();
    const obj = catalog.byId[id];
    if (obj.type === 'ITEM') {
      const SHIPPING_ID = '5AIFY5WMTNJLS5RBZAPWL4YJ';
      if (obj.item_data && obj.item_data.category_id === SHIPPING_ID) {
        configShippingItem(obj);
      } else if (
        obj.item_data.modifier_list_info
        || obj.item_data.variations.length > 1
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
  window.cart.setStore();
  await window.cart.load();
}

export function setupCartBtn() {
  updateCartItems();
  const cartBtn = document.querySelector('.header-cart');
  if (cartBtn && typeof cartBtn.onclick !== 'function') {
    cartBtn.classList.add('header-cart-fixed');
    cartBtn.addEventListener('click', async () => {
      if (cartBtn.textContent > 0) { // only open carts with items
        await updateCheckout();
        hidePaymentForm();
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
      amount.textContent = window.cart.totalItems();
    }
  }
}

function generateId(data) {
  const now = new Date().toISOString();
  const day = new Date().toString().substring(0, 1); // first char of today's date
  const a = data.name.substring(0, 1); // first char of name
  const b = data.email.match(/@./)[0].replace('@', day); // first char of email domain
  const c = now.match(/T[0-9]{1,}/)[0].replace('T', a); // digits from date
  const d = now.match(/[0-9]{1,}Z/)[0].replace('Z', b); // digits from time
  const e = navigator.userAgentData.platform.substring(0, 1); // first chart of user agent platform
  const id = `${c}${d}${e}`.toUpperCase().replace(/[^0-9a-z]/gi, 'N'); // replace nonalphanumeric with N
  return id;
}

export function getOrderCredentials(store) {
  if (store.store === 'store' || store.type === 'store') {
    window.location_id = '6EXJXZ644ND0E';
    return {
      name: store,
      endpoint: 'AKfycbwJ0dVqTMxEeQzgig0HjEMHnv7qnTEXOkU-Cx34fy2LBP2h25Gv-uddrhfb4EhtuJxs',
      location: '6EXJXZ644ND0E',
    };
  }
  if (store.store === 'lab' || store.type === 'lab') {
    window.location_id = '3HQZPV73H8BHM';
    return {
      name: store,
      endpoint: 'AKfycbzkoBbEjpuGjyC5OOKMSBoYhVJtHr41NJXib2JmvZoCirYCBdWjDUU8KJe836I80Ihk',
      location: '3HQZPV73H8BHM',
    };
  }
  if (store.store === 'shipping' || store.type === 'shipping') {
    window.location_id = 'WPBKJEG0HRQ9F';
    return {
      name: store,
      endpoint: 'AKfycbwvQgotisCVo9XpkhVstWXRonQsUx0zqP2ykikZLyMQuFTl4lIzK2KeKJU_0kgpNy_C7w',
      location: 'WPBKJEG0HRQ9F',
    };
  }
  if (store.store === 'pint club' && store.pint_type === 'monthly') {
    window.location_id = 'WPBKJEG0HRQ9F';
    return {
      name: store,
      endpoint: 'AKfycbxQSGSH3hT7vkujzXPVme2EN5Ux_DMczr67svPbcCw8aCcXeE_7TSYdgV5jRixaJEV5', // see admin.js, club
      location: 'WPBKJEG0HRQ9F',
    };
  }
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
  if (data.addr1) {
    params.address_line_1 = data.addr1;
  }
  if (data.addr2) {
    params.address_line_2 = data.addr2;
  }
  if (data.city) {
    params.city = data.city;
  }
  if (data.state) {
    params.state = data.state;
  }
  if (data.zip) {
    params.postal_code = data.zip;
  }
  if (data['pickup-time']) {
    params.pickup_at = data['pickup-time'];
  }
  if (data['delivery-date']) {
    params.delivery_at = data['delivery-date'];
  }
  if (data.discount) {
    const valid = await validateDiscount(data.discount.trim().toLowerCase());
    if (valid.name && valid.id) {
      params.discount_name = valid.name;
      params.discount = valid.id;
    }
  }
  params.reference_id = generateId(data);

  params.line_items = [];
  params.mod_qs = '';
  await setupCart();
  window.cart.line_items.forEach((li) => {
    const mods = li.mods.map((mod) => ({ catalog_object_id: mod }));
    const lineItem = {
      catalog_object_id: li.variation,
      quantity: li.quantity.toString(),
    };
    if (mods.length) { lineItem.modifiers = mods; }
    if (li.modQuantities) {
      Object.keys(li.modQuantities).forEach((id) => {
        if (li.modQuantities[id].quantity > 1) {
          params.mod_qs += `${li.modQuantities[id].quantity} ${li.modQuantities[id].name.replace('the ', '')},`;
        }
      });
    }
    params.line_items.push(lineItem);
  });
  // add shipping item to line items
  if (window.cart.checkShipping() && window.cart.shipping_item) {
    const si = window.cart.shipping_item;
    const mods = si.mods.map((mod) => ({ catalog_object_id: mod }));
    const shipItem = {
      catalog_object_id: si.variation,
      quantity: si.quantity.toString(),
    };
    if (mods.length) { shipItem.modifiers = mods; }
    params.line_items.push(shipItem);
  }
  // if no mod_qs, remove from params
  if (params.mod_qs === '') {
    delete params.mod_qs;
  }
  return params;
}

export async function submitOrder(data) {
  const params = await buildOrderParams(data);
  const qs = buildGQs(params);
  const cred = getOrderCredentials(window.cart.current_store);
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
