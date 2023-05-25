import { format, formatPrefix } from "d3";

function formatValueISO(n: number | { valueOf(): number } | undefined) {
  const value = n?.valueOf();
  if (value == undefined || isNaN(value)) return "";
  if (value < 1) return format(".2~f")(value)
  return formatPrefix(".2~f", value)(value);
}

export { formatValueISO };
