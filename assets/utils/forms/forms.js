/* eslint-disable import/no-cycle */
/* eslint-disable brace-style */
import {
  createEl,
  createSVG,
  fetchCatalog,
  fetchFormFields,
  getHoursOfOperation,
  getOpenStatus,
  loadCSS,
  toClassName,
} from '../../scripts/scripts.js';

import {
  formatMoney, setupCart,
} from '../square/square.js';

import {
  populateCheckoutTable,
} from '../../blocks/checkout/checkout.js';

function toggle(e) {
  const expanded = e.target.getAttribute('aria-expanded');
  if (expanded === 'true') {
    e.target.setAttribute('aria-expanded', false);
  } else {
    e.target.setAttribute('aria-expanded', true);
  }
}

function buildLabel(field, option) {
  let label;
  const bubble = createEl('span', {
    class: `form-${field.type}-bubble`,
  });
  if (field.type.includes('single')) { // single checkbox
    label = createEl('label', {
      class: `form-${field.type}-option`,
      for: (field.label.toString().includes(' ') ? toClassName(field.label) : field.label),
      html: field.label,
    });
    const optionEl = createEl('input', {
      class: `form-${field.type}-default`,
      id: (field.label.toString().includes(' ') ? toClassName(field.label) : field.label),
      name: field.title,
      type: 'checkbox',
    });
    optionEl.value = option;
    label.append(optionEl, bubble);
  } else { // all other radios & checkboxes
    label = createEl('label', {
      class: `form-${field.type}-option`,
      for: (option.toString().includes(' ') ? toClassName(option) : option),
      html: option,
    });
    const optionEl = createEl('input', {
      class: `form-${field.type}-default`,
      id: (option.toString().includes(' ') ? toClassName(option) : option),
      name: field.title,
      type: field.type,
    });
    optionEl.value = option;
    label.append(optionEl, bubble);
  }
  return label;
}

function buildSquareLabel(field, option) {
  const label = createEl('label', {
    class: `form-${field.type}-option`,
    for: (option.name.toString().includes(' ') ? toClassName(option.name) : option.name),
    text: option.price > 0 ? `${option.name} (+$${option.price})` : option.name,
  });
  const bubble = createEl('span', {
    class: `form-${field.type}-bubble`,
  });
  const optionEl = createEl('input', {
    class: `form-${field.type}-default`,
    id: (option.name.toString().includes(' ') ? toClassName(option.name) : option.name),
    name: field.title,
    type: field.type,
  });
  if (option.checked) {
    optionEl.checked = option.checked;
  }
  optionEl.value = option.id;
  label.append(optionEl, bubble);
  return label;
}

function buildBubble(field) {
  const fieldEl = createEl('div', {
    class: `form-${field.type}`,
    id: `${field.type}-${toClassName(field.title)}`,
  });
  const expanded = field.required || false;
  // setup title
  const title = createEl('h3', {
    role: 'button',
    'aria-expanded': expanded,
    text: field.label,
  });
  const arrow = createSVG('arrow-down');
  title.append(arrow);
  title.addEventListener('click', toggle);
  fieldEl.append(title);
  // setup options
  const optionsWrapper = createEl('div', {
    class: `form-${field.type}-wrapper`,
  });
  if (field.options && typeof field.options !== 'string') {
    field.options.forEach((option) => {
      const label = buildSquareLabel(field, option);
      optionsWrapper.append(label);
    });
  } else if (field.options && !field.options.startsWith('@')) {
    const options = field.options.split(',').map((o) => o.trim());
    options.forEach((option) => {
      // eslint-disable-next-line eqeqeq
      if (option == Number(option)) {
        // eslint-disable-next-line no-param-reassign
        option = Number(option);
      }
      const label = buildLabel(field, option);
      optionsWrapper.append(label);
    });
  } else {
    // eslint-disable-next-line no-console
    console.log('populate external options');
  }
  fieldEl.append(optionsWrapper);
  return fieldEl;
}

