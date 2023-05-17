const MN = 60;
const HOUR = 60 * MN;
const DAY = 24 * HOUR;

function formatTime(time: number, format: string) {
  if (time === 0) return "";
  return time + format;
}

function parseDuration(duration: number) {
  let secDuration = Math.floor(duration);

  const days = Math.floor(secDuration / DAY);
  secDuration -= days;
  const hours = Math.floor(secDuration / HOUR);
  secDuration -= hours;
  const minutes = Math.floor((secDuration % HOUR) / MN);
  secDuration -= minutes;
  const seconds = secDuration % MN;

  if (!days && !hours && !minutes && !seconds) return "0s";
  return `${formatTime(days, "d")} ${formatTime(hours, "h")} 
		${formatTime(minutes, "m")} ${days > 0 ? "" : formatTime(seconds, "s")}`;
}

export { parseDuration };
