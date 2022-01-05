/* eslint-disable import/no-cycle */
/* eslint-disable no-use-before-define */
import {
  createEl,
  createSVG,
  fetchCatalog,
  fetchLabels,
  getCurrentStore,
  noScroll,
} from '../../scripts/scripts.js';

import {
  formatMoney,
  setupCart,
  removeStoreFromString,
  submitOrder,
  updateCartItems,
} from '../../utils/square/square.js';

import {
  buildForm,
  buildPaymentForm,
  getFromLocalStorage,
  getSubmissionData,
  saveToLocalStorage,
  setupDiscountField,
  setupMerchShipField,
  validateForm,
} from '../../utils/forms/forms.js';

import {
  buildScreensaver,
  makeScreensaverError,
  removeScreensaver,
} from '../../utils/screensaver/screensaver.js';

export function clearCheckoutTable() {
  const body = document.querySelector('.checkout .checkout-table .checkout-table-body');
  if (body) {
    body.innerHTML = '';
  }
  const foot = document.querySelector('.checkout .checkout-table .checkout-table-foot');
  if (foot) {
    foot.innerHTML = '';
  }
}

async function checkoutBtn(e) {
  const op = e.target.closest('.checkout-btn').getAttribute('data-op');
  const fp = e.target.closest('tr').getAttribute('data-fp');
  const item = window.cart.line_items.find((li) => fp === li.fp);
  if (op) {
    await setupCart();
    if (op === 'plus') {
      window.cart.setQuantity(fp, item.quantity + 1);
    } else if (op === 'minus') {
      window.cart.setQuantity(fp, item.quantity - 1);
      if (item.quantity < 1) {
        window.cart.remove(fp);
      }
    }
    await populateCheckoutTable();
    updateCartItems();
  }
}

function buildMinus() {
  const btn = createEl('span', {
    class: 'checkout-btn checkout-minus',
    'data-op': 'minus',
    text: '-',
    title: 'remove item from cart',
  });
  btn.addEventListener('click', checkoutBtn);
  return btn;
}

function buildPlus() {
  const btn = createEl('span', {
    class: 'checkout-btn checkout-plus',
    'data-op': 'plus',
    text: '+',
    title: 'add another item to cart',
  });
  btn.addEventListener('click', checkoutBtn);
  return btn;
}

export function disableCartEdits() {
  const cartBtns = document.querySelectorAll('.checkout-btn');
  if (cartBtns) {
    cartBtns.forEach((btn) => {
      btn.remove();
    });
  }
  const total = document.querySelector('.checkout-foot-total');
  if (total) {
    total.parentNode.classList.add('checkout-total-highlight');
  }
}

