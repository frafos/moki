import { format } from "d3";

function formatValueISO(nbDigits = 4) {
  return format(`.${nbDigits}~s`);
}

export { formatValueISO };
