/*
data:
name: name,
values: timestamp, value1
*/

import { useEffect, useState } from "react";
import * as d3 from "d3";
import { timestampBucket } from "../bars/TimestampBucket.js";
import { getTimeBucket, getTimeBucketInt } from "../helpers/getTimeBucket";
import { parseTimestamp } from "../helpers/parseTimestamp";
import { setTickNrForTimeXAxis } from "../helpers/chart";
import { showTooltip } from "../helpers/tooltip.js";
import { Colors, createFilter } from "../../gui";

import store from "@/js/store";
import { setTimerange } from "@/js/slices";

import emptyIcon from "/icons/empty_small.png";
import { useSelector } from "react-redux";

//STATE: absolute value or rate

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
const DONT_DISPLAY_OPTION = [
  "IPS ON FW BLACKLIST BY HOST",
  "IPS ON FW GREYLIST BY HOST",
  "IPS ON FW WHITELIST BY HOST",
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

export default function MultipleLineChart(props) {
  let storedState = localStorage.getItem("multipleLineCharts");
  if (storedState) {
    storedState = JSON.parse(storedState);
  }

  const [currentState, setCurrentState] = useState(
    storedState && storedState[props.id]
      ? storedState[props.id]
      : ABSOLUTE_VALUES.includes(props.name)
      ? "absolute"
      : "rate",
  );

  const width = useSelector((state) => state.persistent.width);
  const timerange = store.getState().filter.timerange;

  useEffect(() => {
    if (props.data == undefined) return;
    draw(props.data, props.id, props.ticks, props.hostnames);
  }, [props.data, props.hostnames, width]);

  const drawLegend = (svg, data, field, hostnames, color) => {
    var legendGroup = svg.append("g");
    var legend = legendGroup.selectAll(".legend")
      .data(data)
      .enter().append("g")
      .attr("class", "legend");

    legend.append("rect")
      .attr("x", function (_d, i) {
        if (i < 7) return 0;
      })
      .attr("y", function (_d, i) {
        if (i < 7) return i * 17;
      })
      .attr("width", function (_d, i) {
        if (i < 7) return 10;
      })
      .attr("height", function (_d, i) {
        if (i < 7) return 10;
      })
      .style("fill", function (d, i) {
        if (i < 7) {
          return hostnames && hostnames[d.name] ? hostnames[d.name] : color(i);
        }
      })
      .on("click", (_event, d) => {
        createFilter(field + ':"' + d.name + '"');
      });

    legend.append("text")
      .attr("x", 20)
      .attr("y", function (_d, i) {
        if (i < 7) return (i * 17) + 5;
      })
      .text(function (d, i) {
        if (d.name.length <= 20) {
          if (i < 7) return d.name;
        } else {
          if (i < 7) return d.name.substring(0, 20) + "...";
        }
      })
      .on("click", (_event, d) => {
        createFilter(field + ':"' + d.name + '"');
      })
      .append("svg:title")
      .text(function (d) {
        return d.name;
      });

    return legendGroup;
  };

  const draw = (data, id, ticks, hostnames, state = currentState) => {
    var field = props.field ? props.field : "attrs.hostname";

    if (state === "rate") {
      var divData = [];
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

    //FOR UPDATE: remove chart if it's already there
    var chart = document.getElementById(id + "SVG");
    if (chart) {
      chart.remove();
    }

    //max and min date
    var maxTime = timerange[1] + getTimeBucketInt(timerange);
    var minTime = timerange[0];
    // Clean up lost tooltips
    var elements = document.getElementById("tooltip" + id);
    if (elements) {
      elements.parentNode.removeChild(elements);
    }
    var margin = {
      top: 20,
      right: 20,
      bottom: 40,
      left: 70,
    };

    var height = 100;
    var duration = 250;

    var lineOpacity = "0.45";
    var lineOpacityHover = "0.85";
    var otherlinesOpacityHover = "0.1";
    var lineStroke = "2.5px";
    var lineStrokeHover = "2.5px";

    var circleOpacity = "0.85";
    var circleOpacityOnlineHover = "0.25";
    var circleRadius = 3;
    var circleRadiusHover = 6;
    var parseDate = d3.timeFormat(
      timestampBucket(timerange[0], timerange[1]),
    );

    var svg = d3.select("#" + id)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height + margin.top + margin.bottom)
      .attr("id", id + "SVG")
      .append("g");

    var color = d3.scaleOrdinal().range(Colors);

    var svgWidth = d3.select("#" + id).node().clientWidth;
    if (svgWidth === 0) svgWidth = 500;
    var legendWidth = 110;
    var legendSpacer = 10;
    var legendPadding = 5;

    if (data.length > 0) {
      // create legend and get it's width
      var legend = drawLegend(svg, data, field, hostnames, color);
      legendWidth = legend.node().getBBox().width + legendPadding;
    }

    var width = svgWidth -
      (margin.left + margin.right + legendSpacer + legendWidth);
    if (width < 100) width = 100;
    var xScale = d3.scaleLinear()
      .range([0, width])
      .domain([minTime, maxTime]);

    //if idle, do minus 100 for all values
    /*  if (id.includes("Idle") && id !== "CPU-IDLE") {
              for (var i = 0; i < data.length; i++) {
                  for (var j = 0; j < data[i].values.length; j++) {
                      data[i].values[j].value = 100 - data[i].values[j].value;
                  }
              }
          }
        */
    //max value
    var max = 0;
    for (var i = 0; i < data.length; i++) {
      for (k = 0; k < data[i].values.length; k++) {
        if (data[i].values[k].hasOwnProperty("value")) {
          if (max < data[i].values[k].value) {
            max = data[i].values[k].value;
          }
        }
      }
    }

    //plus 10%
    var domain = max === 0 ? 1 : max + max / 10;
    let minY = 0;
    //  if (ABSOLUTE_VALUES.includes(this.props.name)) {
    if (data.length > 0 && data[0].values.length > 0) {
      minY = data[0].values[0].value;
      for (var i = 0; i < data.length; i++) {
        for (k = 0; k < data[i].values.length; k++) {
          if (data[i].values[k].hasOwnProperty("value")) {
            if (minY > data[i].values[k].value) {
              minY = data[i].values[k].value;
            }
          }
        }
      }
      //minus 10%
      if (minY - minY / 10 > 0) minY = minY - minY / 10;
      else minY = 0;
    }

    var yScale = d3.scaleLinear()
      .domain([minY, domain])
      .range([height, 0]);

    var xAxis = d3.axisBottom()
      .scale(xScale)
      .ticks(ticks)
      .tickFormat(parseDate);

    setTickNrForTimeXAxis(xAxis);

    var yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(function (d) {
      if (d / 1000000000000 >= 1) return d / 1000000000000 + " T";
      if (d / 1000000000 >= 1) return d / 1000000000 + " G";
      if (d / 1000000 >= 1) return d / 1000000 + " M";
      if (d / 1000 >= 1) return d / 1000 + " K";
      return d;
    });

    // gridlines in y axis function
    function make_y_gridlines() {
      return d3.axisLeft(yScale)
        .ticks(5);
    }

    svg.attr(
      "transform",
      "translate(" + margin.left + "," + margin.right + ")",
    );

    if (data.length === 0) {
      svg.append("svg:image")
        .attr("xlink:href", emptyIcon)
        .attr("class", "noData")
        .attr(
          "transform",
          "translate(" + (width / 3 + 20) + "," + height / 4 + ")",
        );
    } else {
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("y", 15)
        .attr("transform", "rotate(-90)")
        .attr("fill", "#000");

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

      // add the Y gridlines
      svg.append("g")
        .attr("class", "grid")
        .transition()
        .duration(1200)
        .call(
          make_y_gridlines()
            .tickSize(-width)
            .tickFormat(""),
        );

      /* Add line into SVG */
      var line = d3.line()
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
          (d, i) =>
            hostnames && hostnames[d.name] ? hostnames[d.name] : color(i),
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

      var tooltip = d3.select("#" + id).append("div")
        .attr("id", "tooltip " + id)
        .attr("class", "tooltip");

      tooltip.append("div");

      /* Add circles in the line */
      lines.selectAll("circle-group" + id)
        .data(data).enter()
        .append("g")
        .style(
          "fill",
          (d, i) =>
            hostnames && hostnames[d.name] ? hostnames[d.name] : color(i),
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
              d3.format(",")(d.value) + "<br/> ",
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

      legend.raise();
      legend.attr(
        "transform",
        "translate(" +
          (svgWidth - legendWidth - margin.left - margin.right + legendSpacer) +
          ",0)",
      );
    }
  };

  const changeState = (newState) => {
    setCurrentState(newState);
    draw(props.data, props.id, props.ticks, props.hostnames, newState);
    //store change in localstorage
    let multipleLineCharts = localStorage.getItem("multipleLineCharts");
    if (multipleLineCharts) {
      multipleLineCharts = JSON.parse(multipleLineCharts);
      multipleLineCharts[props.id] = newState;
      localStorage.setItem(
        "multipleLineCharts",
        JSON.stringify(multipleLineCharts),
      );
    } else {
      localStorage.setItem(
        "multipleLineCharts",
        JSON.stringify({ [props.id]: newState }),
      );
    }
  };

  const bucket = getTimeBucket(timerange);
  return (
    <div id={props.id} className="chart" style={{ minHeight: "217px" }}>
      <h3 className="alignLeft title" style={{ "float": "inherit" }}>
        {props.name} <span className="smallText">(interval: {bucket})</span>
      </h3>
      {props.data && props.data.length > 0 &&
        !DONT_DISPLAY_OPTION.includes(props.name) &&
        (
          <div style={{ "marginLeft": "83%", "marginTop": "-25px" }}>
            <input
              type="radio"
              value="rate"
              style={{ "width": "34px" }}
              name={"ratio" + props.name}
              onClick={() => changeState("rate")}
              defaultChecked={currentState === "rate" ? true : false}
            />
            rate
            <br />
            <input
              type="radio"
              value="absolute"
              style={{ "width": "34px" }}
              name={"ratio" + props.name}
              onClick={() => changeState("absolute")}
              defaultChecked={currentState === "absolute" ? true : false}
            />
            absolute
          </div>
        )}
    </div>
  );
}
