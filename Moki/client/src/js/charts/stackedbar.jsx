import React, {
    Component
} from 'react';
import * as d3 from "d3";
import storePersistent from "../store/indexPersistent";
import { showTooltip } from '../helpers/tooltip';
import { createFilter, ColorType, Colors } from '../../gui';

import emptyIcon from "/icons/empty_small.png";

/*
format:
{key: value, sum: xxx, name: yyy}
*/
export default class StackedChart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: []
        }
        this.draw = this.draw.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.data !== prevState.data) {
            return { data: nextProps.data };
        }
        else return null;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.data !== this.props.data) {
            this.setState({ data: this.props.data });
            this.draw(this.props.data, this.props.id, this.props.width, this.props.name, this.props.units);
        }
    }

    draw(data, id, width, name, units) {
        units = units ? " (" + units + ")" : "";
        //FOR UPDATE: remove chart if it's already there
        var chart = document.getElementById(id + "SVG");
        if (chart) {
            chart.remove();
        }

        // Clean up lost tooltips
        var elements = document.getElementById('tooltip' + id);
        if (elements) {
            elements.parentNode.removeChild(elements);
        }
        var svg = d3.select('#' + id);
        var margin = {
            top: 30,
            right: 50,
            bottom: 50,
            left: 35
        };
        //window.innerWidth -200
        width = width - margin.left - margin.right - 30;
        var height = 200 - margin.top - margin.bottom;

        var colorScale = d3.scaleOrdinal(Colors);


        var rootsvg = svg.append("svg")
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('id', id + "SVG");
        //  .append('g');



        if (data !== undefined) {
            var max = d3.max(data, d => d.sum + 5);
            var domain = max ? max + max / 3 : 1;
        }
        var yScale = d3.scaleLinear().range([height, 0]).domain([0, domain]);
        var z = d3.scaleOrdinal().range(['#d53e4f', '#fc8d59', '#fee08b', '#ffffbf', '#e6f598', '#99d594', '#3288bd']);


        var yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(function (d) {
            if (d / 1000000000000 >= 1) return d / 1000000000000 + " T";
            if (d / 1000000000 >= 1) return d / 1000000000 + " G";
            if (d / 1000000 >= 1) return d / 1000000 + " M";
            if (d / 1000 >= 1) return d / 1000 + " K";
            return d;
        });




        rootsvg.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        if (data === undefined || data.length === 0) {
            rootsvg.append('svg:image')
                .attr("xlink:href", emptyIcon)
                .attr("class", "noData")
                .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

        } else {

            rootsvg.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + margin.left + ",0)").call(yAxis);

            function wrap(text, width) {
                //split by /
                text.each(function () {
                    var text = d3.select(this),
                        words = text.text().split("/").reverse(),
                        word,
                        line = [],
                        lineNumber = 0,
                        lineHeight = 1.1, // ems
                        y = text.attr("y"),
                        dy = parseFloat(text.attr("dy")),
                        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                    //return the split char
                    if (words.length > 1) words[1] = words[1] + "/";
                    while (word = words.pop()) {
                        line.push(word);
                        tspan.text(line.join(" "));
                        if (tspan.node().getComputedTextLength() > width) {
                            line.pop();
                            tspan.text(line.join(" "));
                            line = [word];
                            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                        }
                    }
                });
            }

            var x = d3.scaleBand()
                .range([0, width])
                .paddingInner(0.1);
            x.domain(data.map(function (d) {
                return d.name;
            }));
            var xAxis = d3.axisBottom(x);


            rootsvg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(" + margin.left + "," + (height) + ")")
                .call(xAxis)
                .selectAll(".tick text")
                .call(wrap, 70)
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            var g = rootsvg.append("g")
                .attr("transform", "translate(" + margin.left + ",0)");

            /*  x.domain(data.map(function (d) {
                  return d.name;
              }));*/

            z.domain(data.map(function (d) {
                return d.keys;
            }));

            /*
            var keys = d3.keys(data[2]).filter(function (d) {
                if (d !== "time") {
                    if (d !== "value") {
                        if (d !== "sum") {
                            return d;
                        }
                    }
                }
                return "";

            });
            */
            var keys = storePersistent.getState().layout.types[this.props.keys];
            //var id = 0;

            if(!keys){
                keys = [];
                for (let hit of data) {
                    for (let key of Object.keys(hit)) {
                        if(key !== "name" && key !== "sum"){
                            keys.push(key);
                        }
                    }
                }
            }
            var stack = d3.stack()
                .keys(keys)
                .order(d3.stackOrderNone)
                .offset(d3.stackOffsetNone);

            console.log(data);
            var layers = stack(data);
            console.log(layers)

            var layer = g.selectAll(".layer")
                .data(layers)
                .enter().append("g")
                .attr("class", "layer")
                .attr("type", function (d) {
                    return d.key;
                })
                .style("fill", function (d) {
                    if (name === "MoS STATS") {
                        if (d.key === "*-2.58") { return "#FE2E2E"; }
                        if (d.key === "2.58-3.1") { return "#F79F81"; }
                        if (d.key === "3.1-3.6") { return "#F3E2A9"; }
                        if (d.key === "3.6-4.03") { return "#95c196"; }
                        if (d.key === "4.03-*") { return "#4f9850"; }
                    }
                    else if (ColorType[d.key]) {
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
                    .ticks(5)
            }

            // if the value is too low, still remain visible
            // TODO: this kind of things should be factorized in methods
            const minHeight = 1.5;
            layer.selectAll("rect")
                .data(function (d) {
                    return d;
                })
                .enter().append("rect")
                .attr('class', 'barStacked')
                .attr("x", function (d) {
                    return x(d.data.name);
                })
                .attr('width', function (d, i) {
                    return x.bandwidth();
                })
                .attr('value', function (d) {
                    return d[1] - d[0];
                })
                .attr("y", function (d) {
                    const height = yScale(d[0]) - yScale(d[1]);
                    if (!height) return 0;
                    if (height < minHeight) {
                        return yScale(d[1]) + height - minHeight;
                    }
                    return yScale(d[1]);
                })
                .attr("height", function (d) {
                    const height = yScale(d[0]) - yScale(d[1]) ?? 0;
                    return Math.max(height, minHeight + 0.5);
                })
                .on("mouseover", function (event, d) {
                    tooltip.select("div").html("<strong>Type: </strong> " + this.parentNode.getAttribute("type") + "<br/><strong>Count:</strong> " + d3.format(',')(d[1] - d[0]) + units + "<br/>");
                    d3.select(this).style("cursor", "pointer");
                    showTooltip(event, tooltip)
                })
                .on("mouseout", function () {
                    tooltip.style("visibility", "hidden");
                })
                .on("mousemove", function (event) {
                    showTooltip(event, tooltip)
                });


            //filter type onClick
            layer.on("click", (_event, d) => {
                createFilter("attrs.type:" + d.key);
                var tooltips = document.getElementById("tooltip" + id);
                if (tooltip) {
                    tooltips.style.opacity = 0;
                }
            });


            //TODO add total sum
            /*layer.selectAll("text.rect")
                .data( layers[0])
                .enter().append("text")
                .attr("text-anchor", "middle")
                .attr("x", function (d) { return x(d.data.name) + x.bandwidth() / 2 })
                .attr("y", function (d, i) { return yScale(d[1])  })
                .text(function (d, i) { return d.data.sum; })
                .style("fill", "black");
*/

            //animation for 2 sec, transition delay is in milliseconds
            /* Add 'curtain' rectangle to hide entire graph */
            var curtain = rootsvg.append('rect')
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
                .attr('x', -2 * (width + 500));

            /*
                        // add the X gridlines
                        g.append("g")
                            .attr("class", "grid")
                            .attr("transform", "translate(0," + height + ")")
                            .call(make_x_gridlines()
                                .tickSize(-height)
                                .tickFormat("")
                            )
            */
            // add the Y gridlines
            g.append("g")
                .attr("class", "grid")
                .call(make_y_gridlines()
                    .tickSize(-width)
                    .tickFormat("")
                )

            // tooltip
            var tooltip = d3.select('#' + id).append("div")
                .attr('id', 'tooltip' + id)
                .attr("class", "tooltip");


            tooltip.append("div");


        }
    }

    render() {
        return (<div id={
            this.props.id
        } className="chart chartMinHeight"> <h3 className="alignLeft title" style={{ "float": "inherit" }} > {
            this.props.name
        } </h3></div >)
    }
}
