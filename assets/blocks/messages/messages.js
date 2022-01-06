/* eslint-disable no-use-before-define */
import {
  buildGScriptLink,
  buildGQs,
  createEl,
  createSVG,
  fetchLabels,
  noScroll,
} from '../../scripts/scripts.js';

import {
  checkAuthToken,
  getAuthToken,
  removeAuthToken,
  sendText,
} from '../../utils/admin/admin.js';

import {
  buildScreensaver,
  makeScreensaverError,
  removeScreensaver,
} from '../../utils/screensaver/screensaver.js';

const MESSAGES_ID = 'AKfycbyj25ygCc6SvxJ9KCzdQSmiqz3emxuIJdNVzTXKjw3F88gdxClNLtq3PyNGgB2ca7FELA'; // see admin.js

function fancyNum(num) {
  let fancy = num.replace(/[^0-9]/g, '');
  if (fancy.length < 11) { fancy = `1${fancy}`; }
  return `+${fancy}`;
}

function readableNum(num) {
  let readable = num.replace(/[^0-9]/g, '');
  if (readable.length === 11) { readable = readable.substring(1, readable.length); }
  const a = readable.substring(0, 3);
  const b = readable.substring(3, 6);
  const c = readable.substring(6, readable.length);
  return `${a}-${b}-${c}`;
}

function validateNum(num) {
  let valid = num.replace(/[^0-9]/g, '').toString();
  if (valid.length < 11 && valid[0] === '1') {
    // us area codes don't start with 1
    return { number: valid, valid: false };
  }
  if (valid.length === 11 && valid[0] === '1') { valid = valid.substring(1); }
  return { number: valid, valid: valid.length === 10 };
}

function prettyPrintDate(date) {
  const dateObj = new Date(date);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];
  const day = days[dateObj.getDay()];
  const month = months[dateObj.getMonth()];
  const dd = dateObj.getDate();
  const hh = dateObj.getHours() > 12 ? dateObj.getHours() - 12 : dateObj.getHours();
  const mm = dateObj.getMinutes().toString().padStart(2, '0');
  const suffix = dateObj.getHours() < 12 ? 'am' : 'pm';
  return `${day}, ${month} ${dd} @ ${hh}:${mm}${suffix}`.toLowerCase();
}

function calcTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let int = (seconds / 31536000); // one year
  if (int > 1) {
    return Math.floor(int) === 1
      ? `${Math.floor(int)} yr` : `${Math.floor(int)} yrs`;
  }
  int = seconds / 2592000;
  if (int > 1) {
    return Math.floor(int) === 1
      ? `${Math.floor(int)} mon` : `${Math.floor(int)} mons`;
  }
  int = seconds / 86400;
  if (int > 1) {
    return Math.floor(int) === 1
      ? `${Math.floor(int)} day` : `${Math.floor(int)} days`;
  }
  int = seconds / 3600;
  if (int > 1) {
    return Math.floor(int) === 1
      ? `${Math.floor(int)} hr` : `${Math.floor(int)} hrs`;
  }
  int = seconds / 60;
  if (int > 1) {
    return Math.floor(int) === 1
      ? `${Math.floor(int)} min` : `${Math.floor(int)} mins`;
  }
  return Math.floor(int) === 1
    ? `${Math.floor(int)} sec` : `${Math.floor(int)} secs`;
}

function playSound() {
  const audio = new Audio('../assets/blocks/messages/messagesNotification.mp3');
  audio.play();
}

async function fetchMessages(params = {}) {
  const token = getAuthToken();
  params.token = token;
  const url = buildGScriptLink(MESSAGES_ID);
  const qs = buildGQs(params);
  const resp = await fetch(`${url}?${qs}`);
  if (resp.ok) {
    const json = await resp.json();
    if (json['error-text']) {
      // eslint-disable-next-line no-console
      console.error(json);
      delete window.messagesHistory;
      removeAuthToken();
      makeScreensaverError(`${json['error-text']}. login to continue!`);
      return false;
    }
    if (json.result === 'success' && json.messages) {
      return json.messages;
    }
  }
  makeScreensaverError('something went wrong. try again?');
  return false;
}

function updateThreadHead(num) {
  const input = document.getElementById('message-recipient');
  if (input) {
    const numEl = createEl('h2', {
      text: readableNum(num),
    });
    input.replaceWith(numEl);
  }
}

function updateThreadFoot(num) {
  const form = document.querySelector('.messages-thread-foot form');
  if (form) {
    const textbox = document.getElementById('message-outgoing');
    const btn = form.querySelector('button');
    if (textbox && btn) {
      btn.setAttribute('title', `send message to ${readableNum(num)}`);
      textbox.placeholder = 'text message';
      textbox.setAttribute('data-recipient', num);
      form.classList.remove('message-outgoing-disabled');
      [...form.children].forEach((input) => {
        input.disabled = false;
      });
    }
  }
}

function buildMessage(message) {
  const wrapper = createEl('div', {
    class: `messages-thread-${message.direction}`,
  });
  const body = createEl('p', {
    class: 'message-thread-body',
    html: message.body,
  });
  const date = createEl('p', {
    class: 'message-thread-date',
    text: prettyPrintDate(message.date_sent),
  });
  wrapper.append(date, body);
  return wrapper;
}

