import { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  getTimeBucket,
  getTimeBucketFormat,
  getTimeBucketInt,
} from "../helpers/getTimeBucket";
import { ColorsGreen, ColorsRedGreen, createFilter } from "../../gui";

import store from "@/js/store";
import { setTimerange as setReduxTimerange } from "@/js/slices";

import { useAppSelector } from "@hooks/index";
import { useWindowWidth } from "@hooks/useWindowWidth";
import NoData from "./NoData";
import { curtainTransition } from "@/js/d3helpers/curtainTransition";
import { addDateBrush } from "@/js/d3helpers/addDateBrush";
import { MN_TIME } from "@/data/utils/date";
import {
  hideTooltip,
  showTooltip,
  tooltipTimeFormat,
} from "@/js/d3helpers/tooltip";
import {
  hideItemSelection,
  showItemSelection,
} from "@/js/d3helpers/itemSelection";
import { addDateAxis } from "@/js/d3helpers/addDateAxis";

export interface ChartData {
  attr1: number;
  attr2: string;
  value: string | number;
  perChange?: number;
}

interface Props {
  data: ChartData[];
  field: string;
  units: string;
  name: string;
}

export default function TimedateHeatmap(
  { data, field, name, units }: Props,
) {
  const timerange = store.getState().filter.timerange;
  const setTimerange = (newTimerange: [number, number, string]) => {
    store.dispatch(setReduxTimerange(newTimerange));
  };
  const { navbarExpanded } = useAppSelector((state) => state.view);

  // TODO: as parameters
  // fix for TYPE DATE HEATMAP, constant margin
  let marginLeft = 150;
  if (name === "TYPE DATE HEATMAP") {
    marginLeft = 100;
  } else if (name === "NODES - ACTIVITY" || name === "NODES - KEEP ALIVE") {
    marginLeft = 70;
  }

  // special color scale
  let colorOneShade = ColorsGreen;
  if (
    (name.includes("RATIO") && !name.includes("DURATION")) ||
    name.includes("CALL-ATTEMPS") || name.includes("ERROR")
  ) {
    colorOneShade = ColorsRedGreen;
  }

  // map color
  const mapColor = {
    "CA AVAILABILITY": (value: string | number) => ({
      "partially": "#fecac2",
      "unreachable": "#fc6047",
      "reachable": "#4f9850",
    }[value] ?? ""),
    "AVG MoS": (value: string | number) => {
      if (typeof value === "string") return "#4f9850";
      if (value <= 2.58) return "#FE2E2E";
      if (value <= 3.1) return "#F79F81";
      if (value <= 3.6) return "#F3E2A9";
      if (value <= 4.03) return "#95c196";
      return "#4f9850";
    },
  }[name] ?? undefined;

  // value
  let mapValue = undefined;
  if (name === "CA AVAILABILITY") {
    mapValue = (value: string) => ({
      "partially": "Partially reachable",
      "unreachable": "Unreachable",
      "reachable": "Reachable",
    }[value] ?? "");
  }

  return (
    <TimedateHeatmapRender
      {...{
        data,
        field,
        name,
        units,
        marginLeft,
        colorOneShade,
        navbarExpanded,
        timerange: [timerange[0], timerange[1]],
        setTimerange,
        mapColor,
        mapValue,
      }}
    />
  );
}

export interface RenderProps {
  data: ChartData[];
  field: string;
  units: string;
  name: string;
  marginLeft: number;
  colorOneShade: string[];
  navbarExpanded: boolean;
  timerange: [number, number];
  setTimerange: (newTimerange: [number, number, string]) => void;
  mapValue?: (value: string) => string;
  mapColor?: (value: string | number) => string;
}

