import { ClientPointEvent, Selection } from "d3";
import { formatDate } from "../helpers/formatTime";

const TOP_MAX_WIDTH = 200;

function showTooltip(
  event: ClientPointEvent,
  tooltip: Selection<HTMLDivElement, unknown, null, undefined>,
  content: string | undefined = undefined,
) {
  if (content) {
    tooltip
      .html(content)
      .select("div");
  }

  const dimension = tooltip.node()?.getBoundingClientRect();
  if (!dimension || !dimension.width || !dimension.height) return;

  let x = event.clientX - dimension.width / 2;
  if (dimension.width > TOP_MAX_WIDTH) x -= dimension.width / 2;
  const y = event.clientY - dimension.height - 5;

  tooltip
    .style("visibility", "visible")
    .style("left", x + "px")
    .style("top", y + "px");
}

function hideTooltip(
  tooltip: Selection<HTMLDivElement, unknown, null, undefined>,
) {
  tooltip.style("visibility", "hidden");
}

// formatting

function formatUnits(units: string | undefined) {
  return (units ? `(${units})` : "");
}

function tooltipTimeFormat(
  value: string,
  timestamp: number,
  timeBucketName: string,
  units: string | undefined = undefined,
  valueName: string | undefined = undefined,
) {
  const valueKey = valueName ? valueName : "Value";
  return `
    <strong>${valueKey}: </strong>${value} 
    ${formatUnits(units)} <br/> 
    <strong>Time: </strong> ${formatDate(timestamp)} + ${timeBucketName}`;
}

function tooltipTypeFormat(
  type: string,
  value: string,
  units: string | undefined = undefined,
) {
  return `
    <strong>Type: </strong> ${type} <br/>
    <strong>Value: </strong>${value} ${formatUnits(units)} <br/>`;
}

export { hideTooltip, showTooltip, tooltipTimeFormat, tooltipTypeFormat };
