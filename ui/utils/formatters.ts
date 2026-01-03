export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

export const parseDateInput = (value: string): Date => {
  return new Date(value);
};

// Returns YYYY-MM-DD for internal logic
export const dateToInputString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Converts YYYY-MM-DD to DD.MM.YYYY
export const isoToGerman = (iso: string): string => {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${day}.${month}.${year}`;
};

// Converts DD.MM.YYYY to YYYY-MM-DD
export const germanToIso = (german: string): string | null => {
  // Allow simple variations like d.m.yy or dd.mm.yyyy
  const parts = german.split('.');
  if (parts.length !== 3) return null;
  
  let [day, month, year] = parts;
  
  if (day.length === 1) day = '0' + day;
  if (month.length === 1) month = '0' + month;
  if (year.length === 2) year = '20' + year; // Assumption for 21st century
  
  if (year.length !== 4) return null;

  const iso = `${year}-${month}-${day}`;
  
  // Basic validation using Date object
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  
  return iso;
};