import React, {
    Component
} from 'react';
import * as d3 from "d3";
import { Colors, createFilter } from '../../gui';

import emptyIcon from "/icons/empty_small.png";

export default class sunburst extends Component {
    constructor(props) {
        super(props);
        this.state = {
            parentNodes: 0,
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
            this.draw(this.props.data, this.props.width, this.props.units);
        }
    }


    draw(data, widthSvg, units) {
        if (this.props.ends !== 0) {
            data.children.push({
                key: "success",
                value: this.props.ends,
                children: []
            });
        }
        units = units ? " (" + units + ")" : "";
        //FOR UPDATE: remove chart if it's already there
        var chart = document.getElementById("sunburstChartSVG");
        if (chart) {
            chart.remove();
        }
        var width = 180;
        var height = 220;
        var svgWidth = widthSvg;
        var legendRectSize = 15;
        var legendSpacing = 2;
        var radius = Math.min(width, height) / 2;
        var colorScale = d3.scaleOrdinal(Colors);

        if (!data || data.length === 0 || !data.children || data.children.length === 0) {
            var g = d3.select('#sunburstChart')
                .append("svg")
                .attr('width', svgWidth)
                .attr('height', height)
                .attr('id', 'sunburstChartSVG');

            g.append('svg:image')
                .attr("xlink:href", emptyIcon)
                .attr("class", "noData")
                .attr('transform', 'translate(' + svgWidth / 2 + ',30)');

        } else {
            //get number of parent nodes
            /*    if (data.children.length + 1 !== this.state.parentNodes) {
             this.setState({
                 parentNodes: data.children.length + 1
             });
         }
         */
            //animation for 2 sec, transition delay is in milliseconds
            //get count of all nodes

            var nodesCount = data.children.length;
            for (var o = 0; o < data.children.length; o++) {
                nodesCount = nodesCount + data.children[o].children.length;
            }
            var animationSpeed = 600 / nodesCount;

            // Create primary <g> element
            g = d3.select('#sunburstChart')
                .append("svg")
                .attr('id', 'sunburstChartSVG')
                .attr('width', svgWidth)
                .attr('height', height)
                .attr('style', "padding-top: 20px, padding-left: 10px")
                .append('g')
                .attr('transform', 'translate(' + width / 2 + ',' + height/ 2 + ')');

            // Data strucure
            var partition = d3.partition()
                .size([2 * Math.PI, radius]);

            // Find data root
            var root = d3.hierarchy(data)
                .sum(function (d) {
                    if (!d.children || d.children.length === 0) {
                        return d.value
                    }
                });

            // Size arcs
            partition(root);
            var arc = d3.arc()
                .startAngle(function (d) { return d.x0 })
                .endAngle(function (d) { return d.x1 })
                .innerRadius(function (d) { return d.y0 })
                .outerRadius(function (d) { return d.y1 });


            var tooltip;
            g.selectAll('path')
                .data(root.descendants())
                .enter().append('path')
                .attr("display", function (d) {
                    return d.depth ? null : "none";
                })
                .style('stroke', '#fff')
                .style("fill", function (d) {
                    //return colorScale((d.children ? d : d.parent).data.key);
                    if (d.data.key === "success") {
                        return "#58A959";
                    }
                    else if (d.data.key === "displayed") {
                        return "#58A959";
                    }
                    else if (d.data.key === "hidden") {
                        return "#c41d03";
                    }
                    else {
                        return colorScale(d.data.key);
                    }
                })
                .style("cursor", "pointer")
                .on('mouseover', (d) => {

                    tooltip = d3.select('#sunburstChart').append('div')
                        .style("background", "white")
                        .attr('class', 'tooltip tooltipSunburst')
                        .style('opacity', 0.9)
                        .style("position", "absolute")
                        .style("box-shadow", "0px 0px 6px black")
                        .style("padding", "10px")
                        .html(`<strong><span>${d.data.key}:</strong> ${d3.format(',')(d.data.value) + units}</span></strong>`);

                    var tooltipDim = tooltip.node().getBoundingClientRect();
                    var chartRect = d3.select('#sunburstChart').node().getBoundingClientRect();
                    tooltip
                        .style("left", (d3.event.clientX - chartRect.left + document.body.scrollLeft - (tooltipDim.width / 2)) + "px")
                        .style("top", (d3.event.clientY - chartRect.top + document.body.scrollTop + 30) + "px");
                })
                .on('mouseout', () => tooltip.remove())
                .on("mousemove", function (d) {
                    var tooltipDim = tooltip.node().getBoundingClientRect();
                    var chartRect = d3.select('#sunburstChart').node().getBoundingClientRect();
                    tooltip
                        .style("left", (d3.event.clientX - chartRect.left + document.body.scrollLeft - (tooltipDim.width / 2)) + "px")
                        .style("top", (d3.event.clientY - chartRect.top + document.body.scrollTop + 30) + "px");
                })
                .on("click", el => {
                    if (parseInt(el.data.key, 10)) {
                        createFilter("attrs.sip-code: \"" + el.data.key + "\"");
                    } else {
                        createFilter("termination: \"" + el.data.key + "\"");
                    }

                    //bug fix: if you click but not move out
                    var tooltips = document.getElementsByClassName("tooltipSunburst");
                    if (tooltip) {
                        for (var j = 0; j < tooltips.length; j++) {
                            tooltips[j].remove();
                        }
                    }
                })
                .transition().delay(function (d, i) { return i * animationSpeed })
                .attrTween("d", arcTween);

            function arcTween(d) {
                var i = d3.interpolate(d.startAngle, d.endAngle);
                return function (t) {
                    d.endAngle = i(t);
                    return arc(d);
                }
            }

            if (this.props.legend !== "off") {
                g.append('text')
                    .attr('x', 170)
                    .attr('y', -70)
                    .text("Net failure");
                //define legend
                var legend = g.selectAll('.legend')
                    .data(function () {
                        var noParents = [];
                        var data = root.descendants();

                        for (var i = 0; i < data.length; i++) {
                            if (data[i].height === 0 && data[i].data.key !== "success" && data[i].data.key !== "487" && data[i].data.key !== "486") {
                                noParents.push(data[i]);
                            }
                        }

                        return noParents;
                    })
                    .enter()
                    .append('g')
                    .attr('class', 'legend')
                    .attr('transform', function (d, i) {


                        var c = 2;   // number of columns
                        var h = 20;  // legend entry height
                        var w = 100; // legend entry width (so we can position the next column)
                        var tx = 150; // tx/ty are essentially margin values
                        var ty = -50;
                        var x = i % c * w + tx;
                        var y = Math.floor(i / c) * h + ty;
                        return "translate(" + x + "," + y + ")";


                    });


                g.append('text')
                    .attr('x', 370)
                    .attr('y', -70)
                    .text("User failure");

                //define legend
                var legendUser = g.selectAll('.legend2')
                    .data(function () {
                        var noParents = [];
                        var data = root.descendants();
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].data.key === "486" || data[i].data.key === "487") {
                                noParents.push(data[i]);
                            }
                        }
                        return noParents;
                    })
                    .enter()
                    .append('g')
                    .attr('class', 'legend')
                    .attr('transform', function (d, i) {


                        var c = 1;   // number of columns
                        var h = 20;  // legend entry height
                        var w = 100; // legend entry width (so we can position the next column)
                        var tx = 350; // tx/ty are essentially margin values
                        var ty = -50;
                        var x = i % c * w + tx;
                        var y = Math.floor(i / c) * h + ty;
                        return "translate(" + x + "," + y + ")";

                        //}
                    });



