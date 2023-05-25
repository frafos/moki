import { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  getTimeBucket,
  getTimeBucketFormat,
  getTimeBucketInt,
} from "../helpers/getTimeBucket";

import store from "@/js/store";
import { setTimerange as setReduxTimerange } from "@/js/slices";
import NoData from "./NoData";
import { useWindowWidth } from "@hooks/useWindowWidth";
import { useAppSelector } from "@hooks/index";
import { curtainTransition } from "@/js/d3helpers/curtainTransition";
import { addGridlines } from "@/js/d3helpers/addGridlines";
import { addDateBrush } from "@/js/d3helpers/addDateBrush";
import { addDateAxis } from "@/js/d3helpers/addDateAxis";
import {
  hideTooltip,
  showTooltip,
  tooltipTimeFormat,
} from "@/js/d3helpers/tooltip";

interface Chart {
  name: string;
  values: ChartData[];
}

interface ChartData {
  date: number;
  value: number;
}

export interface MultipleAreaChartProps {
  data: Chart[];
  units: string;
  name: string;
}

export default function MultipleAreaChart(
  { data, units, name }: MultipleAreaChartProps,
) {
  const timerange = store.getState().filter.timerange;
  const setTimerange = (newTimerange: [number, number, string]) => {
    store.dispatch(setReduxTimerange(newTimerange));
  };
  const { navbarExpanded } = useAppSelector((state) => state.view);

  // TODO: as parameters
  let color = d3.scaleOrdinal<string, string>().range(["#caa547", "#30427F"]);
  if (name === "PARALLEL REGS") {
    color = d3.scaleOrdinal<string, string>().range(["#caa547", "#A5CA47"]);
  } else if (name === "INCIDENTS") {
    color = d3.scaleOrdinal<string, string>().range(["#caa547", "#69307F"]);
  }

  return (
    <MultipleAreaChartRender
      {...{
        data,
        units,
        name,
        color,
        navbarExpanded,
        timerange: [timerange[0], timerange[1]],
        setTimerange,
      }}
    />
  );
}

export interface MultipleAreaChartRenderProps {
  data: Chart[];
  units: string;
  name: string;
  color: d3.ScaleOrdinal<string, string, never>;
  navbarExpanded: boolean;
  timerange: [number, number];
  setTimerange: (newTimerange: [number, number, string]) => void;
}

