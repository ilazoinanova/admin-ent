/**
 * Convierte "yyyy-mm-dd" → "dd/mm/yyyy" para mostrar al usuario.
 * Los inputs type="date" siguen usando el formato ISO internamente.
 */
export const fmtDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
};