function selectSelected(e) {
  const { target } = e;
  target.classList.add('form-selected');
  target.removeEventListener('change', selectSelected);
}

async function getPickupTimes(selectedDay = new Date()) {
  const today = new Date();
  const todayStr = today.toString().split(' ').slice(0, 4).join(' ');
  const selectedStr = selectedDay.toString().split(' ').slice(0, 4).join(' ');
  let day = selectedDay.toString().toLowerCase().substring(0, 3);
  const hoursOfOperation = await getHoursOfOperation();
  let selectedDayOperation = hoursOfOperation[day];
  const openStatus = await getOpenStatus(day);
  let startTimeObj;
  if (openStatus.text.includes('before open') || (todayStr !== selectedStr)) { // before open
    startTimeObj = new Date(
      selectedDay.setHours(selectedDayOperation.open.hour, selectedDayOperation.open.minute, 0),
    );
  } else if (openStatus.open) { // store is open
    const currentMinutes = selectedDay.getMinutes();
    const startMinutes = Math.ceil(currentMinutes / 10) * 10;
    const diff = startMinutes - currentMinutes;
    startTimeObj = new Date(selectedDay.getTime() + diff * 60000);
  } else { // store is closed
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    day = tomorrow.toString().toLowerCase().substring(0, 3);
    selectedDayOperation = hoursOfOperation[day];
    startTimeObj = new Date(
      tomorrow.setHours(selectedDayOperation.open.hour, selectedDayOperation.open.minute, 0),
    );
  }
  const pickupTimes = [];
  const closeTimeObj = new Date(
    selectedDay.setHours(selectedDayOperation.close.hour, selectedDayOperation.close.minute, 0),
  );
  let currentTimeObj = new Date(startTimeObj.setSeconds(0, 0));

  while (currentTimeObj <= closeTimeObj) {
    const currentTimeHourFull = currentTimeObj.getHours(); // 24 hr time
    const currentTimeHour = currentTimeHourFull > 12
      ? currentTimeHourFull - 12 : currentTimeHourFull; // 12 hr time
    const currentTimeMinutes = currentTimeObj.getMinutes().toString().padStart(2, '0');
    const currentTimePeriod = currentTimeHourFull < 12 ? 'am' : 'pm';
    const currentTimePrint = `${currentTimeHour}:${currentTimeMinutes}${currentTimePeriod}`;
    pickupTimes.push({
      text: currentTimePrint,
      value: currentTimeObj.toISOString(),
    });
    currentTimeObj = new Date(currentTimeObj.getTime() + 10 * 60000); // add ten minutes
  }
  return pickupTimes;
}

async function getPickupDates() {
  const today = new Date();
  const now = today.toString().toLowerCase().substring(0, 3);
  const openStatus = await getOpenStatus(now);
  const pickupDays = [];
  if (openStatus.open || openStatus.text === 'before open') { // BEFORE CLOSE
    pickupDays.push({
      text: 'today',
      value: today.toISOString(),
    });
  }
  for (let i = 1; i < 8; i += 1) {
    const temp = new Date();
    const next = temp.setDate(today.getDate() + i);
    const nextObj = new Date(next);
    const nextDay = nextObj.toString().substring(0, 3).toLowerCase();
    const nextMonth = nextObj.getMonth() + 1;
    const nextDate = nextObj.getDate();
    const printedNext = ((i === 1) && openStatus.text !== 'after close')
      ? 'tomorrow' : `${nextDay} ${nextMonth}/${nextDate}`;
    pickupDays.push({
      text: printedNext,
      value: nextObj.toISOString(),
    });
  }
  return pickupDays;
}

async function updatePickupTimes(e) {
  const selectedDate = new Date(e.target.value);
  const pickupTimes = await getPickupTimes(selectedDate);
  const pickupDropdown = document.getElementById('pickup-time');
  if (pickupDropdown) {
    const options = [...pickupDropdown.querySelectorAll('option')];
    options.shift();
    // clear old options
    options.forEach((option) => {
      option.remove();
    });
    // replace with new options
    pickupTimes.forEach((time) => {
      const oEl = createEl('option', {
        text: time.text,
      });
      oEl.value = time.value;
      pickupDropdown.append(oEl);
    });
  }
}