export function MultipleAreaChartRender(
  { data, units, name, color, navbarExpanded, timerange, setTimerange }:
    MultipleAreaChartRenderProps,
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartSVGRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const noData = data === undefined || data.length === 0 ||
    (data[0].values.length === 0 && data[1].values.length === 0);
  const windowWidth = useWindowWidth();
  const totalHeight = 235;

  const timeBucket = {
    name: getTimeBucket(timerange),
    value: getTimeBucketInt(timerange),
    format: getTimeBucketFormat(timerange),
  };

  useEffect(() => {
    draw(true);
  }, [data]);

  useEffect(() => {
    draw(false);
  }, [windowWidth, navbarExpanded]);

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

    const margin = {
      top: 20,
      right: 35,
      bottom: 40,
      left: 50,
    };

    const totalWidth = chartRef.current.clientWidth;
    const svgHeight = chartSVGRef.current.clientHeight;
    const width = Math.max(100, totalWidth - (margin.left + margin.right));
    const height = svgHeight - margin.top - margin.bottom;
    const formatValue = (
      d: d3.NumberValue,
    ) => (d.valueOf() <= 1 ? d.toString() : d3.format(".2s")(d));
    const duration = 250;

    const otherAreasOpacityHover = 0.1;
    const areaOpacity = 0.45;
    const areaOpacityHover = 0.8;
    const areaStrokeOpacity = 0.4;
    const areaStrokeOpacityHover = 1;
    const areaStroke = "2px";

    const circleOpacity = "0.85";
    const circleRadius = 3;
    const circleRadiusHover = 6;

    // svg with left offset
    const svgElement = d3.select(chartSVGRef.current);
    const svg = svgElement
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // max and min time in data
    const minDateTime = d3.min(data, (chart) => (
      d3.min(chart.values, (d) => d.date)
    )) ?? timerange[0];
    const maxDateTime = d3.max(data, (chart) => (
      d3.max(chart.values, (d) => d.date)
    )) ?? Infinity;

    // max and min time
    const minTime = Math.min(minDateTime, timerange[0]);
    const maxTime = Math.max(maxDateTime, timerange[1] + timeBucket.value);

    // min and max value in data
    const minValue = d3.min(data, (chart) => (
      d3.min(chart.values, (d) => d.value)
    )) ?? 0;
    const maxValue = d3.max(data, (chart) => (
      d3.max(chart.values, (d) => d.value)
    )) ?? 1;

    // add offset to max based on id
    let domain = 1;
    if (maxValue !== 0) {
      const offset = maxValue / 3; // id === "parallelRegs"
      // ? (maxValue - minValue) : maxValue / 3;
      domain = maxValue + offset;
    }

    // scale and axis
    const xScale = d3.scaleLinear()
      .range([0, width])
      .domain([minTime, maxTime]);
    const yScale = d3.scaleLinear().domain([minValue, domain])
      .range([height, 0]);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(formatValue);

    // date axis and selection
    addDateBrush(svg, width, height, xScale, setTimerange);
    addDateAxis(svg, width, height, xScale, timeBucket.format);

    // y axis rendering
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .call((g) => addGridlines(g, width));

    // area and points
    const areas = svg
      .append("g")
      .attr("class", "area-group")
      .selectAll(".area-group")
      .data(data).enter()
      .append("g")
      .attr("class", "area");

    const styleAreaDefault = (index: number) => {
      areasFill.style("opacity", 1.0);
      areas.raise();
      circles.selectAll(".circle").style("opacity", circleOpacity);
      const areaChart = areas.filter((_d, i) => i === index)
        .style("cursor", "pointer");
      areaChart.selectAll(".area-fill")
        .selectAll("path")
        .style("fill", color(index.toString()))
        .style("fill-opacity", areaOpacity)
        .style("stroke", color(index.toString()))
        .style("stroke-opacity", areaStrokeOpacity)
        .style("stroke-width", areaStroke);
    };

    const styleAreaHover = (index: number) => {
      areasFill.style("opacity", otherAreasOpacityHover)
        .style("select", "none");
      circles.selectAll(".circle").style("opacity", otherAreasOpacityHover);
      const areaChart = areas.filter((_d, i) => i === index);
      areaChart.raise();
      areaChart.selectAll(".circle").style("opacity", circleOpacity);
      areaChart.selectAll(".area-fill")
        .select("path")
        .style("opacity", 1.0)
        .style("fill-opacity", areaOpacityHover)
        .style("stroke-opacity", areaStrokeOpacityHover);
    };

    // circle data point in area
    const circles = areas
      .append("g")
      .attr("class", "circle-group");

    // individual circle rendering

    circles
      .each(function (d, i) {
        const circleChart = d3.select(this);
        circleChart
          .selectAll(".circle")
          .data(d.values).enter()
          .append("circle")
          .attr("class", "circle")
          .attr("cx", (d) => xScale(d.date))
          .attr("cy", (d) => yScale(d.value))
          .attr("r", circleRadius)
          .attr("fill", color(i.toString()))
          .style("opacity", circleOpacity)
          .on("mouseover", function (event, d) {
            styleAreaHover(i);
            d3.select(this).transition().duration(duration)
              .attr("r", circleRadiusHover);
            showTooltip(
              event,
              tooltip,
              tooltipTimeFormat(
                formatValue(d.value),
                d.date,
                timeBucket.name,
                units,
              ),
            );
          })
          .on("mouseout", function () {
            styleAreaDefault(i);
            d3.select(this).transition().duration(duration)
              .attr("r", circleRadius);
            hideTooltip(tooltip);
          });
      });

    // area rendering

    // data area
    const area = d3.area<ChartData>()
      .x((d) => xScale(d.date))
      .y1((d) => yScale(d.value))
      .y0(height);

    const areasFill = areas
      .append("g")
      .attr("class", "area-fill")
      .append("path")
      .attr("d", (d) => area(d.values));

    areasFill
      .each(function (_d, i) {
        const chartArea = d3.select(this);
        styleAreaDefault(i);
        return chartArea
          .on("mouseover", function () {
            styleAreaHover(i);
          })
          .on("mouseout", function () {
            styleAreaDefault(i);
          });
      });

    // legend
    const legend = svg.append("g")
      .selectAll(".legend")
      .data(data).enter()
      .append("g")
      .attr("class", "legend")
      .each(function (_d, i) {
        d3.select(this)
          .on("mouseover", () => styleAreaHover(i))
          .on("mouseout", () => styleAreaDefault(i));
      });

    legend.append("rect")
      .attr("x", width - 80)
      .attr("y", (_d, i) => (i * 15))
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", (_d, i) => color(i.toString()));

    legend.append("text")
      .attr("height", 20)
      .attr("x", width - 60)
      .attr("y", (_d, i) => (i * 15) + 10)
      .text((d) => d.name);

    // curtain animation
    if (transition) {
      curtainTransition(svgElement, totalWidth, svgHeight, margin);
    }
  };

  return (
    <div
      ref={chartRef}
      className="chart d-flex flex-column"
      style={{ height: totalHeight + "px" }}
    >
      <h3 className="alignLeft title">
        {name} <span className="smallText">(interval: {timeBucket.name})</span>
      </h3>
      <div ref={tooltipRef} className="tooltip" />
      {noData ? <NoData /> : <svg ref={chartSVGRef} className="h-100" />}
    </div>
  );
}
