import { format, timeFormat } from "d3";

const MN = 60;

function formatDuration(duration: number, unit = true) {
  const secDuration = Math.floor(duration);
  const minutes = Math.floor(secDuration / MN);
  if (isNaN(minutes)) return "0 min";
  const formattedMin = minutes < 10
    ? minutes.toString()
    : format(".2s")(minutes);
  if (!unit) return formattedMin;
  return `${formattedMin} min`;
}

function formatDate(timestamp: number) {
  return timeFormat("%e %B, %Y %H:%M:%S")(new Date(timestamp));
}

export { formatDate, formatDuration };
