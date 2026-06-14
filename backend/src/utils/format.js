export function toApi(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = String(obj._id);
  delete obj._id;
  delete obj.__v;
  if (obj.checked_in_by?._id) obj.checked_in_by = String(obj.checked_in_by._id);
  else if (obj.checked_in_by) obj.checked_in_by = String(obj.checked_in_by);
  if (obj.checked_out_by?._id) obj.checked_out_by = String(obj.checked_out_by._id);
  else if (obj.checked_out_by) obj.checked_out_by = String(obj.checked_out_by);
  if (obj.session_id) obj.session_id = String(obj.session_id);
  if (obj.issued_by?._id) obj.issued_by = String(obj.issued_by._id);
  else if (obj.issued_by) obj.issued_by = String(obj.issued_by);
  return obj;
}

export function toApiList(docs) {
  return docs.map(toApi);
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfDaysAgo(days) {
  const d = startOfToday();
  d.setDate(d.getDate() - days);
  return d;
}

export function formatDateTime(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
