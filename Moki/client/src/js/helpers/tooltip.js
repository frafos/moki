const TOP_MAX_WIDTH = 200;

/**
  @param {d3.Selection<HTMLDivElement, unknown, null, undefined>} tooltip
*/
function showTooltip(event, tooltip) {
  const dim = tooltip.node()?.getBoundingClientRect();
  let x = event.clientX - dim.width / 2;
  const y = event.clientY - dim.height - 5;
  if (dim.width > TOP_MAX_WIDTH) {
    x -= dim.width / 2;
  }

  tooltip
    .style("visibility", "visible")
    .style("left", x + "px")
    .style("top", y + "px");
}

/**
  @param {d3.Selection<HTMLDivElement, unknown, null, undefined>} tooltip
*/
function hideTooltip(tooltip) {
  tooltip.style("visibility", "hidden");
}

export { showTooltip, hideTooltip };
