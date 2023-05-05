import React, { Component } from 'react';
import * as d3 from "d3";
import { ColorType, getExceededColor, Colors, 
    ColorsReds, getExceededName, Types, createFilter } from '../../gui';

import store from "@/js/store";

import emptyIcon from "/icons/empty_small.png";
import { showTooltip } from '../helpers/tooltip';

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

    async componentDidUpdate(prevProps) {
        if (prevProps.data !== this.props.data) {
            this.setState({ data: this.props.data });
            await this.draw(this.props.data, this.props.id, this.props.field, this.props.units);
        }
    }

    //d3js can't select element with special chart in ID
    getArcId(name) {
        name = name.toString();
        name = name.replace(/ /g, '');
        return "o" + name.replace(/[&\/\\#,+()$~%.'":*!?<>{}]/g, '');
    }

    getSeverityString(severity) {
        if (severity === "0") return "high";
        else if (severity === "1") return "medium";
        else return "low";
    }



    async draw(data, id, field, units) {
        const thiss = this;
        units = units ? " (" + units + ")" : "";
        //FOR UPDATE: remove chart if it's already there
        var chart = document.getElementById(id + "SVG");
        if (chart) {
            chart.remove();
        }

        var legendSVG = document.getElementById("legendSVG" + this.props.id);
        if (legendSVG) {
            legendSVG.remove();
        }

        var pie = d3.pie()
            .value(function (d) {
                return d.doc_count
            })
            .sort(null)
            .padAngle(.0);

        var height = 200;
        var width = 200;
        var h = height;
        var svgWidth = width;
        var legendRectSize = 15;
        var legendSpacing = 3;

        var radius = Math.min(width, height) / 2 - 20;
        var color;
        var colorScale = d3.scaleOrdinal(ColorsReds);
        var colorScaleMix = d3.scaleOrdinal(Colors);
        const profile = store.getState().persistent.profile;

        function color(nmb, i) {
            nmb = nmb.substring(1);
            if (field === "attrs.rtp-MOScqex-avg") {
                if (nmb >= 4) {
                    return "#6b9235";
                } else if (nmb >= 3) {
                    return "#FF9800";
                } else if (nmb >= 2) {
                    return "#FF5607";
                } else {
                    return "#F6412D";
                }

            } else if (field === "attrs.type") {
                return ColorType[nmb];
            } else if (field === "severity") {
                if (nmb === "0") return "red";
                else if (nmb === "1") return "orange";
                else return "green";
            } else if (field === "encrypt") {
                var hmac = profile[0] ? profile[0].userprefs.validation_code : "";
                var mode = profile[0] ? profile[0].userprefs.mode : "";
                //fix: value has remove spec char
                hmac = thiss.getArcId(hmac);
                hmac = hmac.substring(1);
                if ((mode === "anonymous" && nmb !== "plain") || (nmb === "plain" && mode === "plain") || (mode === "encrypt" && nmb === hmac)) {
                    return "green";
                }
                else {
                    return colorScale(i);
                }
            } else if (field === "exceeded") {
                return getExceededColor(nmb);
            }
            else {
                return colorScaleMix(nmb)
            }
        }

        var svg = d3.select('#' + id).append("svg");

        if (data.length === 0) {
            svg.attr('width', 250)
                .attr('height', 200)
                .attr('id', id + 'SVG');

            svg.append('svg:image')
                .attr("xlink:href", emptyIcon)
                .attr("class", "noData")
                .attr('transform', 'translate(' + 150 + ',' + 200 / 2 + ')');

            legendSVG = document.getElementById("divLegend" + this.props.id);
            if (legendSVG) {
                legendSVG.style.height = 0;
            }

        } else {
            //show only top 10 
            if (data.length > 10) data = data.slice(0, 10);
            legendSVG = document.getElementById("divLegend" + this.props.id);
            if (legendSVG) {
                legendSVG.style.height = "170px";
            }

            var g = svg.attr('width', svgWidth + 50)
                .attr('height', h + 50)
                .attr('id', id + 'SVG')
                .attr("style", "margin-top: 30px")
                .attr("style", "margin-left: 20px")
                .append('g')
                .attr('transform', 'translate(100,110)');

            var tooltip;

            var arc = d3.arc()
                .innerRadius(10)
                .outerRadius(radius);

            var arcOver = d3.arc()
                .innerRadius(10)
                .outerRadius(radius + 7);

            var arcs = g.selectAll('path')
                .data(pie(data))
                .enter()
                .append('path')
                .attr('d', arc)
                .attr('class', function () {
                    return id;
                })
                .attr('id', function (d) {
                    return thiss.getArcId(d.data.key);
                })
                .style("stroke-width", "1px")
                .style("stroke", "white")
                .attr('fill', function (d, i) {
                    return color(thiss.getArcId(d.data.key), i);
                })
                .style("cursor", "pointer")
                .on('mouseover', async (event, d) => {
                    mouseOverAnimation(d.data.key);

                    var key = d.data.key;
                    if (field === "severity") {
                        key = thiss.getSeverityString(key);
                    }

                    tooltip = d3.select('#' + id).append('div')
                        .style("background", "white")
                        .attr('class', 'tooltip')
                        .html(`<span><strong>${key}</strong>: ${d3.format(',')(d.data.doc_count) + units}</span>`);

                   showTooltip(event, tooltip);

                })
                .on('mouseout', function (_event, d) {
                    mouseOutAnimation(d.data.key);
                    tooltip.remove();
                })
                .on("mousemove", function (event) {
                    showTooltip(event, tooltip);
                })
                .on("click", (_event, d) => {
                    if (this.props.disableFilter !== true) {

                        let key = d.data.key;
                        if (field === "severity") {
                            key = parseInt(el.data.key)
                        }
                        createFilter(field + ":\"" + key + "\"");
                        //bug fix: if you click but not move out
                        var tooltips = document.getElementsByClassName("tooltipDonut");
                        if (tooltip) {
                            for (var j = 0; j < tooltips.length; j++) {
                                tooltips[j].remove();
                            }
                        }
                    }
                });


            let angleInterpolation = d3.interpolate(pie.startAngle()(), pie.endAngle()());

            //disable animation
            const user = store.getState().persistent.user;
            if (user.user !== "report") {
                arcs.transition()
                    .duration(1200)
                    .attrTween("d", d => {
                        let originalEnd = d.endAngle;
                        return t => {
                            let currentAngle = angleInterpolation(t);
                            if (currentAngle < d.startAngle) {
                                return "";
                            }
                            d.endAngle = Math.min(currentAngle, originalEnd);
                            return arc(d);
                        };
                    });
            }
            
            var divLegend = d3.select("#divLegend" + this.props.id);
            var legendHeight = data.length * 16;

            divLegend = divLegend.append("svg").attr('height', legendHeight).attr('width', "200px").attr('id', "legendSVG" + this.props.id)

            var legend = divLegend.selectAll('.legend')
                .data(data)
                .enter()
                .append('g')
                .attr('class', 'legend')
                .attr('transform', function (d, i) {
                    var height = legendRectSize;
                    var horz = -2 * legendRectSize + 50;
                    var vert = i * height;
                    return 'translate(' + horz + ',' + vert + ')';
                })
                .on('mouseover', async (_event, d) => {
                    //selection animation
                    mouseOverAnimation(d.key);
                })
                .on('mouseout', function (_event, d) {
                    mouseOutAnimation(d.key);
                });

            legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style("stroke-width", "2px")
                .style("stroke", "white")
                .attr('fill', function (d, i) {
                    return color(thiss.getArcId(d.key), i);
                }).on("click", (_event, d) => {
                    if (this.props.disableFilter !== true) {
                        let key = d.key;
                        if (field === "severity") {
                            key = parseInt(d.data.key)
                        }
                        createFilter(field + ":\"" + key + "\"");
                        //bug fix: if you click but not move out
                        var tooltips = document.getElementsByClassName("tooltipDonut");
                        if (tooltip) {
                            for (var j = 0; j < tooltips.length; j++) {
                                tooltips[j].remove();
                            }
                        }
                    }
                });

            legend.append('text')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize - legendSpacing)
                .text(function (d) {
                    for (var i = 0; i < pie(data).length; i++) {
                        d.key = d.key.toString();

                        var key = d.key;
                        if (field === "severity") {
                            key = thiss.getSeverityString(key);
                        }

                        if (key.length <= 20) {
                            if (Types[key]) {
                                return Types[key] + " (" + d.doc_count + ")";
                            }
                            else if (field === "exceeded") {
                                return getExceededName(key).then(val => {
                                    if (val.length <= 20) {
                                        this.textContent = val + " (" + d.doc_count + ")";
                                    }
                                    else {
                                        this.textContent = val.substring(0, 20) + "...  (" + d.doc_count + ")";
                                    }
                                })
                            }
                            else {
                                return key + " (" + d.doc_count + ")";
                            }
                        }
                        else {
                            return key.substring(0, 20) + "... (" + d.doc_count + ")";
                        }
                    }
                })
                .on("click", (_event, d) => {
                    if (this.props.disableFilter !== true) {
                        let key = d.key;
                        if (field === "severity") {
                            key = parseInt(key)
                        }
                        createFilter(field + ":\"" + key + "\"");

                        //bug fix: if you click but not move out
                        var tooltips = document.getElementsByClassName("tooltipDonut");
                        if (tooltip) {
                            for (var j = 0; j < tooltips.length; j++) {
                                tooltips[j].remove();
                            }
                        }
                    }
                })
                .append("svg:title")
                .text(function (d) { return d.key })
                .on("click", (_event, d) => {
                    let key = d.key;
                    if (field === "severity") {
                        key = parseInt(d.key)
                    }
                    createFilter(field + ":\"" + key + "\"");
                    //bug fix: if you click but not move out
                    var tooltips = document.getElementsByClassName("tooltipDonut");
                    if (tooltip) {
                        for (var j = 0; j < tooltips.length; j++) {
                            tooltips[j].remove();
                        }
                    }
                });


            //on mouse over show selected arc
            function mouseOverAnimation(name) {
                //selection animation
                let arcs = document.getElementsByClassName(id);
                let idArc = thiss.getArcId(name);
                for (let arc of arcs) {
                    if (arc.id !== idArc) {
                        arc.setAttribute("fill", "grey");
                    }
                }
                d3.select('#' + idArc).transition().attr("d", arcOver);
            }

            //on mouse out reset selected
            function mouseOutAnimation(name) {
                let arcs = document.getElementsByClassName(id);
                let idArc = thiss.getArcId(name);
                let i = 0;
                for (let arc of arcs) {
                    arc.setAttribute("fill", color(arc.id, i));
                    i++;
                }
                d3.select('#' + idArc).transition().attr("d", arc);

            }

        }
    }

    render() {
        return (
            <div className="chart chartMinHeight" style={{ "marginLeft": "0px" }}>
                <h3 className="alignLeft title" style={{ "float": "inherit" }}> {this.props.name} </h3>
                <div className="row" style={{ "width": "max-content", "marginTop": "10px" }}>
                    <div className="col-auto" >
                        <div id={this.props.id} />
                    </div >
                    <div className="col-auto">
                        <div id={"divLegend" + this.props.id} style={{ "height": "170px", "width": "250px", "overflowX": "auto", "marginTop": "15px" }} />
                    </div>
                </div>
            </div>
        )
    }
}
