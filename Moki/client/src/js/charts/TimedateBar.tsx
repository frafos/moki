import { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  getTimeBucket,
  getTimeBucketFormat,
  getTimeBucketInt,
} from "../helpers/getTimeBucket";
import { Colors } from "../../gui";

import store from "@/js/store";
import { setTimerange as setReduxTimerange } from "@/js/slices";
import NoData from "./NoData";

import { useAppSelector } from "../hooks";
import { useWindowWidth } from "../hooks/useWindowWidth";
import { addDateBrush } from "@/js/d3helpers/addDateBrush";
import { curtainTransition } from "@/js/d3helpers/curtainTransition";
import { addGridlines } from "@/js/d3helpers/addGridlines";
import {
  hideTooltip,
  showTooltip,
  tooltipTimeFormat,
} from "@/js/d3helpers/tooltip";
import { formatDuration } from "@/js/helpers/formatTime";
import {
  hideItemSelection,
  showItemSelection,
} from "@/js/d3helpers/itemSelection";
import { addDateAxis } from "@/js/d3helpers/addDateAxis";
import { formatValueISO } from "@/js/helpers/formatValue";

interface Props {
  data: any[];
  name: string;
  units: string;
}

export default function TimedateBar({ data, name }: Props) {
  const timerange = store.getState().filter.timerange;
  const setTimerange = (newTimerange: [number, number, string]) => {
    store.dispatch(setReduxTimerange(newTimerange));
  };
  const { navbarExpanded } = useAppSelector((state) => state.view);
  const duration = name.includes("DURATION");

  // TODO: should be a parameter
  const colorScale = d3.scaleOrdinal(Colors);
  let mapColor = (_value: number) => colorScale("0");
  if (name === "ASR OVER TIME") {
    mapColor = (value: number) => {
      if (value >= 50) return "#58a959";
      else if (value >= 20) return "#f58231";
      return "#c41d03";
    };
  }

  return (
    <TimedateBarRender
      {...{
        data,
        name,
        duration,
        mapColor,
        timerange: [timerange[0], timerange[1]],
        setTimerange,
        navbarExpanded,
      }}
    />
  );
}

export interface RenderProps {
  data: any[];
  name: string;
  duration: boolean;
  timerange: [number, number];
  setTimerange: (newTimerange: [number, number, string]) => void;
  navbarExpanded: boolean;
  mapColor: (value: number) => string;
}

export function TimedateBarRender(
  {
    data,
    name,
    duration,
    timerange,
    setTimerange,
    navbarExpanded,
    mapColor,
  }: RenderProps,
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartSVGRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const noData = data === undefined || data.length == 0;

  const totalHeight = 220;
  const windowWidth = useWindowWidth();

  const timeBucket = {
    name: getTimeBucket(timerange),
    value: getTimeBucketInt(timerange),
    format: getTimeBucketFormat(timerange),
  };

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

    const margin = {
      top: 10,
      bottom: 30,
      right: 45,
      left: 55,
    };

    const barOffset = 1;

    const totalWidth = chartRef.current.clientWidth;
    const svgHeight = chartSVGRef.current.clientHeight;
    const width = Math.max(100, totalWidth - (margin.left + margin.right));
    const height = svgHeight - margin.top - margin.bottom;
    const formatValue = (suffix = false) => (d: d3.NumberValue) => (
      duration
        ? formatDuration(d.valueOf(), suffix)
        : formatValueISO(d)
    );

    // svg with left offset
    const svgElement = d3.select(chartSVGRef.current);
    const svg = svgElement
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // max and min time in data
    const minDateTime = d3.min(data, (chart) => chart.key) ?? timerange[0];
    const maxDateTime = d3.max(data, (chart) => chart.key) ?? Infinity;

    // max and min time
    const minTime = Math.min(minDateTime, timerange[0]);
    const maxTime = Math.max(maxDateTime, timerange[1] + timeBucket.value);

    // max value in data
    let maxValue = d3.max(data, (d) => d.agg.value);
    let nbTicks = 5;
    if (duration) {
      maxValue = Math.max(maxValue, 360);
      nbTicks = Math.min(nbTicks, Math.round(maxValue / 60));
    }
    const domain = maxValue + maxValue / 3;

    // scale and axis
    const xScale = d3.scaleLinear()
      .range([0, width])
      .domain([minTime, maxTime]);
    const yScale = d3.scaleLinear()
      .range([height, 0])
      .domain([0, domain]);
    const yAxis = d3.axisLeft(yScale).ticks(nbTicks).tickFormat(formatValue());

    // date axis and selection
    addDateBrush(svg, width, height, xScale, setTimerange);
    addDateAxis(svg, width, height, xScale, timeBucket.format);

    // y axis rendering
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .call((g) => addGridlines(g, width));

    // data bars
    svg.selectAll(".bar")
      .data(data).enter()
      .append("rect")
      .attr("class", "bar")
      .attr("value", (d) => d.agg.value)
      .attr("fill", (d) => mapColor(d.agg.value))
      .attr("x", (d) => xScale(d.key))
      .attr("width", function (d) {
        const beginTime = d.key;
        const endTime = beginTime + timeBucket.value;
        if (beginTime > minTime && endTime < maxTime) {
          return xScale(endTime) - xScale(beginTime) - barOffset;
        }
        return 0;
      })
      .attr("y", (d) => yScale(d.agg?.value) ?? 0)
      .attr(
        "height",
        (d) => ((d.agg && d.agg.value > 60) ? height - yScale(d.agg.value) : 0),
      )
      .on("mouseover", function (event, d) {
        const formatedValue = formatValue(true)(d.agg.value);
        showTooltip(
          event,
          tooltip,
          tooltipTimeFormat(formatedValue, d.key, timeBucket.name),
        );
        showItemSelection(d3.select(this));
      })
      .on("mouseout", function () {
        hideTooltip(tooltip);
        hideItemSelection(d3.select(this));
      })
      .on("mousemove", function (event) {
        showTooltip(event, tooltip);
      });

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
