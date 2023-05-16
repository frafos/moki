import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { hideTooltip, showTooltip } from "../helpers/tooltip";
import { Colors, ColorType, createFilter } from "../../gui";

import store from "@/js/store";
import NoData from "./NoData";
import { curtainTransition } from "../d3helpers/curtainTransition";
import { addGridlines } from "../d3helpers/addGridlines";
import { useAppSelector } from "../hooks";
import { useWindowWidth } from "../hooks/useWindowWidth";

export interface ChartData {
  name: string;
  sum: number;
}

export interface Props {
  data: ChartData[];
  id: string;
  name: string;
  units: string;
  keys: string;
}

export default function StackedChart({ keys, ...props }: Props) {
  const chartKeys = store.getState().persistent.layout.types[keys];
  const { navbarExpanded } = useAppSelector((state) => state.view);

  return (
    <StackedChartRender {...{ ...props, keys: chartKeys, navbarExpanded }} />
  );
}

function wrap(
  texts: d3.Selection<d3.BaseType, unknown, SVGGElement, unknown>,
  width: number,
) {
  //split by /
  texts.each(function () {
    const text = d3.select(this);
    const words = text.text().split("/").reverse();
    const lineHeight = 1.1; // ems
    const y = text.attr("y");
    const dy = parseFloat(text.attr("dy"));

    // return the split char
    if (words.length > 1) words[1] = words[1] + "/";

    let line: string[] = [];
    let lineNumber = 0;
    let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y)
      .attr("dy", dy + "em");

    words.reverse();
    for (const word of words) {
      line.push(word);
      tspan.text(line.join(" "));
      const tspanNode = tspan.node();
      if (tspanNode && tspanNode.getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr(
          "dy",
          ++lineNumber * lineHeight + dy + "em",
        ).text(word);
      }
    }
  });
}

export type RenderProps = {
  data: ChartData[];
  navbarExpanded: boolean;
  name: string;
  units: string;
  keys: string[];
};

export function StackedChartRender(
  { data, navbarExpanded, name, units, keys }: RenderProps,
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartSVGRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const noData = data === undefined || data.length == 0 || keys.length == 0;
  const totalHeight = 250;

  const windowWidth = useWindowWidth();

  useEffect(() => {
    draw(true);
  }, [data]);

  useEffect(() => {
    draw();
  }, [navbarExpanded, windowWidth]);

  const draw = (transition = false) => {
    if (noData) return;
    if (!chartRef.current || !chartSVGRef.current || !tooltipRef.current) {
      return;
    }

    // FOR UPDATE: clear chart svg, clean up lost tooltips
    chartSVGRef.current.innerHTML = "";
    tooltipRef.current.innerHTML = "";

    const tooltip = d3.select(tooltipRef.current);
    tooltip.style("visibiliy", "hidden");
    tooltip.append("div");

    units = units ? " (" + units + ")" : "";
    const colorScale = d3.scaleOrdinal(Colors);
    const margin = {
      bottom: 80,
      top: 30,
      left: 70,
      right: 20,
    };

    const totalWidth = chartRef.current.clientWidth;
    const svgHeight = chartSVGRef.current.clientHeight;
    const width = Math.max(100, totalWidth - (margin.left + margin.right));
    const height = svgHeight - margin.top - margin.bottom;
    const formatValue = d3.format(".2s");

    // svg with left offset
    const svgElement = d3.select(chartSVGRef.current);

    const svg = svgElement
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left}, ${margin.top})`,
      );

    // max value in data with offset
    const maxValue = d3.max(data, (d) => d.sum + 5) ?? 1;
    const domain = maxValue;

    // scale and axis
    const xScale = d3.scaleBand()
      .range([0, width])
      .paddingInner(0.1)
      .domain(data.map((d) => d.name));
    const yScale = d3.scaleLinear()
      .range([height, 0])
      .domain([0, domain * 1.1]);
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(formatValue);

    // x axis rendering
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .selectAll(".tick text")
      .call(wrap, 70)
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    // y axis rendering
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .call((g) => addGridlines(g, width));

    // stacks
    const stack = d3.stack<ChartData>()
      .keys(keys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const g = svg.append("g");
    const layers = stack(data);
    const layer = g.selectAll(".layer")
      .data(layers).enter()
      .append("g")
      .attr("class", "layer")
      .attr("type", (d) => d.key)
      .style("fill", (d) => {
        return ColorType[d.key] ?? colorScale(d.key);
      })
      .on("mouseover", function () {
        d3.select(this).style("stroke", "orange");
      })
      .on("mouseout", function () {
        d3.select(this).style("stroke", "none");
      });

    // if the value is too low, still remain visible
    // TODO: this kind of things should be factorized in methods
    const minHeight = 1.5;
    layer.selectAll("rect")
      .data((d) => d).enter()
      .append("rect")
      .attr("class", "barStacked")
      .attr("x", (d) => xScale(d.data.name) ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("value", (d) => d[1] - d[0])
      .attr("y", function (d) {
        const height = yScale(d[0]) - yScale(d[1]);
        if (!height || isNaN(height)) return 0;
        if (height < minHeight) {
          return yScale(d[1]) + height - minHeight;
        }
        return yScale(d[1]);
      })
      .attr("height", function (d) {
        const height = yScale(d[0]) - yScale(d[1]) ?? 0;
        if (!height || isNaN(height)) return 0;
        return Math.max(height, minHeight);
      })
      .on("mouseover", function (event, d) {
        const type = d3.select(this.parentElement).attr("type");
        tooltip.select("div").html(`
          <strong>Type: </strong> ${type} <br />
          <strong>Count:</strong> ${formatValue(d[1] - d[0])}${units} <br />`);
        d3.select(this).style("cursor", "pointer");
        showTooltip(event, tooltip);
      })
      .on("mousemove", function (event) {
        showTooltip(event, tooltip);
      })
      .on("mouseout", function () {
        hideTooltip(tooltip);
      });

    // filter type when clicked
    layer.on("click", (_event, d) => {
      createFilter("attrs.type:" + d.key);
    });

    // curtain animation
    if (transition) {
      curtainTransition(
        svgElement,
        totalWidth,
        svgHeight,
        margin.left,
        margin.bottom,
      );
    }
  };

  return (
    <div
      ref={chartRef}
      className="chart d-flex flex-column"
      style={{ height: totalHeight + "px" }}
    >
      <h3 className="alignLeft title">{name}</h3>
      <div ref={tooltipRef} className="tooltip" />
      {noData ? <NoData /> : <svg ref={chartSVGRef} className="h-100" />}
    </div>
  );
}
