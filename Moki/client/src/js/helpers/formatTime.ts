import { timeFormat } from "d3";
import { formatValueISO } from "./formatValue";

const MN = 60;

function formatDuration(duration: number, unit = true) {
  const secDuration = Math.floor(duration);
  const minutes = Math.floor(secDuration / MN);
  if (isNaN(minutes)) return "0 min";
  const formattedMin = formatValueISO(minutes);
  if (!unit) return formattedMin;
  return `${formattedMin} min`;
}

function formatDate(timestamp: number) {
  return timeFormat("%e %B, %Y %H:%M:%S")(new Date(timestamp));
}

export { formatDate, formatDuration };
