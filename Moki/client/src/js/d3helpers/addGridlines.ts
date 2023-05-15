import * as d3 from "d3";

/**
* Add gridlines to a chart
* @example 
  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .call((g) => addGridlines(g, width))
*/
function addGridlines(
  tick: d3.Selection<SVGGElement, unknown, null, undefined>,
  width: number,
) {
  tick.call((g) =>
    g.selectAll(".tick line").clone()
      .attr("x2", width)
      .attr("stroke-opacity", 0.3)
  );
}

export { addGridlines };
