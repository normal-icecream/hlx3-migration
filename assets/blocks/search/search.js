import { createEl, createInput, getFormData } from '../../scripts/scripts.js';

function showAllLocations(grid, fallback = true) {
  if (!fallback) { // user clicked "show all locations" button
    const heading = grid.parentElement.querySelector('h3');
    const title = heading.querySelector('span.search-results-title');
    title.textContent = 'all locations';
    if (heading.querySelector('.search-no-results-title')) {
      heading.querySelector('.search-no-results-title').remove();
    }
  }
  const locations = grid.querySelectorAll('.search-result');
  locations.forEach((loc) => loc.setAttribute('aria-hidden', false));
}

function searchLocations(e, grid) {
  e.preventDefault();
  const form = e.target.closest('form.form');
  if (form) {
    const data = getFormData(form);
    const query = data.fields['input-search'];
    if (query && query.value) {
      // reset all results
      const locations = grid.querySelectorAll('.search-result');
      locations.forEach((loc) => loc.setAttribute('aria-hidden', true));
      // display and update results
      const resultsWrapper = grid.parentElement;
      const heading = resultsWrapper.querySelector('h3');
      const title = heading.querySelector('span.search-results-title');
      if (heading.querySelector('.search-no-results-title')) {
        heading.querySelector('.search-no-results-title').remove();
      }
      title.textContent = query.value;
      resultsWrapper.setAttribute('aria-hidden', false);
      let results = 0;
      if (typeof query.value === 'number') { // zip search
        locations.forEach((loc) => {
          const zip = parseInt(loc.getAttribute('data-zip'), 10);
          if (zip === query.value) {
            loc.setAttribute('aria-hidden', false);
            results += 1;
          }
        });
      } else { // city/state search
        let queryString = query.value.toLowerCase();
        const states = ['utah', 'wyoming', 'idaho', 'ut', 'id', 'wy'];
        locations.forEach((loc) => {
          if (states.includes(queryString)) { // search by state
            const state = loc.getAttribute('data-state');
            if (state.includes(queryString)) {
              loc.setAttribute('aria-hidden', false);
              results += 1;
            }
          } else { // search by city
            const slcVariants = ['salt lake', 'slc'];
            if (slcVariants.includes(queryString)) queryString = 'salt lake city';
            const city = loc.getAttribute('data-city');
            if (city.includes(queryString)) {
              loc.setAttribute('aria-hidden', false);
              results += 1;
            }
          }
        });
      }
      if (results === 0) { // display all results fallback
        const no = createEl('span', { text: 'no ', class: 'search-no-results-title' });
        heading.prepend(no);
        title.textContent += '... but check out our other locations!';
        showAllLocations(grid);
      }
    }
  }
}

export default async function decorate(block) {
  const a = block.querySelector('a');
  block.innerHTML = '';
  if (a) {
    const resp = await fetch(a.href);
    if (resp.ok) {
      // fetch search result data
      const { data } = await resp.json();
      data.sort((b, c) => {
        if (b.name < c.name) return -1;
        if (b.name > c.name) return 1;
        return 0;
      });
      // build search results
      const results = createEl('section', {
        class: 'search-results',
        'aria-hidden': true,
        html: '<h3>results for <span class="search-results-title"></span></h3>',
      });
      const grid = createEl('div', { class: 'search-results-grid' });
      data.forEach((loc) => {
        const website = new URL(loc.link).origin.replace('https://', '').replace('http://', '').replace('www.', '');
        const result = createEl('div', {
          class: 'search-result',
          'aria-hidden': true,
          'data-city': loc.city.toLowerCase(),
          'data-state': loc.state.toLowerCase(),
          'data-zip': loc.zip,
          html: `<h4><a href="${loc.link}" target="_blank">${loc.name}</a></h4>
            <p>${loc.address}, ${loc.city}, ${loc.state}</p>
            <p><a href="${loc.link}" target="_blank">${website}</a></p>
            <p><a href="tel:+1${loc.phone.replaceAll('-', '')}">${loc.phone}</a></p>`,
        });
        grid.append(result);
      });
      results.append(grid);
      block.append(results);
      // build search form
      const form = createEl('form', {
        id: 'search-form',
        class: 'form search-form',
      });
      const input = createInput('search', 'enter a city, state, or zip here');
      const btnWrapper = createEl('div', { class: 'button-container' });
      const searchBtn = createEl('button', {
        id: 'search',
        class: 'button primary',
        text: 'search',
      });
      searchBtn.addEventListener('click', (e) => searchLocations(e, grid));
      const showAllBtn = createEl('button', {
        id: 'show-all',
        class: 'button secondary',
        text: 'show all locations',
      });
      showAllBtn.addEventListener('click', () => showAllLocations(grid, false));
      btnWrapper.append(searchBtn, showAllBtn);
      form.append(input, btnWrapper);
      block.prepend(form);
    }
  }
}
