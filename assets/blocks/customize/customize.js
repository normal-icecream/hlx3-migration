import {
  createEl,
  createSVG,
} from '../../scripts/scripts.js';

// import {
//   buildFields
// } from '../../scripts/forms.js';

// import {
//   buildShippingCarouselMenu
// } from '../carousel-menu/carousel-menu.js';

export function clearCustomizeBody() {
  const customize = document.querySelector('.customize');
  if (customize) {
    customize.querySelector('.customize-body').innerHTML = '';
  }
  // block.querySelector('.customize-body-form').innerHTML = '';
  // const btn = document.getElementById('customize-footer-btn');
  // btn.textContent = '';
  // // remove event listeners
  // const newBtn = btn.cloneNode(true);
  // btn.parentNode.replaceChild(newBtn, btn);
}

export function populateCustomizeBasics(title, btnInfo) {
  const customize = document.querySelector('.customize');
  if (customize) {
    const h2 = customize.querySelector('.customize-head h2');
    h2.textContent = title;
    const a = customize.querySelector('.customize-foot a');
    a.textContent = btnInfo.text;
  }
}

function noScroll() {
  window.scrollTo(0, 0);
}

export function showCustomize() {
  const customize = document.querySelector('.customize-container');
  if (customize) {
    customize.setAttribute('aria-expanded', true);
    document.querySelector('body').classList.add('no-scroll');
    window.addEventListener('scroll', noScroll);
  }
}

export function hideCustomize() {
  const customize = document.querySelector('.customize-container');
  if (customize) {
    customize.setAttribute('aria-expanded', false);
    document.querySelector('body').classList.remove('no-scroll');
    window.removeEventListener('scroll', noScroll);
  }
}

export async function populateCustomizeMenu(text, item, path) {
  const data = item.item_data;
  const { id } = item;
  const { variations } = data;
  const modifiers = data.modifier_list_info;
  const quantities = document.querySelector(`a[data-id="${id}"]`)
    .parentElement.previousElementSibling
    .textContent.replace('select ', '').split(',');

  const customMenu = document.querySelector('.customize');

  const customHead = customMenu.querySelector('.customize-body-head');
  customHead.textContent = text;

  const customForm = customMenu.querySelector('.customize-body-form');
  customForm.innerHTML = ''; // clear on each populate

  if (variations && !path.includes('shipping')) {
    const variationFieldData = {
      type: 'radio',
      title: (data.name),
      required: true,
      options: [],
    };

    if (data.name.includes('soft serve')) {
      if (variations[0].item_variation_data.name.includes('size')) {
        variationFieldData.label = 'select your size';
      } else {
        variationFieldData.label = 'flavor (select 1)';
      }
    } else if (variations[0].item_variation_data.name.includes('oz') || variations[0].item_variation_data.name.includes('size')) {
      variationFieldData.label = 'select your size';
    } else if (variations[0].item_variation_data.name.includes('shot')) {
      variationFieldData.label = 'shots';
    } else if (variations[0].item_variation_data.name.includes('varietal')) {
      variationFieldData.label = 'select your varietal';
    } else if (variations[0].item_variation_data.name.includes('gift card')) {
      variationFieldData.label = 'select your amount';
    } else {
      variationFieldData.label = 'make a selection';
      console.log('hey normal, here\'s a new scenario:');
      console.log(' >', data.name, variations);
    }

    variations.forEach((v) => {
      if (
        v.item_variation_data.name.includes('select topping') ||
        v.item_variation_data.name.includes('select a') ||
        v.item_variation_data.name.includes('select an') ||
        v.item_variation_data.name.includes('select your') ||
        v.item_variation_data.name.includes('choose topping') ||
        v.item_variation_data.name.includes('choose a') ||
        v.item_variation_data.name.includes('choose an') ||
        v.item_variation_data.name.includes('choose your') ||
        v.item_variation_data.name.includes('make it')
      ) {
        return; // do not display "make..." or "select..." or "choose..." options
      }

      variationFieldData.options.push(v.item_variation_data.name);
    });

    const field = buildFields(variationFieldData);
    console.log(field);
    customForm.append(field);
  }

  if (modifiers) {
    for (const mod of modifiers) {
      const modCat = catalog.byId[mod.modifier_list_id]; // this is a single modifier category (obj)
      const modCatData = modCat.modifier_list_data; // this is a single modifer category WITH DATA I CARE ABOUT (obj)
      const modId = modCat.id; // this is the id for the ENTIRE modifier category (str)
      const modCatName = modCatData.name.split(' ')[1].slice(0, -1); // this is the single modifier category NAME (str)
      const modCatModifiers = modCatData.modifiers; // these are all the modifiers in a category (arr)

      if (path.includes('shipping')) {
        let modQuantity;
        quantities.forEach((quantity) => {
          if (quantity.includes(modCatName)) {
            const limit = quantity.match(/\d+/)[0];
            modQuantity = limit;
          }
        });

        // build the mf carousel
        const block = createEl('div', {
          class: 'carousel-menu'
        });
        const parent = createEl('div', {
          class: 'carousel-menu-container'
        });

        parent.append(block);
        customForm.append(parent);

        await buildShippingCarouselMenu(block, modCatName, modQuantity, modCatModifiers);

        customForm.append(parent);
        customMenu.parentElement.setAttribute('aria-expanded', true);
      }

    }
  }
}

export default function decorateCustomize(block) {
  const wrapper = block.firstChild.firstChild;
  const btn = wrapper.querySelector('.btn-close');
  if (!btn) {
    const newBtn = createEl('aside', {
      class: 'btn btn-close',
    });
    const close = createSVG('close');
    newBtn.append(close);
    newBtn.addEventListener('click', hideCustomize);
    wrapper.prepend(newBtn);
  } else {
    const close = createSVG('close');
    btn.addEventListener('click', hideCustomize);
    btn.append(close);
  }
  const head = wrapper.querySelector('.customize-head');
  if (!head) {
    const newHead = createEl('div', {
      class: 'customize-head',
      html: '<h2></h2>',
    });
    wrapper.append(newHead);
  }
  const body = wrapper.querySelector('.customize-body');
  if (!body) {
    const newBody = createEl('form', {
      class: 'customize-body',
    });
    wrapper.append(newBody);
  }
  const foot = wrapper.querySelector('.customize-foot');
  if (!foot) {
    const newFoot = createEl('div', {
      class: 'customize-foot',
      html: '<a class="btn btn-rect"></a>',
    });
    wrapper.append(newFoot);
  }
}
