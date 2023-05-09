/*
data:

name: name,
values: timestamp, value1

*/

import React, { useEffect } from "react";
import * as d3 from "d3";
import { timestampBucket } from "../bars/TimestampBucket.js";
import { getTimeBucket, getTimeBucketInt } from "../helpers/getTimeBucket";
import { parseTimestamp } from "../helpers/parseTimestamp";
import { setTickNrForTimeXAxis } from "../helpers/chart";
import { showTooltip } from "../helpers/tooltip.js";
import { Colors } from "../../gui";

import store from "@/js/store";
import { setTimerange } from "@/js/slices";

import emptyIcon from "/icons/empty_small.png";

export default function MultipleAreaChart({ data, id, units, name, width }) {
  const { timerange } = store.getState().filter;

  useEffect(() => {
    if (data == undefined) return;
    draw();
  });

  const draw = () => {
    units = units ? " (" + units + ")" : "";
    //FOR UPDATE: remove chart if it's already there
    var chart = document.getElementById(id + "SVG");
    if (chart) {
      chart.remove();
    }

    // Clean up lost tooltips
    var elements = document.getElementById("tooltip" + id);
    if (elements) {
      elements.parentNode.removeChild(elements);
    }

    var margin = {
      top: 20,
      right: 45,
      bottom: 40,
      left: 100,
    };

    var height = 200 - margin.top - margin.bottom;
    var duration = 250;

    var areaOpacity = "0.45";
    var areaOpacityHover = "0.85";
    var otherareasOpacityHover = "0.1";
    var areaStroke = "2.5px";
    var areaStrokeHover = "2.5px";

    var circleOpacity = "0.85";
    var circleOpacityOnareaHover = "0.25";
    var circleRadius = 3;
    var circleRadiusHover = 6;

    var parseDate = d3.timeFormat(timestampBucket(timerange[0], timerange[1]));

    var svg = d3.select("#" + id)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height + margin.top + margin.bottom)
      .attr("id", id + "SVG")
      .append("g");

    var svgWidth = d3.select("#" + id).node().clientWidth;

    var width = svgWidth - (margin.left + margin.right);
    if (width < 100) width = 100;

    var color = d3.scaleOrdinal().range(Colors);
    //special color scale for home dashboard
    if (name === "PARALLEL CALLS") {
      color = d3.scaleOrdinal().range(["#caa547", "#30427F"]);
    } else if (name === "PARALLEL REGS") {
      color = d3.scaleOrdinal().range(["#caa547", "#A5CA47"]);
    } else if (name === "INCIDENTS") {
      color = d3.scaleOrdinal().range(["#caa547", "#69307F"]);
    }

    // gridlines in y axis function
    function make_y_gridlines() {
      return d3.axisLeft(yScale)
        .ticks(5);
    }

    //max and min date
    var maxTime = timerange[1] + getTimeBucketInt(timerange);
    var minTime = timerange[0];

    for (var i = 0; i < data.length; i++) {
      for (var k = 0; k < data[i].values.length; k++) {
        if (data[i].values[k].hasOwnProperty("date")) {
          if (maxTime < data[i].values[k].date) {
            maxTime = data[i].values[k].date;
          }
        }
        if (data[i].values[k].hasOwnProperty("date")) {
          if (minTime > data[i].values[k].date) {
            minTime = data[i].values[k].date;
          }
        }
      }
    }

    var xScale = d3.scaleLinear()
      .range([0, width])
      .domain([minTime, maxTime]);

    if (data.length >= 1) {
      //max value
      var max = 0;
      var min = 0;
      if (data[1].values.length > 0) {
        min = data[1].values[0].value;
      } else if (data[0].values.length > 0) {
        min = data[0].values[0].value;
      }

      for (i = 0; i < data.length; i++) {
        for (k = 0; k < data[i].values.length; k++) {
          if (data[i].values[k].hasOwnProperty("value")) {
            if (max < data[i].values[k].value) {
              max = data[i].values[k].value;
            }
            if (min > data[i].values[k].value) {
              min = data[i].values[k].value;
            }
          }
        }
      }
    }
    var domain = 0;
    var yScale = d3.scaleLinear();

    //get minimum y axis only for parallel registration
    if (id === "parallelRegs") {
      domain = max === 0 ? domain = 1 : domain = max + (max - min);

      yScale.domain([min, domain])
        .range([height, 0]);
    } else {
      domain = max === 0 ? domain = 1 : domain = max + max / 3;

      yScale.domain([0, domain])
        .range([height, 0]);
    }

    var xAxis = d3.axisBottom()
      .scale(xScale)
      .ticks(7)
      .tickFormat(parseDate);

    var yAxis = d3.axisLeft(yScale).ticks(5);

    setTickNrForTimeXAxis(xAxis);
    svg.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    if (
      data === 0 || data.length === 0 ||
      (data[0].values.length === 0 && data[1].values.length === 0)
    ) {
      svg.append("svg:image")
        .attr("xlink:href", emptyIcon)
        .attr("class", "noData")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    } else {
      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("y", 15)
        .attr("transform", "rotate(-90)")
        .attr("fill", "#000");

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

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
        var timestamp_gte = xScale.invert(extent[0]);
        var timestamp_lte = xScale.invert(extent[1]);
        var timestamp_readiable =
          parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " - " +
          parseTimestamp(new Date(Math.trunc(timestamp_lte)));

        store.dispatch(
          setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]),
        );
      }

      /* Add area into SVG */
      var area = d3.area()
        .x((d) => xScale(d.date))
        .y1((d) => yScale(d.value))
        .y0(height);

      let areas = svg.append("g")
        .attr("class", "areas");

      // add the Y gridlines
      areas.append("g")
        .attr("class", "grid")
        .call(
          make_y_gridlines()
            .tickSize(-width)
            .tickFormat(""),
        );

      areas.selectAll(".area-group")
        .data(data).enter()
        .append("g")
        .attr("class", "area-group")
        .append("path")
        .attr("class", "area")
        .attr("d", (d) => area(d.values))
        .style("stroke", (d, i) => color(i))
        .style("fill", (d, i) => color(i))
        .style("opacity", areaOpacity)
        .on("mouseover", function () {
          d3.selectAll(".area")
            .style("opacity", otherareasOpacityHover);
          d3.selectAll(".circle" + id)
            .style("opacity", circleOpacityOnareaHover);
          d3.select(this)
            .style("opacity", areaOpacityHover)
            .style("stroke-width", areaStrokeHover)
            .style("cursor", "pointer");
        })
        .on("mouseout", function () {
          d3.selectAll(".area")
            .style("opacity", areaOpacity);
          d3.selectAll(".circle" + id)
            .style("opacity", circleOpacity);
          d3.select(this)
            .style("stroke-width", areaStroke)
            .style("cursor", "none");
        });

      var tooltip = d3.select("#" + id).append("div")
        .attr("id", "tooltip " + id)
        .attr("class", "tooltip");

      tooltip.append("div");

      /* Add circles in the area */
      areas.selectAll("circle-group" + id)
        .data(data).enter()
        .append("g")
        .style("fill", (d, i) => color(i))
        .selectAll("circle" + id)
        .data((d) => d.values).enter()
        .append("g")
        .attr("class", "circle" + id)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          tooltip.select("div").html(
            "<strong>Time: </strong>" + parseTimestamp(d.date) + " + " +
              getTimeBucket(timerange) + "<br/><strong>Value: </strong>" +
              d3.format(",")(d.value) + units + "<br/> ",
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

      //animation

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

      var legend = svg.selectAll(".legend")
        .data(data)
        .enter().append("g")
        .attr("class", "legend");

      legend.append("rect")
        .attr("x", width - 80)
        .attr("y", function (d, i) {
          return i * 20;
        })
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function (d, i) {
          return color(i);
        });

      legend.append("text")
        .attr("x", width - 60)
        .attr("y", function (d, i) {
          return (i * 20) + 9;
        })
        .text(function (d) {
          return d.name;
        });
    }
  };

  const bucket = getTimeBucket(timerange);
  return (
    <div id={id} className="chart">
      <h3 className="alignLeft title">
        {name} <span className="smallText">(interval: {bucket})</span>
      </h3>
    </div>
  );
}