export async function buildField(field) {
  let fieldEl;
  // radio & checkbox
  if (field.type === 'radio' || field.type === 'checkbox') {
    fieldEl = await buildBubble(field);
  }
  // single checkbox
  else if (field.type === 'checkbox-single') {
    fieldEl = createEl('div', {
      class: `form-${field.type}-wrapper`,
    });
    const label = buildLabel(field, field.options);
    fieldEl.append(label);
  }
  // select
  else if (field.type === 'select') {
    fieldEl = createEl('div', {
      class: 'form-select-wrapper',
    });
    const arrow = createSVG('arrow-down');
    fieldEl.prepend(arrow);
    const select = createEl(field.type, {
      class: 'form-select',
      id: toClassName(field.title),
      name: toClassName(field.title),
    });
    const option = createEl('option', {
      text: field.placeholder,
    });
    option.value = '';
    option.disabled = true;
    option.selected = true;
    option.hidden = true;
    select.append(option);
    if (field.options && !field.options.startsWith('@')) {
      const options = field.options.split(',').map((o) => o.trim());
      options.forEach((o) => {
        const oEl = createEl('option', {
          text: o,
        });
        oEl.value = o;
        select.append(oEl);
      });
    } else {
      let options;
      // select.innerHTML = ''; // remove default
      if (field.options === '@pickup dates') {
        options = await getPickupDates();
        fieldEl.addEventListener('change', async (e) => {
          updatePickupTimes(e);
        });
      } else if (field.options === '@pickup times') {
        options = await getPickupTimes();
      }
      if (options) {
        options.forEach((o) => {
          const oEl = createEl('option', {
            text: o.text,
          });
          oEl.value = o.value;
          select.append(oEl);
        });
      }
    }
    select.addEventListener('change', selectSelected);
    await fieldEl.append(select);
  }
  // all other input types
  else {
    fieldEl = createEl('input', {
      class: 'form-field',
      id: (field.title.toString().includes(' ') ? toClassName(field.title) : field.title),
      name: (field.title.toString().includes(' ') ? toClassName(field.title) : field.title),
      type: field.type || 'text',
      'data-category': field.category,
      'data-store': field.store || false,
    });
    if (field.placeholder) {
      fieldEl.placeholder = field.placeholder;
    }
    if (field.default) {
      fieldEl.value = field.default;
    }
    if (field.required) {
      fieldEl.required = field.required;
    }
  }
  return fieldEl;
}

export function cleanStr(str) {
  if (typeof str === 'string') {
    const clean = str
      .split(' ').join('') // remove spaces
      .toLowerCase()
      .replace(/[^0-9a-z]/gi, ''); // replace non alpha-numeric
    return clean;
  }
  return false;
}

