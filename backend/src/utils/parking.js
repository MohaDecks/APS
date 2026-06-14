function parseTime(str) {
  if (!str) return new Date();
  if (str instanceof Date) return str;
  return new Date(str.includes('T') ? str : str.replace(' ', 'T'));
}

export function calculateFee(entryTime, exitTime, hourlyRate) {
  const entry = parseTime(entryTime);
  const exit = parseTime(exitTime);
  const diffMs = Math.max(0, exit - entry);
  const diffMinutes = Math.max(1, Math.ceil(diffMs / 60000));
  const hours = Math.ceil(diffMinutes / 60);
  const fee = hours * hourlyRate;
  return { durationMinutes: diffMinutes, hours, fee };
}

export function formatElapsed(entryTime) {
  const entry = parseTime(entryTime);
  const now = new Date();
  const diffMs = now - entry;
  const totalSeconds = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function generateInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${date}-${rand}`;
}
