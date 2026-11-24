export const SLOTS = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];
export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y,m,d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y,m-1,d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m-1 && date.getUTCDate() === d;
}
export function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function validateReading(body, today = localToday()) {
  if (body.value === undefined || body.value === null || body.value === '') return 'Please enter a glucose value.';
  if (typeof body.value !== 'number' || !Number.isInteger(body.value) || body.value < 40 || body.value > 600) return 'Value must be a whole number between 40 and 600 mg/dl.';
  if (!isValidDate(body.date)) return 'Please enter a valid date.';
  if (body.date > today) return 'Date cannot be in the future.';
  if (!SLOTS.includes(body.slot)) return 'Please select a valid time slot.';
  return null;
}
export function reportRange(type, selectedDate) {
  if (!isValidDate(selectedDate)) throw new Error('Please enter a valid date.');
  const [y,m] = selectedDate.split('-').map(Number);
  if (type === 'daily') return { start: selectedDate, end: selectedDate };
  if (type === 'mtd') return { start: `${y}-${String(m).padStart(2,'0')}-01`, end: selectedDate };
  if (type === 'monthly') {
    const start = new Date(Date.UTC(y,m-2,1));
    const end = new Date(Date.UTC(y,m-1,0));
    return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) };
  }
  throw new Error('Invalid report type.');
}
