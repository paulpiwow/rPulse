export const pad = (value) => String(value).padStart(2, "0");

export const formatClock = (date) => `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;

export const formatStamp = (date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;

export const trendEnd = new Date(Date.UTC(2026, 5, 17, 17, 25, 24));

export const minuteCount = 7 * 24 * 60;

export const trendMinuteTimes = Array.from({ length: minuteCount }, (_, index) => {
  const date = new Date(trendEnd.getTime() - (minuteCount - 1 - index) * 60000);
  return date.toISOString();
});
