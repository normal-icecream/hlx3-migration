/* eslint-disable no-use-before-define */
import {
  createEl,
  createSVG,
  fetchCatalog,
  getCurrentStore,
  noScroll,
} from '../../scripts/scripts.js';

// eslint-disable-next-line import/no-cycle
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
  getContactFromLocalStorage,
  getSubmissionData,
  saveToLocalStorage,
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

function disableCartEdits() {
  const cartBtns = document.querySelectorAll('.checkout-btn');
  if (cartBtns) {
    cartBtns.forEach((btn) => {
      btn.remove();
    });
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
            tdq.prepend(plus);
            tdq.append(minus);
            // item
            const vari = catalog.byId[li.variation];
            const variName = vari.item_variation_data.name; // for use with mods
            const itemName = catalog.byId[vari.item_variation_data.item_id].item_data.name;
            const mods = li.mods.map((m) => catalog.byId[m].modifier_data.name);
            let itemText;
            if (mods.length >= 1 && (variName === removeStoreFromString(itemName))) {
              itemText = `${variName}, ${mods.join(', ')}`;
            } else if (mods.length >= 1) {
              itemText = `${variName} ${removeStoreFromString(itemName)}, ${mods.join(', ')}`;
            } else {
              itemText = itemName;
            }
            const tdi = createEl('td', {
              class: 'checkout-table-body-item',
              text: itemText,
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
        // build total row
        const tr = createEl('tr');
        // total label
        const tdt = createEl('td', {
          colspan: 2,
          text: 'total',
        });
        // total amount
        const tda = createEl('td', {
          class: 'checkout-foot-total',
          text: `$${formatMoney(window.cart.totalAmount())}`,
        });
        tr.append(tdt, tda);
        foot.append(tr);
      }
    }
  }
  return true;
}

function updateCheckoutTable(order, data) {
  clearCheckoutFoot();
  const tFoot = document.querySelector('.checkout .checkout-table-foot');
  if (tFoot) {
    console.log(order);
    // TODO: discount
    // console.log('discount:', order.total_discount_money.amount);

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

    // total
    console.log('   total:', order.total_money.amount);
    const total = tFoot.querySelector('.checkout-foot-total');
    total.setAttribute('data-total', order.total_money.amount);
    total.textContent = `$${formatMoney(order.total_money.amount)}`;
  }
}

// const displayOrderObjInfo = (orderObj, formData) => {
//   // DISCOUNT INFO
//   const discountName = document.querySelector("#discount").value;
//   const $discountRow = document.createElement("tr");

//   if (discountName && orderObj.total_discount_money.amount > 0) {

//     const $discountTitle = document.createElement("td");
//       $discountTitle.colSpan = 2;
//       $discountTitle.textContent = `${discountName.split("-").join(" ")} (discount)`;

//     const $discountAmount = document.createElement("td");
//       $discountAmount.id = "checkout-foot-discount";
//       $discountAmount.textContent = `- $${formatMoney(orderObj.total_discount_money.amount)}`;

//     $discountRow.append($discountTitle, $discountAmount);

//   }

//   // TAX INFO
//   const $taxRow = document.createElement("tr");

//   const $taxTitle = document.createElement("td");
//     $taxTitle.colSpan = 2;
//     $taxTitle.textContent = "prepared food tax (included)";

//   const $taxAmount = document.createElement("td");
//     $taxAmount.id = "checkout-foot-tax";
//     $taxAmount.textContent = `$${formatMoney(orderObj.total_tax_money.amount)}`;

//   $taxRow.append($taxTitle, $taxAmount);

//   // TIP INFO
//   const $tipRow = document.createElement("tr");

//   const $tipTitle = document.createElement("td");
//     $tipTitle.colSpan = 2;
//     $tipTitle.textContent = "tip";

//   const $tipAmount = document.createElement("td");
//     $tipAmount.id = "checkout-foot-tip";
//     $tipAmount.textContent = `$${formatMoney(0)}`;

//   $tipRow.append($tipTitle, $tipAmount);

//   // TOTAL ROW
//   const $totalRow = document.createElement("tr");
//     $totalRow.classList.add("highlight");

//   const $totalTitle = document.createElement("td");
//     $totalTitle.colSpan = 2;
//     $totalTitle.textContent = "total";

//   const $totalAmount = document.createElement("td");
//     $totalAmount.id = "checkout-foot-total";
//     $totalAmount.setAttribute("data-total", orderObj.total_money.amount);
//     $totalAmount.textContent = `$${formatMoney(orderObj.total_money.amount)}`;

//   $totalRow.append($totalTitle, $totalAmount);

//   //////////////////////////////////////////////////////////////
//   $checkoutTableFooter.prepend($taxRow, $tipRow, $totalRow);
//   if (discountName && orderObj.total_discount_money.amount > 0) {
//     $checkoutTableFooter.prepend($discountRow);
//   }
// }

export function hideCheckout() {
  const checkout = document.querySelector('.checkout-container');
  if (checkout) {
    checkout.setAttribute('aria-expanded', false);
    document.querySelector('body').classList.remove('no-scroll');
    window.removeEventListener('scroll', noScroll);
  }
}

function hideCheckoutForm() {
  const form = document.querySelector('form.checkout-form');
  if (form) {
    form.classList.add('form-hide');
  }
}

export function clearCheckoutFoot() {
  const foot = document.querySelector('.checkout .checkout-foot a');
  if (foot) {
    foot.textContent = '';
    // remove event listeners
    const newBtn = foot.cloneNode(true);
    foot.parentNode.replaceChild(newBtn, foot);
  }
}

export function populateCheckoutFoot() {
  clearCheckoutFoot();
  const foot = document.querySelector('.checkout .checkout-foot');
  if (foot) {
    const a = foot.querySelector('a');
    if (a) {
      a.textContent = 'place order';
      a.addEventListener('click', async () => {
        const form = document.querySelector('form.checkout-form');
        const valid = validateForm(form);
        if (valid) {
          buildScreensaver(`submitting your ${getCurrentStore()} order...`);
          const data = getSubmissionData(form);
          saveToLocalStorage(form);
          const order = await submitOrder(data);
          if (order) {
            disableCartEdits();
            hideCheckoutForm();
            updateCheckoutTable(order, data);
            buildPaymentForm(['tip', 'payment']);
            // await displayOrderObjInfo(orderObj, formData);
            // await buildSquarePaymentForm();
            removeScreensaver();
          } else {
            makeScreensaverError("something went wrong and your order didn't go through. try again?")
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
  if (!form) {
    const newForm = createEl('form', {
      class: 'checkout-form',
    });
    wrapper.append(newForm);
    await buildForm(newForm, ['contact', 'pickup', 'discount']);
    getContactFromLocalStorage(newForm);
  } else {
    await buildForm(form, ['contact', 'pickup', 'discount']);
    getContactFromLocalStorage(form);
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
