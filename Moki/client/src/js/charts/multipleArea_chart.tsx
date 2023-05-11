import { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  getTimeBucket,
  getTimeBucketFormat,
  getTimeBucketInt,
} from "../helpers/getTimeBucket";
import { parseTimestamp } from "../helpers/parseTimestamp";
import { setTickNrForTimeXAxis } from "../helpers/chart";
import { hideTooltip, showTooltip } from "../helpers/tooltip.js";
import { Colors } from "../../gui";

import store from "@/js/store";
import { setTimerange as setReduxTimerange } from "@/js/slices";
import NoData from "./NoData";

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
  id: string;
  units: string;
  name: string;
  width: number;
}

export default function MultipleAreaChart(
  { data, id, units, name, width }: MultipleAreaChartProps,
) {
  const timerange = store.getState().filter.timerange;
  const setTimerange = (newTimerange: [number, number, string]) => {
    store.dispatch(
      setReduxTimerange(newTimerange),
    );
  };

  // TODO: as parameters
  let color = d3.scaleOrdinal<string, string>().range(Colors);
  if (name === "PARALLEL CALLS") {
    color = d3.scaleOrdinal<string, string>().range(["#caa547", "#30427F"]);
  } else if (name === "PARALLEL REGS") {
    color = d3.scaleOrdinal<string, string>().range(["#caa547", "#A5CA47"]);
  } else if (name === "INCIDENTS") {
    color = d3.scaleOrdinal<string, string>().range(["#caa547", "#69307F"]);
  }

  return (
    <MultipleAreaChartRender
      {...{
        data,
        id,
        units,
        name,
        width,
        color,
        timerange: [timerange[0], timerange[1]],
        setTimerange,
      }}
    />
  );
}

export interface MultipleAreaChartRenderProps {
  data: Chart[];
  id: string;
  units: string;
  name: string;
  width: number;
  color: d3.ScaleOrdinal<string, string, never>;
  timerange: [number, number];
  setTimerange: (newTimerange: [number, number, string]) => void;
}

export function MultipleAreaChartRender(
  { data, id, units, name, width, color, timerange, setTimerange }:
    MultipleAreaChartRenderProps,
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartSVGRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const noData = data === undefined || data.length === 0 ||
    (data[0].values.length === 0 && data[1].values.length === 0);

  const totalHeight = 235;
  const timeBucket = {
    name: getTimeBucket(timerange),
    value: getTimeBucketInt(timerange),
    format: getTimeBucketFormat(timerange),
  };

  useEffect(() => {
    if (noData) return;
    draw();
  }, [data, width]);

  const draw = () => {
    if (!chartRef.current || !chartSVGRef.current || !tooltipRef.current) {
      return;
    }

    // FOR UPDATE: clear chart svg, clean up lost tooltips
    chartSVGRef.current.innerHTML = "";
    tooltipRef.current.innerHTML = "";

    units = units ? " (" + units + ")" : "";
    const margin = {
      top: 20,
      right: 45,
      bottom: 40,
      left: 100,
    };

    const totalWidth = chartRef.current.clientWidth;
    const svgHeight = chartSVGRef.current.clientHeight;
    const width = Math.max(100, totalWidth - (margin.left + margin.right));
    const height = svgHeight - margin.top - margin.bottom;
    const duration = 250;

    const otherAreasOpacityHover = 0.1;
    const areaOpacity = 0.45;
    const areaOpacityHover = 0.7;
    const areaStrokeOpacity = 0.4;
    const areaStrokeOpacityHover = 1;
    const areaStroke = "2px";

    const circleOpacity = "0.85";
    const circleRadius = 3.5;
    const circleRadiusHover = 6;

    const svg = d3.select(chartSVGRef.current)
      .append("g");

    // max and min time in data
    const minDateTime = d3.min(data, (chart) => (
      d3.min(chart.values, (d) => d.date)
    ));
    const maxDateTime = d3.max(data, (chart) => (
      d3.max(chart.values, (d) => d.date)
    ));

    //max and min time
    const minTime = minDateTime ? minDateTime : timerange[0];
    const maxTime = maxDateTime ? maxDateTime : timerange[1] + timeBucket.value;

    // min and max value in data
    const minValue = d3.min(data, (chart) => (
      d3.min(chart.values, (d) => d.value)
    )) ?? 0;
    const maxValue = d3.max(data, (chart) => (
      d3.max(chart.values, (d) => d.value)
    )) ?? 0;

    // add offset to max based on id
    let domain = 1;
    if (maxValue !== 0) {
      const offset = id === "parallelRegs"
        ? (maxValue - minValue)
        : maxValue / 3;
      domain = maxValue + offset;
    }

    // scale and axis
    const xScale = d3.scaleLinear()
      .range([0, width])
      .domain([minTime, maxTime]);
    const yScale = d3.scaleLinear().domain([minValue, domain])
      .range([height, 0]);
    const xAxis = d3.axisBottom(xScale)
      .ticks(7)
      .tickFormat(
        d3.timeFormat(timeBucket.format) as (
          dv: number | { valueOf(): number },
        ) => string,
      );
    const yAxis = d3.axisLeft(yScale).ticks(5);

    // left offset
    svg.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // x axis rendering
    setTickNrForTimeXAxis(xAxis);
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis);

    // y axis rendering
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .call((g) =>
        // grid lines
        g.selectAll(".tick line").clone()
          .attr("x2", width)
          .attr("stroke-opacity", 0.1)
      );

    // date selection
    svg.append("g")
      .call(
        d3.brushX()
          .extent([[0, 0], [width, height]])
          .on("end", onBrushEnd),
      );

    function onBrushEnd(event: any) {
      // Only transition after input.
      if (!event.sourceEvent) return;
      // Ignore empty selections.
      if (!event.selection) return;
      const extent = event.selection;
      const timestamp_gte = xScale.invert(extent[0]);
      const timestamp_lte = xScale.invert(extent[1]);
      const timestamp_readiable =
        parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " - " +
        parseTimestamp(new Date(Math.trunc(timestamp_lte)));
      setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]);
    }

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
      areas.raise()
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
    const tooltip = d3.select(tooltipRef.current);
    tooltip.style("visibiliy", "hidden");
    tooltip.append("div");

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
            tooltip.select("div").html(`<strong>Time: </strong>
              ${parseTimestamp(d.date)} + ${timeBucket.name} <br />
              <strong>Value: </strong> ${
              d3.format(",")(d.value)
            } ${units} <br/>`);
            showTooltip(event, tooltip);
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
    const legend = svg.selectAll(".legend")
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