export function validateForm(form) {
  const hidden = form.querySelectorAll('.form-field-hide');
  const required = form.querySelectorAll('[required]:not(.form-field-hide)');
  const radios = form.querySelectorAll('[type=radio]:not(.form-field-hide)');
  const selects = form.querySelectorAll('select');

  const invalidFieldsById = []; // inputs and selects go here
  const invalidRadiosByName = [];

  if (hidden) {
    hidden.forEach((h) => {
      h.required = false;
    });
  }

  if (required) {
    required.forEach((f) => {
      if (f.type === 'tel' && f.value !== '') {
        f.value = cleanStr(f.value);
      }
      if (!f.value.trim() || !f.checkValidity()) {
        invalidFieldsById.push(f.id);
      }
    });
  }
  if (radios) {
    const radiosByName = {};
    radios.forEach((r) => {
      if (radiosByName[r.name]) { // if property exists
        radiosByName[r.name].push(r.checked);
      } else { // if property does not exist
        radiosByName[r.name] = [r.checked];
      }
    });
    Object.keys(radiosByName).forEach((key) => {
      if (!radiosByName[key].includes(true)) {
        invalidRadiosByName.push(key);
      }
    });
  }
  if (selects) {
    selects.forEach((s) => {
      // ignore hidden selects
      if (![...s.parentNode.classList].includes('form-field-hide')) {
        if (s.value === '') {
          invalidFieldsById.push(s.id);
        }
      }
    });
  }
  const allInvalid = [...invalidFieldsById, ...invalidRadiosByName];

  if (allInvalid.length <= 0) {
    return true;
  }

  invalidFieldsById.forEach((id) => { // attach error msg on these fields
    const field = document.getElementById(id);
    field.classList.add('invalid-field');
  });

  invalidRadiosByName.forEach((name) => { // pop open dropdown with errors
    const radioGroup = document.querySelector(`[name=${name}]`)
      .parentNode.parentNode;
    const radioBtn = radioGroup.previousSibling;
    radioGroup.classList.add('invalid-field');
    const expanded = radioBtn.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      radioBtn.setAttribute('aria-expanded', true);
    }
  });

  setTimeout(() => {
    const invalids = document.querySelectorAll('.invalid-field');
    if (invalids) {
      invalids.forEach((i) => {
        i.classList.remove('invalid-field');
      });
    }
  }, 1000); // remove this class after the animation runs
  return false;
}

export function validateShippingForm(form) {
  const carousels = form.querySelectorAll('.carousel');
  let completePacks = 0;
  const incompletePacks = [];
  carousels.forEach((carousel) => {
    const limitHit = carousel.getAttribute('data-limit-hit');
    if (limitHit) {
      completePacks += 1;
    } else {
      incompletePacks.push(`.${[...carousel.classList].join('.')}`);
    }
  });
  // add invalid class
  incompletePacks.forEach((selector) => {
    const incomplete = document.querySelector(selector);
    const slides = incomplete.querySelector('.carousel-slides');
    slides.classList.add('invalid-field');
  });
  setTimeout(() => {
    const invalids = document.querySelectorAll('.invalid-field');
    if (invalids) {
      invalids.forEach((i) => {
        i.classList.remove('invalid-field');
      });
    }
  }, 1000); // remove this class after the animation runs
  return carousels.length === completePacks;
}

export async function validateDiscount(text) {
  const { discounts } = await fetchCatalog();
  const match = Object.keys(discounts).find((key) => {
    if (key.toLowerCase() === text.trim().toLowerCase()) {
      return key;
    }
    return false;
  });
  return {
    name: match,
    id: discounts[match] ? discounts[match].id : null,
  };
}

export function getShippingData(form) {
  const data = {};
  const id = form.getAttribute('data-id');
  const name = form.getAttribute('data-name');
  data[name] = id;
  const selectedMods = form.querySelectorAll('[data-mod-selected="true"]');
  selectedMods.forEach((mod) => {
    const modId = mod.getAttribute('data-mod-id');
    const modName = mod.getAttribute('data-mod-name');
    data[modName] = modId;
  });
  return data;
}

export function getSubmissionData(form) {
  const fields = form.querySelectorAll('[name]'); // all named fields
  const data = {};
  if (fields) {
    fields.forEach((f) => {
      if (f.nodeName === 'SELECT') {
        data[f.name] = f.value;
      } else if (f.type === 'checkbox') {
        if (f.checked) { // only check checked checkbox (wow) options
          if (data[f.name]) { // if prop exists
            data[f.name].push(f.value);
          } else { // if prop DOES NOT exist
            data[f.name] = [f.value];
          }
        }
      } else if (f.type === 'radio') {
        if (f.checked) { // only add selected radio option
          data[f.name] = f.value;
        }
      } else if (f.value) { // exclude empty fields
        data[f.name] = f.value;
      }
    });
  }
  return data;
}