export async function populateCheckoutTable() {
  clearCheckoutTable();
  const table = document.querySelector('.checkout .checkout-table');
  if (table) {
    await setupCart();
    const body = table.querySelector('.checkout-table-body');
    const foot = table.querySelector('.checkout-table-foot');
    if (body && foot) {
      const catalog = await fetchCatalog();
      const lis = window.cart.line_items;
      if (lis && lis.length > 0) {
        // build line items
        lis.forEach((li) => {
          if (li.quantity > 0) {
            // containing row
            const tr = createEl('tr', {
              'data-fp': li.fp,
            });
            // quantity
            const plus = buildPlus();
            const minus = buildMinus();
            const tdq = createEl('td', {
              class: 'checkout-table-body-quantity',
              html: `<span class="checkout-quantity">${li.quantity}</span>`,
            });
            if (getCurrentStore() !== 'pint club') {
              tdq.prepend(plus);
              tdq.append(minus);
            }
            // item
            const vari = catalog.byId[li.variation];
            const variName = vari.item_variation_data.name; // for use with mods
            const itemName = catalog.byId[vari.item_variation_data.item_id].item_data.name;
            const mods = li.mods.map((m) => catalog.byId[m].modifier_data.name);
            // write item description
            let itemDesc;
            if (li.clubDetails) { // pint club details
              const d = li.clubDetails;
              itemDesc = `<span data-type="${d.type}">${d.type}</span>`;
              if (d['customize-pints']) {
                itemDesc = '';
                d['customize-pints'].forEach((p) => {
                  itemDesc += `${p}, `;
                });
                itemDesc = itemDesc.substring(0, itemDesc.length - 2);
                itemDesc += ` <span data-customize="${d['customize-pints'].join(',')}">
                  ${itemName}
                </span>`;
              } else {
                itemDesc += ` ${itemName}`;
              }
              if (d.method) {
                itemDesc += ` <span data-method="${d.method}">${d.method}`;
              }
              if (!d['gift-option'] && d.method === 'shipping') {
                itemDesc += ` to <span 
                data-addr1="${d.addr1}" 
                data-addr2="${d.addr2 || ''}" 
                data-city="${d.city}" 
                data-state="${d.state}" 
                data-zip="${d.zip}">
                  ${d.addr1}
                </span>`;
              }
              if (d['gift-option'] && d.method === 'pickup') {
                itemDesc += ` gift for <span 
                  data-recipient-name="${d['recipient-name']}" 
                  data-recipient-email="${d['recipient-email']}" 
                  data-recipient-cell="${d['recipient-cell']}">
                    ${d['recipient-name']}
                  </span>`;
              } else if (d['gift-option'] && d.method === 'shipping') {
                itemDesc += ` gift for <span 
                  data-recipient-name="${d['recipient-name']}" 
                  data-recipient-email="${d['recipient-email']}" 
                  data-recipient-cell="${d['recipient-cell']}">
                    ${d['recipient-name']}
                  </span> at <span 
                    data-addr1="${d.addr1}" 
                    data-addr2="${d.addr2 || ''}" 
                    data-city="${d.city}" 
                    data-state="${d.state}" 
                    data-zip="${d.zip}">
                      ${d.addr1}
                    </span>`;
              }
              if (d['prepay-months']) {
                itemDesc += `, <span data-term="${d['prepay-months']}">${d['prepay-months']}</span> months`;
              }
              if (d.allergies) {
                itemDesc += ` (<span data-allergy="${d.allergies}">${d.allergies} allergy</span>)`;
              }
            } else if (li.modQuantities) { // shipping mod quantities
              itemDesc = removeStoreFromString(itemName);
              Object.keys(li.modQuantities).forEach((id) => {
                itemDesc += `, <span data-mod-id="${id}"data-mod-name="${li.modQuantities[id].name}"data-mod-quantity="${li.modQuantities[id].quantity}">${li.modQuantities[id].name} (×${li.modQuantities[id].quantity})</span>`;
              });
            } else if (mods.length >= 1 && (variName === removeStoreFromString(itemName))) {
              itemDesc = `${variName}, ${mods.join(', ')}`;
            } else if (mods.length >= 1) {
              itemDesc = `${variName} ${removeStoreFromString(itemName)}, ${mods.join(', ')}`;
            } else {
              itemDesc = itemName;
            }
            const tdi = createEl('td', {
              class: 'checkout-table-body-item',
              html: itemDesc,
            });
            // price
            const tdp = createEl('td', {
              class: 'checkout-table-body-price',
              text: `$${formatMoney(li.price * li.quantity)}`,
            });
            tr.append(tdq, tdi, tdp);
            body.append(tr);
          }
        });
        const isShipped = window.cart.checkShipping();
        if (isShipped) {
          const si = window.cart.shipping_item;
          const tr = createEl('tr', {
            'data-fp': si.fp,
          });
          const tdq = createEl('td', {
            class: 'checkout-table-shipping-quantity',
            html: `<span class="checkout-shipping-quantity">${si.quantity}</span>`,
          });
          const tdi = createEl('td', {
            class: 'checkout-table-body-item',
            html: `${catalog.byId[si.variation].item_variation_data.name} shipping + handling`,
          });
          // price
          const tdp = createEl('td', {
            class: 'checkout-table-body-price',
            text: `$${formatMoney(si.price * si.quantity)}`,
          });
          tr.append(tdq, tdi, tdp);
          body.append(tr);
        }
        // build total row
        const tr = createEl('tr');
        // total label
        const tdt = createEl('td', {
          colspan: 2,
          text: 'total',
        });
        // total amount
        const total = isShipped ? window.cart.totalAmountShipped() : window.cart.totalAmount();
        const tda = createEl('td', {
          class: 'checkout-foot-total',
          text: `$${formatMoney(total)}`,
        });
        tr.append(tdt, tda);
        foot.append(tr);
      } else {
        // nothing in cart
        const labels = await fetchLabels();
        const tr = createEl('tr');
        const tre = createEl('td', {
          class: 'checkout-cart-empty',
          colspan: 3,
          text: labels.cart_empty,
        });
        tr.append(tre);
        body.append(tr);
        // hide checkout form
        hideCheckoutForm();
        const coFoot = document.querySelector('.checkout .checkout-foot');
        if (coFoot) {
          resetCheckoutFootBtn();
          const a = coFoot.querySelector('a');
          if (a) {
            a.textContent = 'place order';
            a.classList.add('btn-disable');
          }
        }
      }
    }
  }
  return true;
}