                legend.append('rect')
                    .attr('width', (function (d) {
                        if (parseInt(d.data.key)) {
                            return legendRectSize;
                        }
                    }))
                    .attr('height', legendRectSize)
                    .style("fill", function (d) {
                        // return colorScale((d.children ? d : d.parent).data.key);
                        if (d.data.key === "success") {
                            return "#58A959";
                        }
                        else if (d.data.key === "displayed") {
                            return "#58A959";
                        }
                        else if (d.data.key === "hidden") {
                            return "#c41d03";
                        }
                        else {
                            return colorScale(d.data.key);
                        }
                    })
                    .on("click", el => {
                        if (parseInt(el.data.key, 10)) {
                            createFilter("attrs.sip-code: \"" + el.data.key + "\"");
                        } else {
                            createFilter("termination: \"" + el.data.key + "\"");
                        }

                        //bug fix: if you click but not move out
                        var tooltips = document.getElementsByClassName("tooltipSunburst");
                        if (tooltip) {
                            for (var j = 0; j < tooltips.length; j++) {
                                tooltips[j].remove();
                            }
                        }
                    });

                legend.append('text')
                    .attr('x', legendRectSize + legendSpacing)
                    .attr('y', legendRectSize - legendSpacing)
                    .text(function (d) {
                        if (parseInt(d.data.key)) {
                            return d.data.key + " (" + d3.format(',')(d.data.value) + ")";
                        }
                    })
                    .on("click", el => {
                        if (parseInt(el.data.key, 10)) {
                            createFilter("attrs.sip-code: \"" + el.data.key + "\"");
                        } else {
                            createFilter("termination: \"" + el.data.key + "\"");
                        }

                        //bug fix: if you click but not move out
                        var tooltips = document.getElementsByClassName("tooltipSunburst");
                        if (tooltip) {
                            for (var j = 0; j < tooltips.length; j++) {
                                tooltips[j].remove();
                            }
                        }
                    });

