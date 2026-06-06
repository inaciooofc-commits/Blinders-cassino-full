export function input(name, label, placeholder = '', type = 'text') {
  return `<label>${label}<input name="${name}" id="${name}" type="${type}" placeholder="${placeholder}"></label>`;
}

export function textarea(name, label, placeholder = '') {
  return `<label>${label}<textarea name="${name}" id="${name}" placeholder="${placeholder}"></textarea></label>`;
}

export function select(name, label, options = []) {
  return `<label>${label}<select name="${name}" id="${name}">${options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}</select></label>`;
}

export function resultBox(id = 'resultBox') {
  return `<div class="admin-action-result" id="${id}">Aguardando ação.</div>`;
}

export function bindMockAction(buttonId = 'executeBtn', resultId = 'resultBox', message = 'Ação preparada.') {
  document.querySelector(`#${buttonId}`)?.addEventListener('click', () => {
    const result = document.querySelector(`#${resultId}`);
    const payload = [...document.querySelectorAll('input, select, textarea')].map(el => `${el.name || el.id}: ${el.value || '-'}`).join('<br>');
    if (result) result.innerHTML = `✅ ${message}<br><br>${payload}`;
  });
}