export function getFromLocalStorage(form) {
  const fieldsToStore = form.querySelectorAll('[data-store="true"]');
  if (fieldsToStore) {
    fieldsToStore.forEach((field) => {
      const thisItem = localStorage.getItem(`normal-${field.name}`);
      if (thisItem) {
        field.value = thisItem;
      }
    });
  }
}

export function saveToLocalStorage(form) {
  const fieldsToStore = form.querySelectorAll('[data-store="true"]');
  if (fieldsToStore) {
    fieldsToStore.forEach((field) => {
      if (field.value.trim() !== '') {
        localStorage.setItem(`normal-${field.name}`, field.value);
      }
    });
  }
}

function setTipValues(tip, options) {
  options.forEach((option) => {
    if (option.value) {
      const value = option.textContent.match(/[0-9]{1,}/);
      if (value) {
        // eslint-disable-next-line prefer-destructuring
        option.value = value[0];
      } else {
        option.value = 0;
      }
    }
  });
}

function updateTipAmount(tip) {
  const tipEl = document.querySelector('.checkout-foot-tip');
  const totalEl = document.querySelector('.checkout-foot-total');
  if (tipEl && totalEl) {
    const tipPercent = Number(tip.value) * 0.01;
    const totalAmount = Number(totalEl.getAttribute('data-original-total'));
    const tipAmount = totalAmount * tipPercent;
    const newTotal = totalAmount + tipAmount;
    tipEl.textContent = `$${formatMoney(tipAmount)}`;
    tipEl.setAttribute('data-total', Math.trunc(tipAmount));
    totalEl.textContent = `$${formatMoney(newTotal)}`;
    totalEl.setAttribute('data-total', Math.trunc(newTotal));
  }
}

function setDefaulTip(tip, options) {
  let defaultVal = 0;
  options.forEach((option) => {
    if (!option.value) {
      [defaultVal] = option.textContent.match(/[0-9]{1,}/);
    } else if (option.value === defaultVal) {
      option.selected = true;
      tip.classList.add('form-selected');
      updateTipAmount(tip);
    }
  });
}

function setupTipField() {
  const tip = document.getElementById('tip');
  if (tip) {
    const options = tip.querySelectorAll('option');
    if (options) {
      setTipValues(tip, options);
      tip.addEventListener('change', (e) => {
        updateTipAmount(e.target);
      });
      setDefaulTip(tip, options);
    }
  }
}

function togglePaymentView(cardView = true) {
  const giftCardWrapper = document.getElementById('gift-card-container');
  const giftCardBtn = document.getElementById('gift-card-button');
  const cardWrapper = document.getElementById('card-container');
  const cardBtn = document.getElementById('card-button');
  if (giftCardWrapper && giftCardBtn && cardWrapper && cardBtn) {
    if (cardView) {
      // hide gift card, show card
      giftCardWrapper.classList.remove('payment-hide');
      giftCardBtn.classList.remove('payment-hide');
      cardWrapper.classList.add('payment-hide');
      cardBtn.classList.add('payment-hide');
    } else {
      // hide card, show gift card
      cardWrapper.classList.remove('payment-hide');
      cardBtn.classList.remove('payment-hide');
      giftCardWrapper.classList.add('payment-hide');
      giftCardBtn.classList.add('payment-hide');
    }
  }
}

function setupGiftCardField() {
  const card = document.getElementById('pay-with-gift-card-');
  if (card) {
    togglePaymentView(card.checked);
    card.addEventListener('change', (e) => {
      togglePaymentView(e.target.checked);
    });
  }
}

export async function setupDiscountField() {
  const discount = document.getElementById('discount');
  if (discount) {
    discount.addEventListener('input', async (e) => {
      const match = await validateDiscount(e.target.value);
      if (match && match.name) {
        const check = createEl('aside', {
          class: 'discount-valid',
          text: '👍',
          title: 'valid discount!',
        });
        discount.after(check);
        discount.setAttribute('data-discount', match.id);
      } else {
        discount.removeAttribute('data-discount');
        const check = document.querySelector('aside.discount-valid');
        if (check) { check.remove(); }
      }
    });
  }
}

