import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { formatDuration } from "@/js/helpers/formatTime";
import Animation from "../helpers/Animation";
import { showTooltip } from "../helpers/tooltip";
import { ColorsGreen, ColorsRedGreen, createFilter } from "../../gui";

import emptyIcon from "/icons/empty_small.png";

export default function Heatmap(props) {
  const colorScaleFun = useRef("");
  const [currentData, setCurrentData] = useState(props.data);

  useEffect(() => {
    if (props.data == undefined) return;
    draw(
      props.data,
      props.id,
      props.field,
      props.field2,
      props.width,
      props.name,
      props.units,
    );
  }, [props.data, props.width]);

  const setData = (data) => {
    setCurrentData(data);
    draw(
      data,
      props.id,
      props.field,
      props.field2,
      props.width,
      props.name,
      props.units,
    );
  };

  const draw = (data, id, field, field2, passWidth, name, units) => {
    units = units ? " (" + units + ")" : "";
    //FOR UPDATE: remove chart if it's already there
    var chart = document.getElementById(id + "SVG");
    if (chart) {
      chart.remove();
      var tooltips = document.getElementById("tooltip" + id);
      if (tooltips) {
        tooltips.remove();
      }
    }

    //compute max label length to get bottom margin
    var marginBottom = 50;
    var marginLeft = 150;
    if (data && data.length > 0) {
      var maxTextWidthX = d3.max(data.map((n) => n.attr1.length));
      var maxTextWidthY = d3.max(data.map((n) => n.attr2.length));
      marginBottom = (maxTextWidthX > 23 ? 150 : maxTextWidthX * 5.5) + 20;
    }

    var margin = {
      top: 20,
      right: 30,
      bottom: marginBottom,
      left: marginLeft,
    };
    //width 1100
    var width = passWidth - margin.right - margin.left;

    var colorOneShade = ColorsGreen;
    //special green-red color scale
    if (name.includes("CALL-ATTEMPS") || name.includes("ERROR")) {
      colorOneShade = ColorsRedGreen;
    }

    const buckets = 10;
    var colorScale = colorScaleFun.current;
    var height = 250;
    var widthSum = passWidth;
    var rootsvg = d3.select("#" + id)
      .append("svg")
      .attr("id", id + "SVG")
      .attr("width", widthSum)
      .attr("height", height + margin.top + margin.bottom);

    if (!data || data.length === 0) {
      rootsvg.attr("height", 100);

      rootsvg.append("svg:image")
        .attr("xlink:href", emptyIcon)
        .attr("class", "noData")
        .attr("transform", "translate(" + (widthSum / 2) + ",25)");
    } else {
      //store global color scale (for animation)
      if (colorScale === "") {
        colorScale = d3.scaleQuantile()
          .domain([0, buckets - 1, d3.max(data, (d) => d.value)])
          .range(colorOneShade);
        colorScaleFun.current = colorScale;
      }

      const x_elements = new Set(data.map(function (item) {
        return item.attr1;
      }));
      const y_elements = new Set(data.map(function (item) {
        return item.attr2;
      }));

      var itemHeight = 16 - 3;
      height = (itemHeight * y_elements.size) + margin.top;

      var xScale = d3.scaleBand()
        .domain(x_elements)
        .range([0, width])
        .paddingInner(.08).paddingOuter(.08);

      var xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(function (d) {
          return d;
        });

      var yScale = d3.scaleBand()
        .domain(y_elements)
        .range([0, height])
        .paddingInner(.2).paddingOuter(.2);

      var yAxis = d3.axisLeft()
        .scale(yScale)
        .tickFormat(function (d) {
          return d;
        });

      var cellSize = xScale.bandwidth();

      rootsvg.attr("height", height + margin.top + margin.bottom);
      var svg = rootsvg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // tooltip
      var tooltip = d3.select("#" + id).append("div")
        .attr("id", "tooltip" + id)
        .attr("class", "tooltip");

      tooltip.append("div");

      var rect = svg.selectAll("rect")
        .data(data)
        .enter().append("g").append("rect")
        .attr("class", "cell")
        // .style("opacity", "0")
        .attr("width", function (d) {
          if (d.value === -1) return 0;
          return cellSize;
        })
        .attr("height", function (d) {
          if (d.value === -1) return 0;
          return itemHeight;
        })
        .attr("y", function (d) {
          return yScale(d.attr2);
        })
        .attr("x", function (d) {
          return xScale(d.attr1);
        })
        .attr("value", function (d) {
          return d.value;
        })
        .attr("fill", function (d) {
          if (name === "CONNECTION FAILURE RATIO CA") {
            if (d.value <= 10) return "#1a321a";
            if (d.value <= 20) return "#346535";
            if (d.value <= 30) return "#4f9850";
            if (d.value <= 40) return "#68b169";
            if (d.value <= 50) return "#9acb9b";
            if (d.value <= 60) return "#fecac2";
            if (d.value <= 70) return "#fd9584";
            if (d.value <= 80) return "#fc6047";
            if (d.value <= 90) return "#fb2a0a";
            else return "#c41d03";
          } else return colorScale(d.value);
        })
        .attr("rx", 2)
        .attr("ry", 2)
        .on("mouseover", function (event, d) {
          d3.select(this).style("stroke", "orange")
            .style("cursor", "pointer");

          if (d3.pointer(event)[0] > window.innerWidth - 600) {
            tooltip
              .style("left", `${event.layerX - 350}px`);
          }
          if (name.includes("DURATION")) {
            var value = formatDuration(d.value, "min");
            tooltip.select("div").html(
              "<strong>SRC:</strong> " + d.attr2 +
                "<br/> <strong>DST: </strong>" + d.attr1 +
                "<br/> <strong>Value: </strong>" + value + units,
            );
          } else if (units === " (count)") {
            tooltip.select("div").html(
              "<strong>SRC:</strong> " + d.attr2 +
                "<br/> <strong>DST: </strong>" + d.attr1 +
                "<br/> <strong>Value: </strong>" + d.value + units,
            );
          } else {
            tooltip.select("div").html(
              "<strong>SRC:</strong> " + d.attr2 +
                "<br/> <strong>DST: </strong>" + d.attr1 +
                "<br/> <strong>Value: </strong>" + (+d.value).toFixed(2) +
                units,
            );
          }

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
        tooltip.style("visibility", "hidden");
        if (field2) {
          createFilter(field2 + ':"' + d.attr2 + '"');
        }

        createFilter(field + ':"' + d.attr1 + '"');

        var tooltips = document.getElementById("tooltip" + id);
        if (tooltip) {
          tooltips.style.opacity = 0;
        }
      });

      svg.append("g")
        .attr("class", "y axis")
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
        .append("svg:title")
        .text(function (d) {
          return d;
        });

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .text(function (d) {
          if (d.length > 20) {
            return d.substring(0, 20) + "...";
          } else {
            return d;
          }
        })
        .attr("transform", "rotate(-65)")
        .append("svg:title")
        .text(function (d) {
          return d;
        });

      if (
        id === "failureCA" || id === "callAtemptsCA" || id === "callEndsCA" ||
        id === "durationCA"
      ) {
        // text label for the x axis
        svg.append("text")
          .attr(
            "transform",
            "translate(" + (width) + " ," +
              (height + margin.top) + ")",
          )
          .style("text-anchor", "middle")
          .text("DST");

        // text label for the y axis
        svg.append("text")
          .attr("y", -20)
          .attr("x", -20)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("SRC");
      } else if (id === "codeAnalysis") {
      } else {
        // text label for the x axis
        svg.append("text")
          .attr(
            "transform",
            "translate(" + (width) + " ," +
              (height + margin.top) + ")",
          )
          .style("text-anchor", "middle")
          .text("TO");

        // text label for the y axis
        svg.append("text")
          .attr("y", -20)
          .attr("x", -20)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("FROM");
      }
    }
  };

  return (
    <div id={props.id} className="chart">
      <h3 className="alignLeft title">{props.name}</h3>
      {window.location.pathname !== "/connectivity" && (
        <Animation
          name={props.name}
          type={props.type}
          setData={setData}
          dataAll={currentData}
        />
      )}
    </div>
  );
}
