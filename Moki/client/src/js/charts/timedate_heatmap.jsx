import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { getTimeBucket, getTimeBucketInt } from "../helpers/getTimeBucket";
import {
  parseTimeData,
  parseTimestamp,
  parseTimestampD3js,
  parseTimestampUTC,
} from "../helpers/parseTimestamp";
import { setTickNrForTimeXAxis } from "../helpers/chart";
import { showTooltip } from "../helpers/tooltip";
import { ColorsGreen, ColorsRedGreen, createFilter } from "../../gui";

import store from "@/js/store";
import { setTimerange as setReduxTimerange } from "@/js/slices";

import emptyIcon from "/icons/empty_small.png";

export default function TimedateHeatmap(
  { data, id, field, width, name, units },
) {
  const timerange = store.getState().filter.timerange;
  const setTimerange = (newTimerange) => {
    store.dispatch(
      setReduxTimerange(newTimerange),
    );
  };
  return (
    <TimedateHeatmapRender
      {...{ data, id, field, width, name, units, timerange, setTimerange }}
    />
  );
}

export function TimedateHeatmapRender(
  { data, id, field, width, name, units, timerange, setTimerange },
) {
  const chartSVGRef = useRef(null);

  useEffect(() => {
    if (!data) return;
    draw();
  }, [data, width, timerange]);

  const draw = () => {
    units = units ? " (" + units + ")" : "";

    // FOR UPDATE: clear chart svg
    chartSVGRef.current.innerHTML = "";

    // Clean up lost tooltips
    let elements = document.getElementById("tooltip" + id);
    while (elements) {
      elements.parentNode.removeChild(elements);
    }

    let marginLeft = 150;
    /* if (data.length > 0) {
             var maxTextWidth = d3.max(data.map(n => n.attr2.length));
              marginLeft = maxTextWidth > 23 ? 150 : maxTextWidth > 15 ? maxTextWidth * 6 :  maxTextWidth * 9;
         }*/

    //fix for TYPE DATE HEATMAP, constant margin
    if (name === "TYPE DATE HEATMAP") {
      marginLeft = 100;
    } else if (name === "NODES - ACTIVITY" || name === "NODES - KEEP ALIVE") {
      marginLeft = 70;
    }

    var margin = {
      top: 10,
      right: 45,
      bottom: 40,
      left: marginLeft,
    };

    var wholeWidth = width;
    width = width - margin.right - margin.left;
    var colorScale;

    for (let hit of data) {
      hit.time = parseTimeData(hit.time);
    }

    var colorOneShade = ColorsGreen;
    //special color scale
    if (
      (name.includes("RATIO") && !name.includes("DURATION")) ||
      name.includes("CALL-ATTEMPS") || name.includes("ERROR")
    ) {
      colorOneShade = ColorsRedGreen;
    }
    //max and min date
    var maxTime = parseTimeData(timerange[1]) +
      getTimeBucketInt(timerange);
    var minTime = parseTimeData(timerange[0]) -
      (60 * 1000); //minus one minute fix for round up

    //scale for brush function
    var xScale = d3.scaleLinear()
      .range([0, width])
      .domain([minTime, maxTime]);

    var parseDate = parseTimestampD3js(timerange[0], timerange[1]);

    const buckets = 8;
    colorScale = d3.scaleQuantile()
      .domain([0, buckets - 1, d3.max(data, (d) => d.value)])
      .range(colorOneShade);
    var height = 1200;
    var rootsvg = d3.select(chartSVGRef.current)
      .attr("id", id + "SVG")
      .attr("width", wholeWidth)
      .attr("height", height + margin.top + margin.bottom);

    if (data === undefined || data.length === 0) {
      rootsvg.attr("height", 100);

      rootsvg.append("svg:image")
        .attr("xlink:href", emptyIcon)
        .attr("class", "noData")
        .attr("transform", "translate(" + width / 2 + ",25)");
    } else {
      const y_elements = new Set(data.map(function (item) {
        return item.attr2;
      }));

      var itemHeight = 16 - 3;
      var itemSize = 10;
      var cellSize = itemSize - 3;
      height = (itemHeight * y_elements.size) + margin.top;

      var xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(7)
        .tickFormat(parseDate);

      setTickNrForTimeXAxis(xAxis);

      var yScale = d3.scaleBand()
        .domain(y_elements)
        .range([0, height])
        .paddingInner(.2).paddingOuter(.2);

      var yAxis = d3.axisLeft()
        .scale(yScale)
        .tickFormat(function (d) {
          return d;
        });

      // Finding the mean of the data
      var meanValue = d3.mean(data.map(function (d) {
        return +d.value;
      }));

      //setting percentage change for value w.r.t average
      data.forEach(function (d) {
        d.perChange = (d.value - meanValue) / meanValue;
      });

      rootsvg.attr("height", height + margin.top + margin.bottom);
      var svg = rootsvg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("g")
        .attr("class", "brush")
        .call(
          d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("end", brushended),
        );

      function brushended(event) {
        if (!event.sourceEvent) return;
        // Only transition after input.
        if (!event.selection) return;
        // Ignore empty selections.
        var extent = event.selection;
        var timestamp_gte = Math.round(xScale.invert(extent[0]));
        var timestamp_lte = Math.round(xScale.invert(extent[1]));
        var timestamp_readiable =
          parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " - " +
          parseTimestamp(new Date(Math.trunc(timestamp_lte)));
        setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]);
      }

      // tooltip
      var tooltip = d3.select("#" + id).append("div")
        .attr("id", "tooltip " + id)
        .attr("class", "tooltip");

      tooltip.append("div");

      var rect = svg.selectAll("null")
        .data(data)
        .enter().append("g").append("rect")
        .attr("class", "cell")
        .style("opacity", 0)
        .attr("width", function (d, i) {
          var timebucket = getTimeBucket(timerange);
          var nextTime = data[i].attr1;
          if (timebucket.includes("m")) {
            nextTime = nextTime + (timebucket.slice(0, -1) * 60 * 1000);
          } else if (timebucket.includes("s")) {
            nextTime = nextTime + (timebucket.slice(0, -1) * 1000);
          } else {
            nextTime = nextTime + (timebucket.slice(0, -1) * 60 * 60 * 1000);
          }

          if (nextTime < maxTime && data[i].attr1 > minTime) {
            return xScale(nextTime) - xScale(data[i].attr1) - 1;
          }
          return;
        })
        .attr("height", itemHeight)
        .attr("y", function (d) {
          return yScale(d.attr2);
        })
        .attr("value", function (d) {
          return d.value;
        })
        .attr("x", function (d) {
          if (xScale(d.attr1) - cellSize / 2 < 0) {
            return -1000;
          }
          return xScale(d.attr1) - cellSize / 2;
        })
        .attr("fill", function (d) {
          //special case
          if (name === "CA AVAILABILITY") {
            //null
            if (d.value === "" || d.value === null) return "";
            if (d.value === "partially") return "#fecac2";
            if (d.value === "unreachable") return "#fc6047";
            if (d.value === "reachable") return "#4f9850";
          } else if (name === "AVG MoS") {
            if (d.value <= 2.58) return "#FE2E2E";
            if (d.value <= 3.1) return "#F79F81";
            if (d.value <= 3.6) return "#F3E2A9";
            if (d.value <= 4.03) return "#95c196";
            if (d.value > 4.03) return "#4f9850";
          } else {
            return colorScale(d.value);
          }
        })
        .attr("rx", 2)
        .attr("ry", 2)
        .style("opacity", 1)
        .attr("transform", "translate(" + cellSize / 2 + ",0)")
        .on("mouseover", function (event, d) {
          d3.select(this).style("stroke", "orange")
            .style("cursor", "pointer");

          var value = d.value;

          if (typeof d.value === "number") {
            value = (d.value).toFixed(2);
          }
          if (name === "CA AVAILABILITY") {
            if (d.value === "partially") value = "Partially reachable";
            if (d.value === "unreachable") value = "Unreachable";
            if (d.value === "reachable") value = "Reachable";
          }

          tooltip.select("div").html(
            "<strong>" + d.attr2.charAt(0).toUpperCase() + d.attr2.slice(1) +
              ": </strong>" + value + units + "<br/><strong>Time: </strong>" +
              parseTimestampUTC(d.attr1) + " + " + getTimeBucket(timerange),
          );

          showTooltip(event, tooltip);
        })
        .on("mousemove", function (event) {
          showTooltip(event, tooltip);
        })
        .on("mouseout", function () {
          d3.select(this).style("stroke", "none");
          tooltip.style("visibility", "hidden");
        });

      //filter type onClick
      rect.on("click", (_event, d) => {
        createFilter(field + ': "' + d.attr2 + '"');
        var tooltips = document.getElementById("tooltip" + id);
        if (tooltips) {
          tooltips.style.opacity = 0;
        }
      });

      //animation for 2 sec, transition delay is in milliseconds
      /* Add 'curtain' rectangle to hide entire graph */
      var curtain = svg.append("rect")
        .attr("x", -1 * width)
        .attr("y", -1 * height)
        .attr("height", height)
        .attr("width", width)
        .attr("class", "curtain")
        .attr("transform", "rotate(180)")
        .style("fill", "#ffffff");

      // Now transition the curtain to double of its width
      curtain.transition()
        .duration(1200)
        .ease(d3.easeLinear)
        .attr("x", -2 * width - 50);

      svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,0)")
        .call(yAxis)
        .selectAll("text")
        .text(function (d) {
          if (d.length > 20) {
            return d.substring(0, 20) + "...";
          } else {
            return d;
          }
        })
        .attr("font-weight", "normal")
        .style("cursor", "pointer")
        .on("click", (_event, d) => {
          createFilter(this.props.field + ': "' + d + '"');
        })
        .append("svg:title")
        .text(function (d) {
          return d;
        });

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    }
  };

  const bucket = getTimeBucket(timerange);
  return (
    <div id={id} className="chart">
      <h3 className="alignLeft title">
        {name} <span className="smallText">(interval: {bucket})</span>
      </h3>
      <svg ref={chartSVGRef} />
    </div>
  );
}
