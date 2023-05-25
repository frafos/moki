import { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  getTimeBucket,
  getTimeBucketFormat,
  getTimeBucketInt,
} from "@/js/helpers/getTimeBucket";
import { parseTimestamp } from "@/js/helpers/parseTimestamp";
import { showTooltip } from "@/js/helpers/tooltip.js";
import { Colors, createFilter } from "@/gui";

import store from "@/js/store";
import { setTimerange as setReduxTimerange } from "@/js/slices";

import { useAppSelector } from "@hooks/index";
import { useWindowWidth } from "@hooks/useWindowWidth";
import { addDateBrush } from "@/js/d3helpers/addDateBrush";
import { addDateAxis } from "@/js/d3helpers/addDateAxis";
import { curtainTransition } from "@/js/d3helpers/curtainTransition";
import NoData from "./NoData.js";
import { formatValueISO } from "../helpers/formatValue.js";
import { addValueAxis } from "../d3helpers/addValueAxis.js";

// STATE: absolute value or rate
const ABSOLUTE_VALUES = [
  "BLACKLISTED IPs",
  "WHITELISTED IPs",
  "LOAD-SHORTTERM",
  "LOAD-MIDTERM",
  "LOAD-LONGTERM",
  "MEMORY-FREE",
  "MEMORY-USED",
  "MEMORY-CACHED",
  "MEMORY-BUFFERED",
  "CPU-USER",
  "CPU-SYSTEM",
  "CPU-IDLE",
];

interface Props {
  id: string;
  name: string;
  data: any[];
  field?: string;
  hostnames: string[];
}

export default function MultipleLine(
  { id, name, data, field, hostnames }: Props,
) {
  const timerange = store.getState().filter.timerange;
  const setTimerange = (newTimerange: [number, number, string]) => {
    store.dispatch(setReduxTimerange(newTimerange));
  };
  const { navbarExpanded } = useAppSelector((state) => state.view);

  // TODO: should be a parameter
  const isAbsolute = ABSOLUTE_VALUES.includes(name) ? "absolute" : "rate";

  return (
    <MultipleLineRender
      {...{
        id,
        name,
        data,
        absolute: isAbsolute,
        field: field ?? "attrs.hostname",
        hostnames,
        navbarExpanded,
        timerange: [timerange[0], timerange[1]],
        setTimerange,
      }}
    />
  );
}

export interface RenderProps {
  id: string;
  name: string;
  data: any[];
  field: string;
  hostnames: string[];
  absolute: boolean;
  navbarExpanded: boolean;
  timerange: [number, number];
  setTimerange: (newTimerange: [number, number, string]) => void;
}