function markItemsAsShipped(lis) {
  lis.forEach((li) => {
    window.cart.setShipping(li.variation, li.mods);
  });
}

function unmarkItemsAsShipped(lis) {
  lis.forEach((li) => {
    window.cart.unsetShipping(li.variation, li.mods);
  });
}

async function toggleMerchShipView(checked = true) {
  const addressInfo = document.querySelectorAll('input[data-category="address"');
  const pickupInfo = document.querySelectorAll('[name^="pickup"]');
  await setupCart();
  const SHIPPING_VARI_ID = 'X3E6SVSEI2JPN3HGOW3LEQVK';
  if (!checked) {
    // remove shipping from cart
    window.cart.removeShipping();
    unmarkItemsAsShipped(window.cart.line_items);
    window.cart.setStoreParams({ type: 'store' });
    // update view
    await populateCheckoutTable();
    pickupInfo.forEach((field) => {
      field.parentNode.classList.remove('form-field-hide');
      field.required = true;
    });
    addressInfo.forEach((field) => {
      field.classList.add('form-field-hide');
      field.value = '';
      field.required = false;
    });
  } else {
    // add shipping to cart
    await window.cart.addShipping(SHIPPING_VARI_ID);
    markItemsAsShipped(window.cart.line_items);
    window.cart.setStoreParams({ type: 'shipping' });
    // update view
    await populateCheckoutTable();
    pickupInfo.forEach((field) => {
      field.parentNode.classList.add('form-field-hide');
      field.value = '';
      field.required = false;
    });
    addressInfo.forEach((field) => {
      field.classList.remove('form-field-hide');
      if (field.id !== 'addr2') { field.required = true; }
    });
    getFromLocalStorage(addressInfo[0].parentElement);
  }
}

export function setupMerchShipField() {
  const merchShip = document.getElementById('get-it-shipped-');
  if (merchShip) {
    toggleMerchShipView(merchShip.checked);
    merchShip.addEventListener('change', async (e) => {
      toggleMerchShipView(e.target.checked);
    });
  }
}

export async function buildPaymentForm(categories) {
  const foot = document.querySelector('.checkout .checkout-foot');
  foot.innerHTML = '';
  const allFields = await fetchFormFields();
  const form = createEl('form', {
    id: 'payment-form',
  });
  const allCategories = Object.keys(allFields);
  categories.forEach((cat) => {
    if (allCategories.includes(cat)) {
      allFields[cat].forEach(async (c) => {
        const field = await buildField(c);
        await form.append(field);
      });
    }
  });
  const giftCard = createEl('div', {
    id: 'gift-card-container',
  });
  const gcBtn = createEl('button', {
    id: 'gift-card-button',
    class: 'btn btn-rect',
    type: 'button',
    text: 'pay with gift card',
  });
  const card = createEl('div', {
    id: 'card-container',
  });
  const cBtn = createEl('button', {
    id: 'card-button',
    class: 'btn btn-rect',
    type: 'button',
    text: 'pay with card',
  });
  form.append(giftCard, gcBtn, card, cBtn);
  const status = createEl('div', {
    id: 'payment-status-container',
  });
  await foot.append(form, status);
  const payment = 'payment';
  try {
    const mod = await import(`/assets/utils/${payment}/${payment}.js`);
    if (mod.default) {
      await mod.default(document.querySelector('main'), payment, document);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`failed to load module for ${payment}`, err);
  }
  loadCSS('/assets/utils/payment/payment.css');
  setupTipField();
  setupGiftCardField();
}

export async function buildSquareForm(form, items) {
  items.forEach(async (item) => {
    const field = await buildField(item);
    await form.append(field);
  });
}

export async function buildForm(form, categories) {
  const allFields = await fetchFormFields();
  const allCategories = Object.keys(allFields);
  categories.forEach((cat) => {
    if (allCategories.includes(cat)) {
      allFields[cat].forEach(async (c) => {
        const field = await buildField(c);
        await form.append(field);
      });
    }
  });
}
