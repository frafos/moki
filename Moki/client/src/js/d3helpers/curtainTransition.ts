import { BaseType, easeLinear, Selection } from "d3";

// Add curtain transition effect to an svg element, go from left to right
function curtainTransition<
  T extends BaseType,
  U,
  V extends BaseType,
  W,
>(
  selection: Selection<T, U, V, W>,
  width: number,
  height: number,
  margin: { left: number; bottom: number },
) {
  const curtain = selection.append("rect")
    .attr("x", -1 * width - margin.left)
    .attr("y", -1 * height + margin.bottom)
    .attr("height", height)
    .attr("width", width)
    .attr("class", "curtain")
    .attr("transform", "rotate(180)")
    .style("fill", "#ffffff");
  curtain.transition()
    .duration(1200)
    .ease(easeLinear)
    .attr("x", -2 * width - 50);
}

export { curtainTransition };
