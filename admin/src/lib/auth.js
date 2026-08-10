/** Current admin user from localStorage (includes permission flags). */
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export function canUpdatePayments() {
  const u = getCurrentUser();
  return u.role === 'admin' && !!u.can_update_payments;
}

export function canUpdatePrice() {
  const u = getCurrentUser();
  return u.role === 'admin' && !!u.can_update_price;
}
