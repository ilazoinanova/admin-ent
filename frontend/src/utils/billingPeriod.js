const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// "YYYY-MM" → "Abril 2026"
export function periodLabel(ym) {
  if (!ym) return '';
  const [year, month] = ym.split('-').map(Number);
  return `${MONTHS_ES[month - 1]} ${year}`;
}

// "YYYY-MM-DD" → "15 Abr 2026"
export function fmtPeriodDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

// "YYYY-MM" → "YYYY-MM" del mes siguiente
export function nextPeriod(ym) {
  const [year, month] = ym.split('-').map(Number);
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// "YYYY-MM" → "YYYY-MM" del mes anterior
export function prevPeriod(ym) {
  const [year, month] = ym.split('-').map(Number);
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

// Mes actual como "YYYY-MM"
export function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Calcula las fechas inicio/fin de un período dado su mes de referencia y el rango de corte.
// El mes de referencia es el mes del *cierre* del período.
// Ej: período "Abril 2026" con from=20,to=10 → 20 Mar 2026 al 10 Abr 2026
//     período "Abril 2026" con from=1,to=28   → 1 Abr 2026 al 28 Abr 2026
export function getPeriodDates(periodYM, from, to) {
  const [year, month] = periodYM.split('-').map(Number);
  const pad = (n) => String(n).padStart(2, '0');

  if (from <= to) {
    return {
      from: `${year}-${pad(month)}-${pad(from)}`,
      to:   `${year}-${pad(month)}-${pad(to)}`,
    };
  }
  // Cruza mes: inicia en el mes anterior
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;
  return {
    from: `${prevYear}-${pad(prevMonth)}-${pad(from)}`,
    to:   `${year}-${pad(month)}-${pad(to)}`,
  };
}

// Genera N períodos consecutivos a partir de startYM
export function generatePeriods(startYM, count, from, to) {
  const periods = [];
  let current   = startYM;
  for (let i = 0; i < count; i++) {
    const dates = getPeriodDates(current, from, to);
    periods.push({
      value:   current,
      label:   periodLabel(current),
      from:    dates.from,
      to:      dates.to,
      display: `${periodLabel(current)} (${fmtPeriodDate(dates.from)} → ${fmtPeriodDate(dates.to)})`,
    });
    current = nextPeriod(current);
  }
  return periods;
}

// Construye la lista de períodos disponibles para selección en el modal.
// Si ya hay historial: arranca en el siguiente al último facturado.
// Si no hay historial: muestra desde 2 meses atrás para cubrir atrasos.
export function buildAvailablePeriods(lastBilledPeriod, dayFrom, dayTo) {
  const from = dayFrom ?? 1;
  const to   = dayTo   ?? 28;

  if (lastBilledPeriod) {
    return generatePeriods(nextPeriod(lastBilledPeriod), 6, from, to);
  }
  // Sin historial: 2 meses atrás + 6 hacia adelante = 8 opciones
  const start = prevPeriod(prevPeriod(currentPeriod()));
  return generatePeriods(start, 8, from, to);
}

// Añade N días a una fecha ISO "YYYY-MM-DD" y devuelve "YYYY-MM-DD"
export function addDays(isoDate, days) {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