// function updateCheckoutTable(order, data) { // may use data in future
function updateCheckoutTable(order) {
  resetCheckoutFootBtn();
  const tFoot = document.querySelector('.checkout .checkout-table-foot');
  if (tFoot) {
    tFoot.setAttribute('data-ref', order.reference_id);
    tFoot.setAttribute('data-id', order.id);
    // tip
    const tipTR = createEl('tr');
    const tipLabel = createEl('td', {
      colspan: 2,
      text: 'tip',
    });
    const tipValue = createEl('td', {
      class: 'checkout-foot-tip',
      text: `$${formatMoney(0)}`,
    });
    tipTR.append(tipLabel, tipValue);
    tFoot.prepend(tipTR);
    // tax
    if (order.total_tax_money) {
      const taxTR = createEl('tr');
      const taxLabel = createEl('td', {
        colspan: 2,
        text: 'prepared food tax (included)',
      });
      const taxValue = createEl('td', {
        class: 'checkout-foot-tax',
        text: `$${formatMoney(order.total_tax_money.amount)}`,
      });
      taxTR.append(taxLabel, taxValue);
      tFoot.prepend(taxTR);
    }
    // discount
    if (order.discounts && order.total_discount_money) {
      const discountTR = createEl('tr');
      const discountLabel = createEl('td', {
        colspan: 2,
        text: `applied discount (${order.discounts[0].name})`,
      });
      const discountValue = createEl('td', {
        class: 'checkout-foot-discount',
        text: `-$${formatMoney(order.total_discount_money.amount)}`,
      });
      discountTR.append(discountLabel, discountValue);
      tFoot.prepend(discountTR);
    }
    // total
    const total = tFoot.querySelector('.checkout-foot-total');
    total.setAttribute('data-original-total', order.total_money.amount);
    total.setAttribute('data-total', order.total_money.amount);
    total.textContent = `$${formatMoney(order.total_money.amount)}`;
  }
}

export function hideCheckout() {
  const checkout = document.querySelector('.checkout-container');
  if (checkout) {
    checkout.setAttribute('aria-expanded', false);
    document.querySelector('body').classList.remove('no-scroll');
    window.removeEventListener('scroll', noScroll);
    clearCheckoutFoot();
    updateCheckout();
  }
}

function showCheckoutForm() {
  const form = document.querySelector('form.checkout-form');
  if (form) {
    form.classList.remove('form-hide');
  }
}

export function hideCheckoutForm() {
  const form = document.querySelector('form.checkout-form');
  if (form) {
    form.classList.add('form-hide');
  }
}

export function resetCheckoutFootBtn() {
  const footDiv = document.querySelector('.checkout .checkout-foot');
  if (footDiv) {
    // clear foot, replace with order btn
    footDiv.innerHTML = '';
    const a = createEl('a', {
      class: 'btn btn-rect',
    });
    footDiv.append(a);
  }
}

export function clearCheckoutFoot() {
  const form = document.querySelector('.checkout .checkout-form');
  const paymentStatus = document.getElementById('payment-status-container');
  const successMessage = document.querySelector('.payment-success-message');
  if (form) {
    const paymentForm = document.getElementById('payment-form');
    if (!paymentForm) {
      // redisplay checkout form
      showCheckoutForm();
    }
  }
  if (paymentStatus) {
    paymentStatus.remove();
  }
  if (successMessage) {
    successMessage.remove();
  }
}

