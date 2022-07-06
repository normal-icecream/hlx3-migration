import {
  createEl,
} from '../../scripts/scripts.js';

async function fetchLocations(url) {
  if (!window.locations) {
    const { pathname } = new URL(url);
    const resp = await fetch(pathname);
    if (resp.ok) {
      let json = await resp.json();
      if (json.data) {
        json = json.data; // helix quirk, difference between live and local
      }
      window.locations = json;
    }
  }
  return window.locations;
}

function searchByZip(zip, data) {
  let matches = data.filter((d) => zip === d.zip);
  if (!matches.length) {
    /// fuzzier zip search
    matches = data.filter((d) => d.zip >= zip - 10 && d.zip <= zip + 10);
  }
  return { locations: matches, type: 'zip' };
}

function searchByCity(city, data) {
  const slcVariants = ['slc', 'salt lake'];
  if (slcVariants.includes(city)) {
    // eslint-disable-next-line no-param-reassign
    city = 'salt lake city';
  }
  // eslint-disable-next-line arrow-body-style
  const matches = data.filter((d) => {
    return city === d.city.toLowerCase() || city === d.state.toLowerCase();
  });
  return { locations: matches, type: 'city' };
}

function buildResult(location) {
  const container = createEl('div');

  const title = createEl('h4');
  const titleA = createEl('a', {
    href: location.link,
    text: location.name,
    target: '_blank',
  });
  title.append(titleA);

  let subtitle;
  if (location.location) {
    subtitle = createEl('h5', {
      text: location.location,
    });
  }

  const addr = createEl('p', {
    text: `${location.address}, ${location.city}, ${location.state}`.toLowerCase(),
  });

  const phone = createEl('p');
  const phoneA = createEl('a', {
    href: `tel:+${location.phone.replace(/-/g, '')}`,
    text: location.phone,
  });
  phone.append(phoneA);

  if (location.location) {
    container.append(title, subtitle, addr, phone);
  } else {
    container.append(title, addr, phone);
  }
  return container;
}

function displayResults(locations, type, searchTerm, allLocations) {
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  const heading = createEl('h3');
  const grid = createEl('div', {
    class: 'search-results-grid',
  });
  if (type === 'show-all') {
    heading.textContent = 'all locations';
    locations.forEach((location) => {
      const result = buildResult(location);
      grid.append(result);
    });
  } else if (locations.length) {
    heading.textContent = `results by ${type}`;
    locations.forEach((location) => {
      const result = buildResult(location);
      grid.append(result);
    });
  } else {
    heading.textContent = `no results for ${searchTerm}... 
      but check out our other locations`;
    allLocations.forEach((location) => {
      const result = buildResult(location);
      grid.append(result);
    });
  }
  container.append(heading);
  container.append(grid);
}

function search(e, data) {
  e.preventDefault();
  const input = document.getElementById('search-input');
  const value = input.value.trim();
  if (value) {
    let results = {};
    // eslint-disable-next-line eqeqeq
    if (value == parseInt(value, 10)) {
      results = searchByZip(parseInt(value, 10), data);
    } else {
      results = searchByCity(value.toLowerCase(), data);
    }
    displayResults(results.locations, results.type, value, data);
  } else {
    displayResults(data, 'show-all');
  }
}

export default async function decorateLocationsSearch(block) {
  const { href } = block.querySelector('a');
  const locations = await fetchLocations(href);
  if (locations) {
    // build search bar
    const form = createEl('form', {
      class: 'search-form',
    });

    const bar = createEl('input', {
      type: 'search',
      class: 'search-input',
      id: 'search-input',
      placeholder: 'enter city or zip here',
    });

    const searchBtn = createEl('button', {
      class: 'search-btn',
      id: 'search-btn',
      text: 'search',
    });
    searchBtn.addEventListener('click', (e) => {
      search(e, locations);
    });

    const showAllBtn = createEl('button', {
      class: 'search-btn showAll-btn',
      id: 'showAll-btn',
    });
    showAllBtn.textContent = 'show all locations';
    showAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      displayResults(locations, 'show-all');
    });

    form.append(bar, searchBtn, showAllBtn);

    const results = createEl('div', {
      class: 'search-results',
      id: 'search-results',
    });

    block.innerHTML = '';
    block.append(form, results);
  } else {
    block.parentElement.remove();
  }
}