export function MultipleLineRender(
  {
    id,
    name,
    data,
    field,
    hostnames,
    absolute,
    navbarExpanded,
    timerange,
    setTimerange,
  }: RenderProps,
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartSVGRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const noData = data === undefined || data.length === 0;
  const windowWidth = useWindowWidth();
  const totalHeight = 190;

  const timeBucket = {
    name: getTimeBucket(timerange),
    value: getTimeBucketInt(timerange),
    format: getTimeBucketFormat(timerange),
  };

  useEffect(() => {
    draw(true);
  }, [data, hostnames]);

  useEffect(() => {
    draw(false);
  }, [windowWidth, navbarExpanded]);

  const draw = (transition = false) => {
    if (noData) return;
    if (!chartRef.current || !chartSVGRef.current || !tooltipRef.current) {
      return;
    }

    if (!absolute) {
      const divData = [];
      for (var k = 0; k < data.length; k++) {
        divData.push({
          name: data[k].name,
          values: [],
        });
        for (var l = 0; l < data[k].values.length - 1; l++) {
          if (
            data[k].values[l + 1].value === null ||
            data[k].values[l].value === null
          ) {
            divData[k].values.push({
              date: data[k].values[l].date,
              value: null,
            });
          } else {
            let val = data[k].values[l + 1].value - data[k].values[l].value;
            divData[k].values.push({
              date: data[k].values[l].date,
              value: val < 0 ? 0 : val,
            });
          }
        }
      }
      data = divData;
    }

    // FOR UPDATE: clear chart svg, clean up lost tooltips
    chartSVGRef.current.innerHTML = "";
    tooltipRef.current.innerHTML = "";

    const tooltip = d3.select(tooltipRef.current);
    tooltip.style("visibiliy", "hidden");
    tooltip.append("div");

    const margin = {
      top: 10,
      right: 20,
      bottom: 40,
      left: 55,
    };

    const totalWidth = chartRef.current.clientWidth;
    const svgHeight = chartSVGRef.current.clientHeight;
    const svgWidth = chartSVGRef.current.clientWidth;
    const legendWidth = 110;
    const legendSpacer = 10;

    const width = Math.max(
      100,
      totalWidth - (margin.left + margin.right + legendWidth),
    );
    const height = svgHeight - margin.top - margin.bottom;
    const formatValue = formatValueISO();

    const color = d3.scaleOrdinal().range(Colors);
    const duration = 250;
    const nbValueTicks = 5;

    const lineOpacity = "0.45";
    const lineOpacityHover = "0.85";
    const otherlinesOpacityHover = "0.1";
    const lineStroke = "2.5px";
    const lineStrokeHover = "2.5px";

    const circleOpacity = "0.85";
    const circleOpacityOnlineHover = "0.25";
    const circleRadius = 3;
    const circleRadiusHover = 6;

    // svg with left offset
    const svgElement = d3.select(chartSVGRef.current);
    const svg = svgElement
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // max and min date
    const maxTime = timerange[1] + getTimeBucketInt(timerange);
    const minTime = timerange[0];

    // var width = svgWidth -
    //   (margin.left + margin.right + legendSpacer + legendWidth);
    // if (width < 100) width = 100;

    // min and max value in data
    const minValue = d3.min(data, (chart) => (
      d3.min(chart.values, (d) => d.value)
    )) ?? 0;
    const maxValue = d3.max(data, (chart) => (
      d3.max(chart.values, (d) => d.value)
    )) ?? 1;
    const domain = Math.max(maxValue, nbValueTicks);

    // scale and axis
    const xScale = d3.scaleLinear()
      .range([0, width])
      .domain([minTime, maxTime]);
    const yScale = d3.scaleLinear()
      .domain([minValue, domain + domain / 10])
      .range([height, 0]);

    // axis and selection
    addDateBrush(svg, width, height, xScale, setTimerange);
    addDateAxis(svg, width, height, xScale, timeBucket.format);
    addValueAxis(svg, width, yScale, nbValueTicks);

    // line rendering
    const line = d3.line()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value));

    let lines = svg.append("g")
      .attr("class", "lines")
      .attr("transform", "translate(5,0)");

    for (let row of data) {
      row.values = row.values.map(
        (obj) => (obj.value == null ? { ...obj, value: 0 } : obj),
      );
    }

    lines.selectAll(".line-group")
      .data(data).enter()
      .append("g")
      .attr("class", "line-group")
      .append("path")
      .attr("class", "line")
      .attr("d", (d) => (d.values ? line(d.values) : 0))
      .style(
        "stroke",
        (d, i) => hostnames && hostnames[d.name] ? hostnames[d.name] : color(i),
      )
      .style("opacity", lineOpacity)
      .on("mouseover", function () {
        d3.selectAll(".line")
          .style("opacity", otherlinesOpacityHover);
        d3.selectAll(".circle" + id)
          .style("opacity", circleOpacityOnlineHover);
        d3.select(this)
          .style("opacity", lineOpacityHover)
          .style("stroke-width", lineStrokeHover)
          .style("cursor", "pointer");
      })
      .on("mouseout", function () {
        d3.selectAll(".line")
          .style("opacity", lineOpacity);
        d3.selectAll(".circle" + id)
          .style("opacity", circleOpacity);
        d3.select(this)
          .style("stroke-width", lineStroke)
          .style("cursor", "none");
      });

    // Add circles in the line
    lines.selectAll("circle-group" + id)
      .data(data).enter()
      .append("g")
      .style(
        "fill",
        (d, i) => hostnames && hostnames[d.name] ? hostnames[d.name] : color(i),
      )
      .selectAll("circle" + id)
      .data((d) => d.values).enter()
      .append("g")
      .attr("class", "circle" + id)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        tooltip.select("div").html(
          "<strong>Time: </strong>" + parseTimestamp(d.date) + " + " +
            getTimeBucket(timerange) + "<strong><br/>Value: </strong>" +
            formatValue(d.value) + "<br/> ",
        );
        showTooltip(event, tooltip);
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      })
      .on("mousemove", function (event) {
        showTooltip(event, tooltip);
      })
      .append("circle")
      .attr("cx", (d) => xScale(d.date))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", circleRadius)
      .style("opacity", circleOpacity)
      .on("mouseover", function () {
        d3.select(this)
          .transition()
          .duration(duration)
          .attr("r", circleRadiusHover);
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(duration)
          .attr("r", circleRadius);
      });

    const legend = svg.append("g")
      .selectAll(".legend")
      .data(data)
      .enter().append("g")
      .attr("class", "legend")
      .each(function (_d) {
        d3.select(this)
          .on("click", (_event, d) => createFilter(`${field}:"${d.name}"`));
      });

    legend.append("rect")
      .attr("x", (_d, i) => 0)
      .attr("y", (_d, i) => (i < 7) ? i * 17 : 0)
      .attr("width", (_d, i) => (i < 7) ? 10 : 0)
      .attr("height", (_d, i) => (i < 7) ? 10 : 0)
      .style("fill", (d, i) => {
        if (i >= 7 || !hostnames || !hostnames[d.name]) {
          return color(i);
        }
        return hostnames[d.name];
      });

    legend.append("text")
      .attr("x", 20)
      .attr("y", (_d, i) => (i < 7) ? (i * 17 + 5) : 0)
      .text(function (d, i) {
        if (i >= 7) return "";
        if (d.name.length > 20) return d.name.substring(0, 20) + "...";
        return d.name;
      })
      .append("svg:title")
      .text((d) => d.name);

    legend.raise();
    legend.attr(
      "transform",
      "translate(" +
        (svgWidth - legendWidth - margin.left - margin.right + legendSpacer) +
        ",0)",
    );

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
      <h3 className="alignLeft title" style={{ "float": "inherit" }}>
        {name} <span className="smallText">(interval: {timeBucket.name})</span>
      </h3>
      <div ref={tooltipRef} className="tooltip" />
      {noData ? <NoData /> : <svg ref={chartSVGRef} className="h-100" />}
    </div>
  );
}
