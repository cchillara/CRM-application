
export function formatToMonthDateYear(dateInput) {
  if (!dateInput) return '';
  const str = String(dateInput).trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str;
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${m.padStart(2, '0')}-${d.padStart(2, '0')}-${y}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  }
  return str;
}