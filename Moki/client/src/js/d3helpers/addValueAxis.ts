import { ScaleLinear, Selection, axisLeft } from "d3";
import { formatValueISO } from "../helpers/formatValue";
import { addGridlines } from "./addGridlines";

/**
 * Rendered Value vertical left axis based on a d3 value scale
 * Use the iso format to display the values
 */
function addValueAxis(
  svg: Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  yScale: ScaleLinear<number, number, never>,
  nbTicks = 5,
) {
  // generate axis
  const yAxis = axisLeft(yScale)
    .ticks(nbTicks)
    .tickFormat(formatValueISO);

  // rendering
  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .call((g) => addGridlines(g, width));
}

export { addValueAxis };