function buildThreadHead(num = false) {
  const head = createEl('div', {
    class: 'messages-thread-head',
  });
  const wrapper = createEl('div');
  const btn = createEl('aside', {
    class: 'btn btn-close messages-thread-close',
    title: num ? `close convo with ${readableNum(num)}` : 'close convo',
  });
  btn.addEventListener('click', async () => {
    buildScreensaver('checking for new messages...');
    await refreshPreviews();
    const thread = document.querySelector('.messages-thread');
    if (thread) { thread.remove(); }
    document.querySelector('body').classList.remove('no-scroll');
    window.removeEventListener('scroll', noScroll);
  });
  const arrow = createSVG('arrow-left');
  btn.append(arrow);
  if (num) {
    const numEl = createEl('h2', {
      text: readableNum(num),
    });
    wrapper.append(btn, numEl);
  } else {
    const input = createEl('input', {
      id: 'message-recipient',
      placeholder: 'new message',
      type: 'text',
    });
    input.addEventListener('input', async (e) => {
      const { valid, number } = validateNum(e.target.value.trim());
      head.classList.add('messages-thread-head-invalid');
      if (valid) {
        head.classList.remove('messages-thread-head-invalid');
        buildScreensaver('checking for messages...');
        input.disabled = true;
        const messages = await fetchMessages({ type: 'number', num: number });
        // update head, update foot
        updateThreadHead(number);
        updateThreadFoot(number);
        const body = document.querySelector('.messages-thread .messages-thread-body');
        if (messages && body) {
          // if messages, populate body
          messages.forEach((message) => {
            const messageEl = buildMessage(message);
            body.prepend(messageEl);
          });
          body.scrollTop = body.scrollHeight;
        }
        removeScreensaver();
      }
    });
    wrapper.append(btn, input);
  }
  head.append(wrapper);
  return head;
}

function buildThreadFoot(num = false) {
  const foot = createEl('div', {
    class: 'messages-thread-foot',
  });
  const form = createEl('form');
  const textbox = createEl('textarea', {
    id: 'message-outgoing',
    name: 'message-outgoing',
    placeholder: num ? 'text message' : 'enter recipient to send message!',
    'data-recipient': num || '',
  });
  const btn = createEl('button', {
    title: num ? `send message to ${readableNum(num)}` : 'enter recipient to send message',
  });
  const arrow = createSVG('arrow-right');
  btn.append(arrow);
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const target = document.getElementById('message-outgoing');
    const recipient = target.getAttribute('data-recipient');
    const message = target.value.trim();
    if (message) {
      buildScreensaver(`sending message to ${readableNum(recipient)}...`);
      // send message
      const token = getAuthToken();
      const res = await sendText({ num: recipient, msg: message, token });
      if (!res) {
        makeScreensaverError('something went wrong. try again?');
      } else if (res.result === 'error' || res['error-text']) {
        delete window.messagesHistory;
        removeAuthToken();
        makeScreensaverError(`${res['error-text']}. login to continue!`);
      } else if (res.result === 'success') {
        target.value = ''; // clear form
        await refreshThread(recipient);
        removeScreensaver();
      }
    }
  });
  if (!num) {
    form.classList.add('message-outgoing-disabled');
    textbox.disabled = true;
    btn.disabled = true;
  }
  form.append(textbox, btn);
  foot.append(form);
  return foot;
}

async function refreshThread(num) {
  const body = document.querySelector('.messages-thread .messages-thread-body');
  if (body) {
    const messages = await fetchMessages({ type: 'number', num });
    if (messages) {
      body.innerHTML = '';
      messages.forEach((message) => {
        const messageEl = buildMessage(message);
        body.prepend(messageEl);
        body.scrollTop = body.scrollHeight;
      });
      const lastMessage = messages[0]; // order is reversed
      if (!window.messagesHistory.includes(lastMessage.sid)) {
        window.messagesHistory.push(lastMessage.sid);
        if (lastMessage.direction === 'inbound') {
          playSound();
        }
      }
    } else {
      makeScreensaverError('something went wrong. try again?');
    }
  }
}

async function buildThread(num) {
  buildScreensaver(`getting convo with ${readableNum(num)}`);
  const labels = await fetchLabels();
  const LABEL_NUM = fancyNum(labels.store_phone);
  const messages = await fetchMessages({ type: 'number', num });
  if (messages) {
    const wrapper = createEl('section', {
      class: 'messages-thread',
    });
    const firstMessage = messages[0];
    const recipient = (firstMessage.from === LABEL_NUM || firstMessage.from === '+12153984647') // old num
      ? firstMessage.to : firstMessage.from;
    const head = buildThreadHead(recipient);
    const foot = buildThreadFoot(recipient);
    const body = createEl('div', {
      class: 'messages-thread-body',
    });
    messages.forEach((message) => {
      const messageEl = buildMessage(message);
      body.prepend(messageEl);
    });
    const lastMessage = messages[0]; // order is reversed
    if (!window.messagesHistory.includes(lastMessage.sid)) {
      window.messagesHistory.push(lastMessage.sid);
    }
    wrapper.append(head, body, foot);
    const main = document.querySelector('main');
    main.append(wrapper);
    document.querySelector('body').classList.add('no-scroll');
    window.addEventListener('scroll', noScroll);
    body.scrollTop = body.scrollHeight;
    removeScreensaver();
  } else {
    makeScreensaverError('something went wrong. try again?');
  }
}

