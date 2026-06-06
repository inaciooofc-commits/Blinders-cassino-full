export function normalizePhone(value = '') {
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function isValidPhone(value = '') {
  return /^\d{2}\s\d{5}-\d{4}$/.test(String(value).trim());
}

export function bindPhoneMasks(root = document) {
  root.querySelectorAll('[data-phone-mask]').forEach(input => {
    if (input.dataset.phoneReady === '1') return;
    input.dataset.phoneReady = '1';
    input.addEventListener('input', () => {
      input.value = normalizePhone(input.value);
    });
    input.value = normalizePhone(input.value);
  });
}
