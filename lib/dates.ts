import { addDays, format, parseISO } from "date-fns";

/** Monday-based ISO date string yyyy-MM-dd for the week containing `d`. */
export function mondayOfWeekContaining(d = new Date()) {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - diff);
  mon.setHours(0, 0, 0, 0);
  return format(mon, "yyyy-MM-dd");
}

export function addDaysIso(iso: string, n: number) {
  return format(addDays(parseISO(iso), n), "yyyy-MM-dd");
}
