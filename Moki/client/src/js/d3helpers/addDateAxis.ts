import { axisBottom, ScaleLinear, Selection, timeFormat } from "d3";

/**
 * Rendered Date horizontal bottom axis based on a d3 time scale
 * The number of ticks is determined dynamically based on content size
 */
function addDateAxis(
  svg: Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  height: number,
  xScale: ScaleLinear<number, number, never>,
  timeBucketFormat: string,
) {
  // generate axis
  const xAxis = axisBottom(xScale)
    .tickFormat(
      timeFormat(timeBucketFormat) as (
        dv: number | { valueOf(): number },
      ) => string,
    );

  // rendering
  const xAxisGroup = svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

  // max tick width
  let maxTickWidth = 0;
  xAxisGroup.selectAll<SVGTextElement, unknown>(".tick text")
    .each(function () {
      maxTickWidth = Math.max(maxTickWidth, this?.getBBox().width);
    });

  const tickPadding = 5;
  const nbTicks = Math.floor(width / (maxTickWidth + 2 * tickPadding));
  const [domainMin, domainMax] = xScale.domain();
  const step = (domainMax - domainMin) / nbTicks;

  // ticks value based on domain and number of ticks
  const tickValues = Array.from(
    { length: nbTicks + 1 },
    (_, i) => Math.round(domainMin + i * step),
  );

  xAxis.tickValues(tickValues);
  xAxisGroup.call(xAxis);
}

export { addDateAxis };
