/** Offset (ms) of `timeZone` from UTC at the given instant. */
function tzOffsetMs(timeZone, date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** [start, end) of the calendar month containing `date`, in the given time zone. */
export function zonedMonthRange(timeZone = 'Asia/Ho_Chi_Minh', date = new Date()) {
  const local = new Date(date.getTime() + tzOffsetMs(timeZone, date));
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const startGuess = new Date(Date.UTC(y, m, 1));
  const endGuess = new Date(Date.UTC(y, m + 1, 1));
  return {
    start: new Date(startGuess.getTime() - tzOffsetMs(timeZone, startGuess)),
    end: new Date(endGuess.getTime() - tzOffsetMs(timeZone, endGuess)),
  };
}

export const addDays = (date, days) => new Date(date.getTime() + days * 86_400_000);

/** Calendar date ({ y, m, d }, month 0-based) of `date` as seen in the given time zone. */
export function zonedCalendarDate(timeZone = 'Asia/Ho_Chi_Minh', date = new Date()) {
  const local = new Date(date.getTime() + tzOffsetMs(timeZone, date));
  return { y: local.getUTCFullYear(), m: local.getUTCMonth(), d: local.getUTCDate() };
}

/** Instant of local midnight for a calendar date in the given time zone (overflowing d/m roll over). */
export function zonedDayStart(timeZone, y, m, d) {
  const guess = new Date(Date.UTC(y, m, d));
  return new Date(guess.getTime() - tzOffsetMs(timeZone, guess));
}

/** "YYYY-MM-DD" key of a calendar date (overflowing d/m roll over). */
export function dayKey(y, m, d) {
  return new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
}