export function populateCheckoutFoot(btnText = 'place order') {
  resetCheckoutFootBtn();
  const foot = document.querySelector('.checkout .checkout-foot');
  if (foot) {
    const a = foot.querySelector('a');
    if (a) {
      a.textContent = btnText;
      a.addEventListener('click', async () => {
        const form = document.querySelector('form.checkout-form');
        const valid = validateForm(form);
        if (valid) {
          buildScreensaver(`placing your ${getCurrentStore()} order...`);
          const data = getSubmissionData(form);
          saveToLocalStorage(form);
          const order = await submitOrder(data);
          if (order) {
            await disableCartEdits();
            await hideCheckoutForm();
            await updateCheckoutTable(order, data);
            await buildPaymentForm(['tip', 'payment']);
            removeScreensaver();
          } else {
            makeScreensaverError('something went wrong and your order didn\'t go through. try again?');
          }
        }
      });
    }
  }
}

export async function updateCheckout() {
  const checkout = document.querySelector('.checkout-container');
  if (checkout) {
    await populateCheckoutTable();
    await populateCheckoutFoot();
  }
}

export function showCheckout() {
  const checkout = document.querySelector('.checkout-container');
  if (checkout) {
    checkout.setAttribute('aria-expanded', true);
    document.querySelector('body').classList.add('no-scroll');
    window.addEventListener('scroll', noScroll);
    const form = checkout.querySelector('.checkout-form');
    if (form) {
      form.classList.remove('form-hide');
    }
  }
}

export function populateCheckoutBasics(title, btnInfo) {
  // clearCheckoutBasics();
  const checkout = document.querySelector('.checkout');
  if (checkout) {
    const h2 = checkout.querySelector('.checkout-head h2');
    h2.textContent = title;
    const a = checkout.querySelector('.checkout-foot a');
    a.textContent = btnInfo.text;
  }
}

export default async function decorateCheckout(block) {
  const wrapper = block.firstChild.firstChild;
  const btn = wrapper.querySelector('.btn-back');
  const store = getCurrentStore();
  if (!btn) {
    const newBtn = createEl('aside', {
      class: 'btn btn-back',
      text: `back to ${store}`,
    });
    const arrow = createSVG('arrow-left');
    newBtn.append(arrow);
    newBtn.addEventListener('click', hideCheckout);
    wrapper.prepend(newBtn);
  } else {
    btn.textContent = `back to ${store}`;
    const arrow = createSVG('arrow-left');
    btn.addEventListener('click', hideCheckout);
    btn.append(arrow);
  }
  const head = wrapper.querySelector('.checkout-head');
  if (!head) {
    const newHead = createEl('div', {
      class: 'checkout-head',
      html: `<h2>your ${store} order</h2>`,
    });
    wrapper.append(newHead);
  } else {
    const h2 = head.querySelector('h2');
    h2.textContent = `your ${store} order`;
  }
  const table = wrapper.querySelector('.checkout-table');
  if (!table) {
    const newTable = createEl('table', {
      class: 'checkout-table',
    });
    const tableBody = createEl('tbody', {
      class: 'checkout-table-body',
    });
    const tableFoot = createEl('tfoot', {
      class: 'checkout-table-foot',
    });
    newTable.append(tableBody, tableFoot);
    wrapper.append(newTable);
  }
  const form = wrapper.querySelector('.checkout-form');
  const formFields = ['contact', 'discount'];
  if (store === 'shipping') {
    formFields.push('address');
  } else {
    formFields.push('pickup');
  }
  if (store === 'merch') {
    formFields.push('merch-ship', 'address');
  }
  if (!form) {
    const newForm = createEl('form', {
      class: 'checkout-form',
    });
    wrapper.append(newForm);
    await buildForm(newForm, formFields);
    getFromLocalStorage(newForm);
    await setupDiscountField();
    await setupMerchShipField();
  } else {
    await buildForm(form, formFields);
    getFromLocalStorage(form);
    await setupDiscountField();
    await setupMerchShipField();
  }
  const foot = wrapper.querySelector('.checkout-foot');
  if (!foot) {
    const newFoot = createEl('div', {
      class: 'checkout-foot',
      html: '<a class="btn btn-rect"></a>',
    });
    wrapper.append(newFoot);
  }
}
