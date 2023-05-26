import { useEffect, useMemo, useRef } from "react";
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
import { addDateBrush } from "@/js/d3helpers/addDateBrush";
import { addDateAxis } from "@/js/d3helpers/addDateAxis";
import {
  hideTooltip,
  showTooltip,
  tooltipTimeFormat,
} from "@/js/d3helpers/tooltip";
import { addValueAxis } from "../d3helpers/addValueAxis";
import { formatValueISO } from "../helpers/formatValue";
import { Colors, createFilter } from "@/gui";

interface Chart {
  name: string;
  values: ChartData[];
}

interface ChartData {
  date: number;
  value: number;
}

export interface Props {
  data: Chart[];
  units: string;
  name: string;
  area: boolean;
  rate?: boolean;
  height?: number;
  field?: string;
  hostnames?: Record<string, string>;
}

export default function MultipleLines(
  { name, rate = false, height, ...props }: Props,
) {
  const timerange = store.getState().filter.timerange;
  const setTimerange = (newTimerange: [number, number, string]) => {
    store.dispatch(setReduxTimerange(newTimerange));
  };
  const { navbarExpanded } = useAppSelector((state) => state.view);

  // TODO: as parameters
  let colors = Colors;
  if (name === "PARALLEL REGS") {
    colors = ["#caa547", "#A5CA47"];
  } else if (name === "INCIDENTS") {
    colors = ["#caa547", "#69307F"];
  }

  return (
    <MultipleLineRender
      {...{
        name,
        colors,
        absolute: !rate,
        navbarExpanded,
        timerange: [timerange[0], timerange[1]],
        setTimerange,
        totalHeight: height,
        ...props,
      }}
    />
  );
}

export interface RenderProps {
  data: Chart[];
  units: string;
  name: string;
  totalHeight?: number;
  area: boolean;
  absolute: boolean;
  colors: string[];
  navbarExpanded: boolean;
  timerange: [number, number];
  setTimerange: (newTimerange: [number, number, string]) => void;
  field?: string;
  hostnames?: Record<string, string>;
}

export function MultipleLineRender(
  {
    data,
    units,
    area,
    name,
    absolute,
    totalHeight = 190,
    colors = Colors,
    navbarExpanded,
    field,
    hostnames,
    timerange,
    setTimerange,
  }: RenderProps,
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartSVGRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const noData = data === undefined || data.length === 0 ||
    (data[0].values.length === 0 && data[1].values.length === 0);
  const windowWidth = useWindowWidth();

  const timeBucket = {
    name: getTimeBucket(timerange),
    value: getTimeBucketInt(timerange),
    format: getTimeBucketFormat(timerange),
  };

  // transform to rate if needed
  const transformedData = useMemo(() => {
    if (absolute || noData) return data;

    return data.map((chart) => {
      let values = chart.values;
      for (let i = 0; i < values.length; i++) {
        const current = values[i];
        const next = values[i + 1];
        if (next == undefined) continue;

        const valueDiff = next.value - current.value;
        const timeDiff = next.date - current.date;
        if (timeDiff === 0) continue;

        values[i].value = valueDiff / (timeDiff / 1000);
      }

      values.pop();
      values = values.filter((data) => data.value > 0);

      return { ...chart, values };
    });
  }, [absolute, data]);

  useEffect(() => {
    draw(true);
  }, [transformedData]);

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
      right: 20,
      bottom: 40,
      left: 50,
    };

    const totalWidth = chartRef.current.clientWidth;
    const svgHeight = chartSVGRef.current.clientHeight;

    const legendWidth = 110;
    const legendSpacer = 10;

    const width = Math.max(
      100,
      totalWidth - (margin.left + margin.right + legendWidth),
    );
    const height = svgHeight - margin.top - margin.bottom;

    data = transformedData;
    const colorScale = d3.scaleOrdinal<number, string>().range(colors);
    const labels = data.map((chart) => chart.name);
    const getColor = (i: number) => {
      const name = labels[i];
      if (hostnames && hostnames[name]) return hostnames[name];
      return colorScale(i);
    };

    const duration = 250;
    const nbValueTicks = 5;

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

    // max value in data
    const maxValue = d3.max(data, (chart) => (
      d3.max(chart.values, (d) => d.value)
    )) ?? nbValueTicks;

    // add offset to max based on id
    const domain = Math.max(maxValue, nbValueTicks);

    // scale and axis
    const xScale = d3.scaleLinear()
      .range([0, width])
      .domain([minTime, maxTime]);
    const yScale = d3.scaleLinear().domain([0, domain + domain / 8])
      .range([height, 0]);

    // date and values axis and selection
    addDateBrush(svg, width, height, xScale, setTimerange);
    addDateAxis(svg, width, height, xScale, timeBucket.format);
    addValueAxis(svg, width, yScale, nbValueTicks);

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
        .style("fill", getColor(index))
        .style("fill-opacity", area ? areaOpacity : 0)
        .style("stroke", getColor(index))
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
        .style("fill-opacity", area ? areaOpacityHover : 0)
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
          .attr("fill", getColor(i))
          .style("opacity", circleOpacity)
          .on("mouseover", function (event, d) {
            styleAreaHover(i);
            d3.select(this).transition().duration(duration)
              .attr("r", circleRadiusHover);
            showTooltip(
              event,
              tooltip,
              tooltipTimeFormat(
                formatValueISO(d.value),
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

    // area and/or lines rendering

    const areaGen = d3.area<ChartData>()
      .x((d) => xScale(d.date))
      .y1((d) => yScale(d.value))
      .y0(height);

    const lineGen = d3.line<ChartData>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value));

    const areasFill = areas
      .append("g")
      .attr("class", "area-fill")
      .append("path")
      .attr(
        "d",
        (d) => (area ? areaGen(d.values) : lineGen(d.values)),
      );

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

    if (!area) {
      areasFill.attr("pointer-events", "visibleStroke");
    }

    // legend
    const legend = svg.append("g")
      .selectAll(".legend")
      .data(data).enter()
      .append("g")
      .attr("class", "legend")
      .each(function (_d, i) {
        const labelField = d3.select(this);
        labelField
          .on("mouseover", () => styleAreaHover(i))
          .on("mouseout", () => styleAreaDefault(i));

        if (field == undefined) return;
        labelField
          .on("click", () => createFilter(`${field}:"${_d.name}"`));
      });

    legend.append("rect")
      .attr("y", (_d, i) => (i * 15))
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", (_d, i) => getColor(i));

    legend.append("text")
      .attr("height", 20)
      .attr("x", 20)
      .attr("y", (_d, i) => (i * 15) + 8)
      .text((d) => d.name);

    legend.raise()
      .attr("transform", `translate(${width + legendSpacer}, 0)`);

    // curtain animation
    if (transition) {
      curtainTransition(areas, width, svgHeight, {
        bottom: margin.bottom * 1.5,
        left: 0,
      });
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
