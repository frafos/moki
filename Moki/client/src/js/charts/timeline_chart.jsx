import React, {
    Component
} from 'react';
import * as d3 from "d3";
import emptyIcon from "../../styles/icons/empty_small.png";
import { parseTimestamp } from "../helpers/parseTimestamp";

export default class TimeLineChart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: []
        }
        this.wrap = this.wrap.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props !== nextProps) {
            this.setState({ data: this.props.data });
            this.draw(this.props.data, this.props.id);
        }
    }

    wrap(text, width) {
        let thiss = this;
        //split by /
        text.each(function () {
            var text = d3.select(this),
                words = text.text().split("/").reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 0.7, // ems
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
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("value", word).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word).on("click", function (_event, d) {
                        let value = this.getAttribute("value");
                        value = value.replace(/\//g, '');

                        if (d.docid) {
                            for (let id of d.docid) {
                                if (id[value] && id[value] !== null) {
                                    thiss.props.redirect(id[value]);
                                }
                            }
                        }

                    });
                }
            }
        });
    }

    draw(data, id) {
        //FOR UPDATE: remove chart if it's already there
        var chart = document.getElementById(id + "SVG");
        if (chart) {
            chart.remove();
        }

        //max and min date
        var maxTime = data.maxTime;
        var minTime = data.minTime;
        // Clean up lost tooltips
        var elements = document.getElementById('tooltip' + id);
        if (elements) {
            elements.parentNode.removeChild(elements);
        }
        var margin = {
            top: 20,
            right: 20,
            bottom: 100,
            left: 70
        };

        //get max height text
        let longestText = 0;
        for (let hit of data.data) {
            if (hit.name.length > longestText) {
                longestText = hit.name.length;
            }
        }
        var height = longestText < 30 ? 80 : longestText < 45 ? 150 : 200;
        var svg = d3.select('#' + id)
            .append("svg")
            .attr('width', '100%')
            .attr('height', height + margin.top + margin.bottom)
            .attr('id', id + "SVG")
            .append('g');

        var svgWidth = d3.select('#' + id).node().clientWidth;
        if (svgWidth === 0) svgWidth = 500;
        var legendWidth = 110;
        var legendSpacer = 10;

        let xValues = [];
        for (let hit of data.data) {
            xValues.push(hit.timestamp);
        }

        var width = svgWidth - (margin.left + margin.right + legendSpacer + legendWidth);
        if (width < 100) width = 100;
        var xScale = d3.scaleLog()
            .range([0, width])
            .domain([minTime, maxTime]);

        var xAxis = d3.axisBottom(xScale)
            .tickValues(xValues).tickFormat(d3.timeFormat("%d %b %H:%M %p"));

        var tooltip = d3.select('#' + id).append('div')
            .attr('id', 'tooltip ' + id)
            .attr("class", "tooltip");
        tooltip.append("div");

        svg.selectAll("circles")
            .data(data.data)
            .enter()
            .append("g")
            .append("circle")
            .attr("cx", function (d) { return xScale(d.timestamp); })
            .attr("cy", function () { return height; })
            .attr("r", "6")
            .style("fill", function (d, i) {
                if (d.type === "present") return "var(--main)"
                else return "#69b3a2"
            })
            .on('mouseover', (event, d) => {
                //show all data 
                let data = "";
                for (let hit of d.timestamps) {
                    if (data !== "") {
                        data = data + "<br/>";
                    }
                    data = data + "<strong>" + Object.keys(hit)[0] + ":</strong><br/>" + parseTimestamp(new Date(hit[Object.keys(hit)[0]]));
                }
                tooltip.style("visibility", "visible");
                tooltip.select("div").html(data);

                var tooltipDim = tooltip.node().getBoundingClientRect();
                tooltip
                    .style("left", (event.clientX + document.body.scrollLeft - (tooltipDim.width / 2)) + "px")
                    .style("top", (event.clientY + document.body.scrollTop) + 10 + "px");
            })
            .on('mouseout', () =>
                tooltip.style("visibility", "hidden"))
            .on("mousemove", function (event) {
                var tooltipDim = tooltip.node().getBoundingClientRect();
                tooltip
                    .style("left", (event.clientX + document.body.scrollLeft - (tooltipDim.width / 2)) + "px")
                    .style("top", (event.clientY + document.body.scrollTop + 10) + "px");
            })

        svg.selectAll('text.rotation')
            .data(data.data)
            .enter()
            .append('text')
            .text((d) => d.name)
            .attr('fill', 'black')
            .attr('dy', '0')
            .style("cursor", "pointer")
            .attr('transform', (d, i) => {
                return 'translate( ' + (xScale(d.timestamp) - 5) + ' , ' + (height - 10) + '),' + 'rotate(272)';
            })
            .call(this.wrap, 20)
            .on('mouseover', (event, d) => {
                //show all data 
                let data = "";
                for (let hit of d.timestamps) {
                    if (data !== "") {
                        data = data + "<br/>";
                    }
                    data = data + "<strong>" + Object.keys(hit)[0] + ":</strong><br/>" + parseTimestamp(new Date(hit[Object.keys(hit)[0]]));
                }
                tooltip.style("visibility", "visible");
                tooltip.select("div").html(data);

                var tooltipDim = tooltip.node().getBoundingClientRect();
                tooltip
                    .style("left", (event.clientX + document.body.scrollLeft - (tooltipDim.width / 2)) + "px")
                    .style("top", (event.clientY + document.body.scrollTop) + 10 + "px");
            })
            .on('mouseout', () =>
                tooltip.style("visibility", "hidden"))
            .on("mousemove", function (event, d) {
                var tooltipDim = tooltip.node().getBoundingClientRect();
                tooltip
                    .style("left", (event.clientX + document.body.scrollLeft - (tooltipDim.width / 2)) + "px")
                    .style("top", (event.clientY + document.body.scrollTop + 10) + "px");
            })

        svg.attr("transform", "translate(" + margin.left + "," + margin.right + ")");

        if (data.length === 0) {
            svg.append('svg:image')
                .attr("xlink:href", emptyIcon)
                .attr("class", "noData")
                .attr('transform', 'translate(' + (width / 3 + 20) + ',' + height / 4 + ')')

        } else {
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", `translate(0, ${height})`)
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");
        }
    }

    render() {
        return (<div id={this.props.id} ><h3 className="alignLeft title">{this.props.name}</h3>
        </div>)
    }
}