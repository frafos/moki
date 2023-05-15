import * as d3 from "d3";

// Add curtain transition effect to an svg element, go from left to right
function curtainTransition(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  height: number,
) {
  const curtain = svg.append("rect")
    .attr("x", -1 * width)
    .attr("y", -1 * height)
    .attr("height", height)
    .attr("width", width)
    .attr("class", "curtain")
    .attr("transform", "rotate(180)")
    .style("fill", "#ffffff");
  curtain.transition()
    .duration(1200)
    .ease(d3.easeLinear)
    .attr("x", -2 * width - 50);
}

export { curtainTransition };