function buildEmptyThread() {
  const wrapper = createEl('section', {
    class: 'messages-thread',
  });
  const head = buildThreadHead();
  const foot = buildThreadFoot();
  const body = createEl('div', {
    class: 'messages-thread-body',
  });
  wrapper.append(head, body, foot);
  const main = document.querySelector('main');
  main.append(wrapper);
  document.querySelector('body').classList.add('no-scroll');
  window.addEventListener('scroll', noScroll);
  body.scrollTop = body.scrollHeight;
}

function buildPreview(message, LABEL_NUM) {
  const author = message.from === LABEL_NUM ? message.to : message.from;
  const tr = createEl('tr', {
    'data-author': author,
  });
  const authorCol = createEl('td');
  const authorEl = createEl('p', {
    class: 'messages-preview-author',
    text: readableNum(author),
  });
  const body = createEl('p', {
    class: 'messages-preview-body',
    text: (message.body.length > 80)
      ? `${message.body.substring(0, 80)}...` : message.body,
  });
  authorCol.append(authorEl, body);
  const dateCol = createEl('td', {
    class: 'messages-preview-timeago',
    text: `${calcTimeAgo(message.date_sent)} ago`,
  });
  tr.append(authorCol, dateCol);
  tr.addEventListener('click', async (e) => {
    const num = e.target.closest('tr').getAttribute('data-author');
    await buildThread(num);
    tr.classList.remove('message-new');
  });
  return tr;
}

async function refreshPreviews() {
  const tbody = document.querySelector('.messages .messages-preview tbody');
  if (tbody) {
    const labels = await fetchLabels();
    const LABEL_NUM = fancyNum(labels.store_phone);
    const messages = await fetchMessages();
    tbody.innerHTML = '';
    if (messages) {
      let newMessages = false;
      messages.forEach((message) => {
        const preview = buildPreview(message, LABEL_NUM);
        if (!window.messagesHistory.includes(message.sid)) { // new message!
          preview.classList.add('message-new');
          newMessages = true;
        }
        tbody.append(preview);
      });
      if (newMessages) {
        playSound();
      }
      removeScreensaver();
    } else {
      makeScreensaverError('something went wrong. try again?');
    }
  }
}

async function setupPreviews(block) {
  buildScreensaver('getting messages...');
  const labels = await fetchLabels();
  const LABEL_NUM = fancyNum(labels.store_phone);
  // build preview
  const table = createEl('table', {
    class: 'messages-preview',
  });
  const tbody = createEl('tbody');
  // fetch messages
  const messages = await fetchMessages();
  if (messages) {
    let forcePop = false;
    // history is empty on setup
    if (!window.messagesHistory.length) { forcePop = true; }
    // display messages in preview
    messages.forEach((message) => {
      const preview = buildPreview(message, LABEL_NUM);
      tbody.append(preview);
      if (forcePop) { // populate history for the first time
        window.messagesHistory.push(message.sid);
      } else if (!window.messagesHistory.includes(message.sid)) { // new message!
        preview.classList.add('message-new');
      }
    });
    table.append(tbody);
    block.append(table);
    removeScreensaver();
  }
}

function buildMessageHead(block) {
  const wrapper = createEl('div', {
    class: 'messages-head',
  });
  const btn = createEl('button', {
    class: 'btn btn-pill messages-convo-btn',
    text: 'start a conversation',
  });
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    buildEmptyThread();
  });
  wrapper.append(btn);
  block.prepend(wrapper);
}

async function refresh() {
  await refreshPreviews();
  const thread = document.querySelector('.messages-thread');
  if (thread) {
    const recipient = thread.querySelector('[data-recipient]');
    if (recipient) {
      const num = recipient.getAttribute('data-recipient');
      if (num) {
        await refreshThread(num);
      }
    }
  }
}

export default async function decorateMessages(block) {
  const REFRESH_SECONDS = 30;
  buildMessageHead(block);
  const storageToken = getAuthToken();
  if (!window.messagesHistory) {
    window.messagesHistory = [];
  }
  if (storageToken) {
    // validate
    const res = await checkAuthToken(storageToken);
    if (res) {
      // setup site
      await setupPreviews(block);
      setInterval(refresh, REFRESH_SECONDS * 1000);
    }
  } else {
    // wait for valid token
    const head = document.querySelector('.messages-head');
    if (head) {
      const btn = createEl('button', {
        class: 'btn btn-pill messages-reload-btn',
        text: 'open messages',
      });
      btn.addEventListener('click', async () => {
        await setupPreviews(block);
        setInterval(refresh, REFRESH_SECONDS * 1000);
        btn.remove();
      });
      head.append(btn);
    }
  }
}
