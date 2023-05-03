import * as d3 from "d3";
import Animation from "../helpers/Animation";
import { showTooltip } from "../helpers/tooltip";
import { Colors, ColorType } from "../../gui";

import emptyIcon from "/icons/empty_small.png";
import { useEffect, useState } from "react";

export default function BarChart(props) {
  const [currentData, setCurrentData] = useState(props.data);

  useEffect(() => {
    if (props.data == undefined) return;
    draw(props.data, props.width, props.units, props.name);
  }, [props.data, props.width]);

  const setData = (data) => {
    if (props.data == undefined) return;
    setCurrentData(data);
    draw(data, props.width, props.units, props.name);
  };

  const draw = (data, width, units, name) => {
    units = units ? " (" + units + ")" : "";
    //FOR UPDATE: remove chart if it's already there
    var chart = document.getElementById("barChartSVG");
    if (chart) {
      chart.remove();
    }

    //compute max label length to get bottom margin
    var bottomMargin = 100;
    if (data && data.length > 0) {
      var maxTextWidth = d3.max(data.map((n) => n.key.length));
      bottomMargin = maxTextWidth > 20 ? 100 : maxTextWidth * 13;
    }
    if (name === "TOTAL EVENTS IN INTERVAL") {
      bottomMargin = 100;
    }

    var margin = { top: 10, right: 20, bottom: bottomMargin, left: 60 };
    width = width - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;
    var xScale = d3.scaleBand()
      .range([0, width])
      .round(true)
      .paddingInner(0.1); // space between bars (it's a ratio)

    var yScale = d3.scaleLinear()
      .range([height, 0]);

    var xAxis = d3.axisBottom()
      .scale(xScale).tickFormat(function (d) {
        //tickValues
        if (name === "QoS HISTOGRAM") {
          if (d === "*-2.58") return "Nearly all users dissatisfied";
          else if (d === "2.58-3.1") return "Many users dissatisfied";
          else if (d === "3.1-3.6") return "Some users dissatisfied";
          else if (d === "3.6-4.03") return "Satisfied";
          else if (d === "4.03-*") return "Very satisfied";
          else return d;
        } else {
          return d;
        }
      });

    let maxY = 0;
    for (let hit of data) {
      if (hit.doc_count > maxY) maxY = hit.doc_count;
    }

    if (maxY <= 6 && name.includes("HISTOGRAM")) {
      function range(start, end) {
        return Array(end - start + 1).fill().map((_, idx) => start + idx);
      }
      var yValues = range(0, maxY + 1);
      var yAxis = d3.axisLeft().scale(yScale).tickValues(yValues).tickFormat(
        d3.format("d"),
      );
    } else {
      yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(5);
    }

    var colorScale = d3.scaleOrdinal(Colors);

    if (data !== undefined) {
      //bug fix: check if data are empty if all doc_count === 0
      var isEmpty = true;
      for (var i = 0; i < data.length; i++) {
        if (data[i].doc_count > 0) {
          isEmpty = false;
          break;
        }
      }
    }

    var svg = d3.select("#barChart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("id", "barChartSVG")
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.right})`);

    if (data !== undefined && data.length > 0 && !isEmpty) {
      if (name === "QoS HISTOGRAM") {
        xScale.domain(data.map((d) => d.key));
      } else {
        xScale.domain(data.map((d) => d.key));
      }
      yScale.domain([0, d3.max(data, (d) => d.doc_count + d.doc_count / 5)]);
    }

    function wrap(text, width) {
      text.each(function () {
        var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y)
            .attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr(
              "dy",
              ++lineNumber * lineHeight + dy + "em",
            ).text(word);
          }
        }
      });
    }

    if (data === undefined || data.length === 0 || isEmpty) {
      svg.append("svg:image")
        .attr("xlink:href", emptyIcon)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    } else {
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll("text")
        .call(wrap, 80)
        .style("text-anchor", "end")
        .attr("dx", "-.6em")
        .attr("dy", ".10em")
        .attr("transform", function (d) {
          return "rotate(-65)";
        });

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Count");

      // gridlines in y axis function
      function make_y_gridlines() {
        if (maxY <= 6 && name.includes("HISTOGRAM")) {
          return d3.axisLeft(yScale)
            .ticks(maxY);
        } else {
          return d3.axisLeft(yScale)
            .ticks(5);
        }
      }

      var tooltip = "";
      // if the value is too low, still remain visible
      // TODO: this kind of things should be factorized in methods
      const minHeight = 1.5;
      svg.selectAll(".bar").data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => xScale(d.key))
        .attr("width", xScale.bandwidth())
        .attr("y", (d) => {
          const barHeight = height - yScale(d.doc_count);
          if (barHeight < minHeight) {
            return yScale(d.doc_count) + barHeight - minHeight;
          }
          return yScale(d.doc_count);
        })
        .attr("height", (d) => {
          if (d.doc_count <= 0) return 0;
          return Math.max(height - yScale(d.doc_count), minHeight + 0.5);
        })
        .attr("value", function (d) {
          return d.doc_count;
        })
        .style("fill", function (d) {
          if (name === "QoS HISTOGRAM") {
            if (d.key === "*-2.58") return "#FE2E2E";
            if (d.key === "2.58-3.1") return "#F79F81";
            if (d.key === "3.1-3.6") return "#F3E2A9";
            if (d.key === "3.6-4.03") return "#95c196";
            if (d.key === "4.03-*") return "#4f9850";
          } else if (ColorType[d.key]) {
            return ColorType[d.key];
          } else {
            return colorScale(d.key);
          }
        })
        .on("mouseover", (event, d) => {
          tooltip = d3.select("#barChart").append("div")
            .attr("id", "tooltip tooltipBar")
            .attr("class", "tooltip");

          tooltip.html(
            `<strong>Key: </strong>${d.key}<br/><strong>Value: </strong>${
              d.doc_count + units
            }`,
          );
          showTooltip(event, tooltip);
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"))
        .on("mousemove", function (event) {
          showTooltip(event, tooltip);
        });

      //animation for 2 sec, transition delay is in milliseconds, DISABLE BECAUSE OF PLAY MODE
      /* Add 'curtain' rectangle to hide entire graph */
      /*
            var curtain = svg.append('rect')
                .attr('x', -1 * width)
                .attr('y', -1 * height)
                .attr('height', height)
                .attr('width', width)
                .attr('class', 'curtain')
                .attr('transform', 'rotate(180)')
                .style('fill', '#ffffff');

            // Now transition the curtain to double of its width
            curtain.transition()
                .duration(1200)
                .ease(d3.easeLinear)
                .attr('x', -2 * width - 50);
                */

      // add the Y gridlines
      svg.append("g")
        .attr("class", "grid")
        .call(
          make_y_gridlines()
            .tickSize(-width)
            .tickFormat(""),
        );
    }
  };

  return (
    <div id="barChart" className="chart">
      <h3 className="alignLeft title">{props.name}</h3>
      {props.name === "QoS HISTOGRAM" && (
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