                legendUser.append('rect')
                    .attr('width', (function (d) {
                        if (parseInt(d.data.key)) {
                            return legendRectSize;
                        }
                    }))
                    .attr('height', legendRectSize)
                    .style("fill", function (d) {
                        if (d.data.key === "success") {
                            return "#58A959";
                        }
                        else if (d.data.key === "displayed") {
                            return "#58A959";
                        }
                        else if (d.data.key === "hidden") {
                            return "#c41d03";
                        }
                        else {
                            return colorScale(d.data.key);
                        }
                        //return colorScale((d.children ? d : d.parent).data.key);
                    })
                    .on("click", el => {
                        if (parseInt(el.data.key, 10)) {
                            createFilter("attrs.sip-code: \"" + el.data.key + "\"");
                        } else {
                            createFilter("termination: \"" + el.data.key + "\"");
                        }

                        //bug fix: if you click but not move out
                        var tooltips = document.getElementsByClassName("tooltipSunburst");
                        if (tooltip) {
                            for (var j = 0; j < tooltips.length; j++) {
                                tooltips[j].remove();
                            }
                        }
                    });

                legendUser.append('text')
                    .attr('x', legendRectSize + legendSpacing)
                    .attr('y', legendRectSize - legendSpacing)
                    .text(function (d) {
                        if (parseInt(d.data.key)) {
                            return d.data.key + " (" + d3.format(',')(d.data.value) + ")";
                        }
                    })
                    .on("click", el => {
                        if (parseInt(el.data.key, 10)) {
                            createFilter("attrs.sip-code: \"" + el.data.key + "\"");
                        } else {
                            createFilter("termination: \"" + el.data.key + "\"");
                        }

                        //bug fix: if you click but not move out
                        var tooltips = document.getElementsByClassName("tooltipSunburst");
                        if (tooltip) {
                            for (var j = 0; j < tooltips.length; j++) {
                                tooltips[j].remove();
                            }
                        }
                    });
            }
        }

    }

    render() {
        return (<div id="sunburstChart"  className="chart chartMinHeight"> <h3 className="alignLeft title" style={{"float": "inherit"}} > {
            this.props.name
        }</h3></div>)
    }
}
