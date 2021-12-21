/* eslint-disable brace-style */
import {
  createEl,
  createSVG,
  toClassName,
  fetchFormFields,
} from '../../scripts/scripts.js';

function toggle(e) {
  const expanded = e.target.getAttribute('aria-expanded');
  if (expanded === 'true') {
    e.target.setAttribute('aria-expanded', false);
  } else {
    e.target.setAttribute('aria-expanded', true);
  }
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
    'aria-expanded': false,
  });
  if (field.options && !field.options.startsWith('@')) {
    const options = field.options.split(',').map((o) => o.trim());
    options.forEach((option) => {
      // eslint-disable-next-line eqeqeq
      if (option == Number(option)) {
        // eslint-disable-next-line no-param-reassign
        option = Number(option);
      }
      const label = createEl('label', {
        class: `form-${field.type}-option`,
        for: (option.toString().includes(' ') ? toClassName(option) : option),
        text: option,
      });
      const bubble = createEl('span', {
        class: `form-${field.type}-bubble`,
      });
      const optionEl = createEl('input', {
        class: `form-${field.type}-default`,
        id: (option.toString().includes(' ') ? toClassName(option) : option),
        name: field.title,
        type: field.type,
      });
      optionEl.value = option;
      label.append(optionEl, bubble);
      optionsWrapper.append(label);
    });
  } else {
    // eslint-disable-next-line no-console
    console.log('external options');
  }
  fieldEl.append(optionsWrapper);
  return fieldEl;
}

export function buildField(field) {
  let fieldEl;
  // radio & checkbox
  if (field.type === 'radio' || field.type === 'checkbox') {
    fieldEl = buildBubble(field);
  }
  // select
  else if (field.type === 'select') {
    
  }
  // all other input types
  else {
    fieldEl = createEl('input', {
      class: 'form-field',
      id: (field.title.toString().includes(' ') ? toClassName(field.title) : field.title),
      name: (field.title.toString().includes(' ') ? toClassName(field.title) : field.title),
      type: field.type || 'text',
      'data-category': field.category,
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

  // else if (field.type === 'select') {
  //   fieldEl = createEl('div', {
  //     class: 'form-select-wrapper',
  //   });
  //   // data attributes
  //   if (field.data) {
  //     for (dataType in field.data) {
  //       fieldEl.setAttribute(`data-${dataType}`, field.data[dataType]);
  //     }
  //   }
  //   const select = createEl(field.type, {
  //     class: 'form-select',
  //     id: toClassName(field.title),
  //     name: toClassName(field.title),
  //   });

  //   const option = createEl('option');
  //   option.textContent = field.placeholder;
  //   option.value = '';
  //   option.disabled = true;
  //   option.selected = true;
  //   option.hidden = true;

  //   select.append(option);
  //   fieldEl.append(select);

  return fieldEl;
}

// export function populateOptions(el, data) {
//   data.forEach((d) => {
//     const option = createEl('option');
//     option.value = d.value || d;
//     option.textContent = d.text || d;
//     el.append(option);
//   });
// }

export async function buildForm(form, categories) {
  const allFields = await fetchFormFields();
  const allCategories = Object.keys(allFields);
  categories.forEach((cat) => {
    if (allCategories.includes(cat)) {
      allFields[cat].forEach((c) => {
        const field = buildField(c);
        form.append(field);
      });
    }
  });
}
