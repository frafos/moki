import { useEffect } from "react";
import * as d3 from "d3";
import {
  Colors,
  ColorType,
  createFilter,
  getExceededColor,
  getExceededTypes,
} from "../../gui";
import { getTimeBucket, getTimeBucketInt } from "../helpers/getTimeBucket";
import {
  parseTimeData,
  parseTimestamp,
  parseTimestampD3js,
} from "../helpers/parseTimestamp";
import { setTickNrForTimeXAxis } from "../helpers/chart";
import { showTooltip } from "../helpers/tooltip";

import store from "@/js/store";
import { setTimerange } from "@/js/slices";

import emptyIcon from "/icons/empty_small.png";

/*
format: time, key
*/
export default function StackedChart(
  { data, id, width, name, units, animation, disableFilter, keys },
) {
  const { timerange } = store.getState().filter;

  useEffect(() => {
    if (!animation) return;

    //special case: show time line for video animation
    const timebucket = Math.round((maxTime - minTime) / 30);
    let time = timebucket;
    const animationInterval = setInterval(function () {
      if (document.getElementById("timeIndicator")) {
        document.getElementById("timeIndicator").remove();
      }
      g.append("rect")
        .attr("x", function () {
          return xScale(minTime + time);
        })
        .attr("id", "timeIndicator")
        .attr("y", function () {
          return 0;
        })
        .attr("width", xScale(minTime + timebucket))
        .style("fill", "#D4D3E8")
        .style("opacity", "0.5")
        .attr("height", height);

      time = time + timebucket;
      if (minTime + time >= maxTime) {
        clearInterval(animationInterval);
        console.log("stop auto animation");
        if (document.getElementById("timeIndicator")) {
          document.getElementById("timeIndicator").remove();
        }
      }
    }, 1000);
  }, []);

  useEffect(() => {
    if (data == undefined) return;
    draw();
  }, [data, width]);

  const draw = async () => {
    width = width < 0 ? 1028 : width;
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
    var svg = d3.select("#" + id);
    var margin = {
      top: 13,
      right: 70,
      bottom: 30,
      left: 35,
    };

    for (let hit of data) {
      hit.time = parseTimeData(hit.time);
    }

    //window.innerWidth -200
    width = width - margin.left - margin.right - 30;
    var height = 200 - margin.top - margin.bottom;

    var colorScale = d3.scaleOrdinal(Colors);

    var parseDate = parseTimestampD3js(timerange[0], timerange[1]);

    var rootsvg = svg.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("id", id + "SVG");

    //max and min date
    var maxTime = parseTimeData(timerange[1]) + getTimeBucketInt(timerange);
    var minTime = parseTimeData(timerange[0]) - (60 * 1000); //minus one minute fix for round up

    var x = d3.scaleBand().range([0, width]).padding(0.1);

    //scale for brush function
    var xScale = d3.scaleLinear()
      .range([0, width])
      .domain([minTime, maxTime]);

    if (data !== undefined) {
      var max = d3.max(data, (d) => d.sum + 5);
      var domain = max ? max + max / 3 : 1;
    }
    var yScale = d3.scaleLinear().range([height, 0]).domain([0, domain]);
    var z = d3.scaleOrdinal().range([
      "#d53e4f",
      "#fc8d59",
      "#fee08b",
      "#ffffbf",
      "#e6f598",
      "#99d594",
      "#3288bd",
    ]);

    var xAxis = d3.axisBottom()
      .scale(xScale)
      .ticks(7)
      .tickFormat(parseDate);

    setTickNrForTimeXAxis(xAxis);

    var yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(function (d) {
      if (d / 1000000000000 >= 1) return d / 1000000000000 + " T";
      if (d / 1000000000 >= 1) return d / 1000000000 + " G";
      if (d / 1000000 >= 1) return d / 1000000 + " M";
      if (d / 1000 >= 1) return d / 1000 + " K";
      return d;
    });

    rootsvg.attr(
      "transform",
      "translate(" + margin.left + "," + margin.top + ")",
    );

    if (data === undefined || data.length === 0) {
      rootsvg.append("svg:image")
        .attr("xlink:href", emptyIcon)
        .attr("class", "noData")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    } else {
      rootsvg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + margin.left + "," + (height) + ")")
        .call(xAxis);

      rootsvg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + margin.left + ",0)").call(yAxis);

      var dataLength = 0;
      for (var o = 0; o < data.length; o++) {
        dataLength = dataLength + Object.keys(data[o]).length - 2; //minus time attribute
      }
      var g = rootsvg.append("g")
        .attr("transform", "translate(" + margin.left + ",0)");

      g.append("g")
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
        store.dispatch(
          setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]),
        );
      }

      x.domain(data.map(function (d) {
        return parseDate(d.time);
      }));

      z.domain(data.map(function (d) {
        return d.keys;
      }));

      const { layout } = store.getState().persistent;
      keys = keys
        ? layout.types[keys] ? layout.types[keys] : keys
        : layout.types["overview"];

      if (
        window.location.pathname.includes("/exceeded") ||
        window.location.pathname.includes("/alerts")
      ) {
        keys = [];
        let exceededTemplate = getExceededTypes();
        if (exceededTemplate.length > 0) {
          for (let hit of exceededTemplate) {
            keys.push(hit.id);
          }
        } else {
          //compute keys from data
          keys = [];
          for (let hit of data) {
            for (let key of Object.keys(hit)) {
              if (!keys.includes(key)) {
                keys.push(key);
              }
            }
          }
          ///remove value, sum, time
          if (keys.indexOf("value") !== -1) {
            keys.splice(keys.indexOf("value"), 1);
          }
          if (keys.indexOf("sum") !== -1) keys.splice(keys.indexOf("sum"), 1);
          if (keys.indexOf("time") !== -1) keys.splice(keys.indexOf("time"), 1);
        }
      }

      //var id = 0;
      var stack = d3.stack()
        .keys(keys)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      var layers = stack(data);

      var layer = g.selectAll(".layer")
        .data(layers)
        .enter().append("g")
        .attr("class", "layer")
        .attr("type", function (d) {
          return d.key;
        })
        .style("fill", function (d) {
          if (name === "MoS STATS") {
            if (d.key === "*-2.58") return "#FE2E2E";
            if (d.key === "2.58-3.1") return "#F79F81";
            if (d.key === "3.1-3.6") return "#F3E2A9";
            if (d.key === "3.6-4.03") return "#95c196";
            if (d.key === "4.03-*") return "#4f9850";
          } else if (
            window.location.pathname === "/exceeded" ||
            window.location.pathname.includes("/alerts")
          ) {
            return getExceededColor(d.key);
          } else if (ColorType[d.key]) {
            return ColorType[d.key];
          } else {
            return colorScale(d.key);
          }
        })
        .on("mouseover", function () {
          d3.select(this).style("stroke", "orange");
        })
        .on("mouseout", function () {
          d3.select(this).style("stroke", "none");
        });

      // gridlines in y axis function
      function make_y_gridlines() {
        return d3.axisLeft(yScale)
          .ticks(5);
      }

      layer.selectAll("rect")
        .data(function (d) {
          return d;
        })
        .enter().append("rect")
        .attr("class", "barStacked")
        .attr("x", function (d) {
          //bug fix
          if (xScale(d.data.time) < 0) {
            return -1000;
          }
          return xScale(d.data.time);
        })
        .attr("width", function (d, i) {
          var timebucket = getTimeBucket(timerange);
          var nextTime = d.data.time;
          if (timebucket.includes("m")) {
            nextTime = nextTime + (timebucket.slice(0, -1) * 60 * 1000);
          } else if (timebucket.includes("s")) {
            nextTime = nextTime + (timebucket.slice(0, -1) * 1000);
          } else {
            nextTime = nextTime + (timebucket.slice(0, -1) * 60 * 60 * 1000);
          }

          if (nextTime < maxTime && d.data.time > minTime) {
            return xScale(nextTime) - xScale(d.data.time) - 1;
          }
          return;
        })
        .attr("y", function (d) {
          var height = yScale(d[0]) - yScale(d[1]);
          if (height) {
            if (height < 1.5) {
              return yScale(d[1]) - 1;
            }
            return yScale(d[1]);
          } else {
            return 0;
          }
        })
        .attr("value", function (d) {
          return d[1] - d[0];
        })
        .attr("height", function (d) {
          var height = yScale(d[0]) - yScale(d[1]);
          if (height) {
            if (height < 1.5) {
              return 2;
            }
            return height;
          } else {
            return 0;
          }
        })
        .on("mouseover", function (event, d) {
          tooltip.select("div").html(
            "<strong>Time: </strong> " + parseTimestamp(d.data.time) + " + " +
              getTimeBucket(timerange) + "<br/><strong>Value: </strong> " +
              d3.format(",")(d[1] - d[0]) + units +
              "<br/><strong>Type: </strong>" +
              this.parentNode.getAttribute("type") + "<br/> ",
          );
          d3.select(this).style("cursor", "pointer");
          showTooltip(event, tooltip);
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
        })
        .on("mousemove", function (event) {
          showTooltip(event, tooltip);
        });

      if (disableFilter !== true) {
        //filter type onClick
        layer.on("click", (_event, d) => {
          if (
            window.location.pathname === "/exceeded" ||
            window.location.pathname.includes("/alerts")
          ) {
            createFilter("exceeded:" + d.key);
          } else {
            createFilter("attrs.type:" + d.key);
          }

          var tooltips = document.getElementById("tooltip" + id);
          if (tooltips) {
            tooltips.style.opacity = 0;
          }
        });
      }

      //turn off animation for web page because we need refresh every minute there
      if (window.location.pathname !== "/web") {
        // Animation
        /* Add 'curtain' rectangle to hide entire graph */
        var curtain = rootsvg.append("rect")
          .attr("x", -1 * width - 70)
          .attr("y", -1 * height)
          .attr("height", height)
          .attr("width", width + 100)
          .attr("class", "curtain")
          .attr("transform", "rotate(180)")
          .style("fill", "#ffffff");

        // Now transition the curtain to double of its width
        curtain.transition()
          .duration(1200)
          .ease(d3.easeLinear)
          .attr("x", -2 * width - 300);
      }

      // add the Y gridlines
      g.append("g")
        .attr("class", "grid")
        .call(
          make_y_gridlines()
            .tickSize(-width)
            .tickFormat(""),
        );

      // tooltip
      var tooltip = d3.select("#" + id).append("div")
        .attr("id", "tooltip" + id)
        .attr("class", "tooltip");

      tooltip.append("div");
    }
  };

  const bucket = getTimeBucket(timerange);
  return (
    <div id={id} className="chart">
      <h3 className="alignLeft title" style={{ "float": "inherit" }}>
        {name}
        <span className="smallText">(interval: {bucket})</span>
      </h3>
    </div>
  );
}