export function TimedateHeatmapRender(
  {
    data,
    field,
    name,
    units,
    navbarExpanded,
    marginLeft,
    colorOneShade,
    timerange,
    setTimerange,
    mapValue,
    mapColor,
  }: RenderProps,
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartSVGRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const noData = data === undefined || data.length == 0;
  const minHeight = 180;
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

    const formatedUnits = units ? "(" + units + ")" : "";
    const margin = {
      top: 10,
      right: 40,
      bottom: 40,
      left: marginLeft,
    };

    const labels = new Set(data.map((item) => item.attr2));

    const cellHeight = 13;
    const cellOffset = 1;
    const offset = 5;

    const maxHeight = ((cellHeight + cellOffset) * labels.size) +
      (margin.top + margin.bottom) + offset;
    const height = maxHeight - (margin.top + margin.bottom);
    const totalWidth = chartRef.current.clientWidth;
    const width = totalWidth - (margin.left + margin.right);

    const buckets = 8;
    const colorScale = d3.scaleQuantile()
      .domain([0, buckets - 1, d3.max(data, (d) => d.value as number)])
      .range(colorOneShade as Iterable<number>);

    // svg with left offset
    const svgElement = d3.select(chartSVGRef.current);
    const svg = svgElement
      .style("height", maxHeight)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // max and min date
    // minus one minute fix for round up
    const minTime = timerange[0] - MN_TIME;
    const maxTime = timerange[1] + timeBucket.value;

    // scale and axis
    const xScale = d3.scaleLinear()
      .range([0, width])
      .domain([minTime, maxTime]);
    const yScale = d3.scaleBand()
      .domain(labels)
      .range([0, height])
      .paddingInner(.2).paddingOuter(.2);
    const yAxis = d3.axisLeft(yScale)
      .tickFormat((d) => (d.length > 20 ? d.substring(0, 20) + "..." : d));

    // date axis and selection
    addDateBrush(svg, width, height, xScale, setTimerange);
    addDateAxis(svg, width, height, xScale, timeBucket.format);

    // y axis rendering
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .selectAll("text")
      .style("cursor", "pointer")
      .on("click", (_event, d) => {
        createFilter(field + ': "' + d + '"');
      });

    // cells rendering
    const rect = svg.selectAll("cell")
      .data(data).enter()
      .append("g").append("rect")
      .attr("class", "cell")
      .style("opacity", 0)
      .attr("x", (d) => xScale(d.attr1))
      .attr("y", (d) => yScale(d.attr2) ?? 0)
      .attr("width", function (_d, i) {
        const beginTime = data[i].attr1;
        const endTime = beginTime + timeBucket.value;
        if (beginTime > minTime && endTime < maxTime) {
          return xScale(endTime) - xScale(beginTime) - cellOffset;
        }
        return 0;
      })
      .attr("height", cellHeight)
      .attr("value", (d) => d.value)
      .attr(
        "fill",
        (d) => (mapColor ? mapColor(d.value) : colorScale(d.value as number)),
      )
      .attr("rx", 2)
      .attr("ry", 2)
      .style("opacity", 1)
      .on("mouseover", function (event, d) {
        const formatedValue = mapValue
          ? mapValue(d.value as string)
          : (d.value as number).toFixed(2);
        showTooltip(
          event,
          tooltip,
          tooltipTimeFormat(
            formatedValue,
            d.attr1,
            timeBucket.name,
            units,
            d.attr2,
          ),
        );

        showItemSelection(d3.select(this));
      })
      .on("mousemove", function (event) {
        showTooltip(event, tooltip);
      })
      .on("mouseout", function () {
        hideItemSelection(d3.select(this));
        hideTooltip(tooltip);
      });

    // filter type when clicked
    rect.on("click", (_event, d) => {
      createFilter(field + ': "' + d.attr2 + '"');
    });

    if (transition) {
      curtainTransition(svgElement, totalWidth, maxHeight, margin);
    }
  };

  const bucket = getTimeBucket(timerange);
  return (
    <div
      ref={chartRef}
      className="chart d-flex flex-column"
      style={{ height: noData ? minHeight : "auto" }}
    >
      <h3 className="alignLeft title">
        {name} <span className="smallText">(interval: {bucket})</span>
      </h3>
      <div ref={tooltipRef} className="tooltip" />
      {noData ? <NoData /> : <svg ref={chartSVGRef} />}
    </div>
  );
}
