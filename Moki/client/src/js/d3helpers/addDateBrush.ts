import * as d3 from "d3";
import { parseTimestamp } from "../helpers/parseTimestamp";

function addDateBrush(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  height: number,
  xScale: d3.ScaleLinear<number, number, never>,
  setTimerange: (newTimerange: [number, number, string]) => void,
) {
  svg.append("g")
    .attr("class", "brush")
    .call(
      d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", (event) => {
          // Only transition after input
          if (!event.sourceEvent) return;
          // Ignore empty selections
          if (!event.selection) return;
          const extent = event.selection;
          const timestamp_gte = Math.round(xScale.invert(extent[0]));
          const timestamp_lte = Math.round(xScale.invert(extent[1]));
          const timestamp_readiable =
            parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " - " +
            parseTimestamp(new Date(Math.trunc(timestamp_lte)));
          setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]);
        }),
    );
}

export { addDateBrush };
