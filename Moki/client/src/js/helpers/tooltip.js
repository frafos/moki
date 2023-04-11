import * as d3 from "d3";

// var tooltipDim = tooltip.node().getBoundingClientRect();
// var chartRect = d3.select('#' + id).node().getBoundingClientRect();
// tooltip
// .style("left", (d3.event.clientX - chartRect.left + 
  // document.body.scrollLeft - (tooltipDim.width / 2)) + "px")
// .style("top", (d3.event.clientY - chartRect.top + document.body.scrollTop + 30) + "px");
// showTooltip(tooltip)

/**
  @param {d3.Selection<HTMLDivElement, any, HTMLElement, any>} tooltip
*/
function showTooltip(tooltip) {
  const dim = tooltip.node()?.getBoundingClientRect();
  let x = d3.event.clientX - dim.width / 2;
  const y = d3.event.clientY - dim.height - 5;
  // TODO: manage top position based on content length and position
  // for the moment, only top left of cursor
  if (dim.width > 200) {
    x -= dim.width / 2;
  }

  tooltip
    .style("visibility", "visible")
    .style("left", x + "px")
    .style("top", y + "px");
}

export { showTooltip };
