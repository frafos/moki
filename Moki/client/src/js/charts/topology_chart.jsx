import React, { Component } from 'react';
import * as d3 from "d3";
import Animation from '../helpers/Animation';
import { createFilter, Colors } from '../../gui';

import emptyIcon from "/icons/empty_small.png";
import { showTooltip } from '../helpers/tooltip';

export default class topology extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: this.props.data
        }
        this.setData = this.setData.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.data !== prevState.data) {
            return { data: nextProps.data };
        }
        else return null;
    }

    componentDidUpdate(prevProps) {
        if (prevProps.data !== this.props.data) {
            this.setState({ data: this.props.data });
            this.draw(this.state.data, this.props.width, this.props.height, this.props.units, this.props.field1, this.props.field2);
        }
    }


    setData(data) {
        this.setState({ data: data });
    }

    draw(data, width, height, units, field1, field2) {
        units = units ? " (" + units + ")" : "";
        //FOR UPDATE: remove chart if it's already there
        var chart = document.getElementById("topologyChartSVG");
        if (chart) {
            chart.remove();
        }

        var legendSVG = document.getElementById("legendSVG" + this.props.id);
        if (legendSVG) {
            legendSVG.remove();
        }

        var links = data ? data[2] : [];
        var nodes = data ? data[0] : [];
        var xScale = d3.scaleOrdinal(Colors);
        var legendRectSize = 15;
        var legendSpacing = 3;
        var legendWidth = "200px";
        width = width - 300;//legend width


        if (!data || data.length === 0 || links.length === 0 || nodes.length === 0) {
            var g = d3.select('#topologyChart')
                .append("svg")
                .attr('width', width)
                .attr('height', 300)
                .attr('id', 'topologyChartSVG');

            g.append('svg:image')
                .attr("xlink:href", emptyIcon)
                .attr("class", "noData")
                .attr('transform', 'translate(' + width / 2 + ',100)')

            legendSVG = document.getElementById("divLegend" + this.props.id);
            if (legendSVG) {
                legendSVG.style.height = 0;
            }

        } else {

            legendSVG = document.getElementById("divLegend" + this.props.id);
            if (legendSVG) {
                legendSVG.style.height = "250px";
            }

            //get min a max value for nodes and links
            var minValueLink = links[0].value;
            var maxValueLink = 0;
            for (var i = 0; i < links.length; i++) {
                if (links[i].value > maxValueLink) {
                    maxValueLink = links[i].value;
                }

                if (links[i].value < minValueLink) {
                    minValueLink = links[i].value;
                }
            }

            var minValueNode = nodes[0].value;
            var maxValueNode = 0;

            for (i = 0; i < nodes.length; i++) {
                if (nodes[i].value > maxValueNode) {
                    maxValueNode = nodes[i].value;
                }

                if (nodes[i].value < minValueNode) {
                    minValueNode = nodes[i].value;
                }
            }

            var linkSizeScale = d3.scaleLog().domain([minValueLink, maxValueLink]).range([1, 5]);
            var nodeSizeScale = d3.scaleLog().domain([minValueNode, maxValueNode]).range([3, 10]);
            var notVisible = 0;

            var simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function (d) {
                    return d.id;
                }).distance(100).strength(0.5))
                .force("charge", d3.forceManyBody())
                .force('collide', d3.forceCollide(50))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .on('end', function () {
                    //checkVisibility(notVisible);
                })

            //Zoom functions 
            function zoom_actions(event) {
                g.attr("transform", event.transform);
            }

            // Create the zoom handler
            const zoom = d3.zoom()
                .on("zoom", zoom_actions);

            // Create primary <g> element
            var svg = d3.select('#topologyChart')
                .append("svg")
                .attr('id', 'topologyChartSVG')
                .attr('width', width)
                .attr('height', height)
                .call(zoom)

            g = svg.append('g')
                .attr("class", "everything");
            //.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

            //add zoom capabilities 
            var zoom_handler = d3.zoom().on("zoom", zoom_actions);
            zoom_handler(svg);

            var tooltip;

            // build the arrow.
            //var scaleMarker = d3.scaleLinear().domain([minValueNode, maxValueNode]).range([10, 20]);

            g.append('defs').append('marker')
                .attr('id', 'arrowhead')
                .attr('viewBox', '-0 -5 10 10')
                .attr('refX', 14)
                .attr('refY', 0)
                .attr('markerUnits', 'strokeWidth')
                .attr('orient', 'auto')
                // .attr('markerWidth',   function(d) { return scaleMarker(d.value);})
                .attr('markerWidth', 5)
                .attr('markerHeight', 5)
                .attr('xoverflow', 'visible')
                .append('svg:path')
                .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
                .attr('fill', 'gray')
                .attr('class', 'marker')
                .attr('stroke', 'gray');


            g.append('defs').append('marker')
                .attr('id', 'arrowheadblack')
                .attr('viewBox', '-0 -5 10 10')
                .attr('refX', 14)
                .attr('refY', 0)
                .attr('markerUnits', 'strokeWidth')
                .attr('orient', 'auto')
                // .attr('markerWidth',   function(d) { return scaleMarker(d.value);})
                .attr('markerWidth', 5)
                .attr('markerHeight', 5)
                .attr('xoverflow', 'visible')
                .append('svg:path')
                .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
                .attr('fill', '#343a40')
                .attr('class', 'marker')
                .attr('stroke', '#343a40');

            var link = g.selectAll('link')
                .data(links)
                .enter().append("path")
                .attr("stroke-width", function (d) {
                    return linkSizeScale(d.value);
                })
                .attr('class', 'link')
                .style('stroke', 'gray')
                .attr("source", function (d) {
                    return d.source
                })
                .attr("target", function (d) {
                    return d.target
                })
                .style('fill', 'none')
                .attr('marker-end', function (d) {
                    if (d.source === d.target) {
                        return '';
                    } else {
                        return 'url(#arrowhead)';
                    }

                });

            var node = g.append("g")
                .attr("class", "nodes")
                .selectAll("g")
                .data(nodes)
                .enter().append("g")

            node.append("circle")
                .attr("r", function (d) {
                    return nodeSizeScale(d.value)
                })
                .attr("class", "circle")
                .attr("fill", function (d) {
                    return xScale(d.ip);
                })
                .attr("id", function (d) {
                    return d.id
                })
                .attr("ip", function (d) {
                    return d.ip
                })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended))
                .style("cursor", "pointer")
                .on('mouseover', (event, d) => {
                    mouseOverAnimation(d.ip);

                    tooltip = d3.select('#topologyChart').append('div')
                        .attr('class', 'tooltip tooltipTopology')
                        .html(`<span><strong>${d.ip}</strong>: ${d.value + units}</span>`);

                    showTooltip(event, tooltip);

                })
                .on("mousemove", function (event) {
                    showTooltip(event, tooltip);
                })
                .on('mouseout', function (_event, d) {
                    mouseOutAnimation(d.ip);
                    tooltip.remove()
                })
                .on("click", (_event, d) => {
                    createFilter(field1 + ":\"" + d.ip + "\" OR " + field2 + ":\"" + d.ip + "\"");
                    //bug fix: if you click but not move out
                    var tooltips = document.getElementsByClassName("tooltipDonut");
                    if (tooltip) {
                        for (var j = 0; j < tooltips.length; j++) {
                            tooltips[j].remove();
                        }
                    }
                })


            node.append("text")
                .text(function (d) {
                    return d.ip;
                })
                .attr('x', 17)
                .attr('y', 5);

            simulation
                .nodes(nodes)
                .on("tick", ticked);

            simulation.force("link")
                .links(links);


            function ticked() {
                for (let i = 0; i < 5; i++) {
                    simulation.tick();
                }
                link.attr("d", function (d) {
                    var x1 = d.source.x,
                        y1 = d.source.y,
                        x2 = d.target.x,
                        y2 = d.target.y,
                        // dx = x2 - x1,
                        // dy = y2 - y1,
                        // dr = Math.sqrt(dx * dx + dy * dy),

                        // Defaults for normal edge.
                        drx = 0,
                        dry = 0,
                        xRotation = 0, // degrees
                        largeArc = 0, // 1 or 0
                        sweep = 0; // 1 or 0

                    // Self edge.
                    if (x1 === x2 && y1 === y2) {
                        // Fiddle with this angle to get loop oriented.
                        xRotation = -45;

                        // Needs to be 1.
                        largeArc = 1;

                        // Change sweep to change orientation of loop.
                        //sweep = 0;

                        // Make drx and dry different to get an ellipse
                        // instead of a circle.
                        drx = 20;
                        dry = 10;

                        // For whatever reason the arc collapses to a point if the beginning
                        // and ending points of the arc are the same, so kludge it.
                        x2 = x2 + 1;
                        y2 = y2 + 1;
                    }

                    return "M" + x1 + "," + y1 + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;
                });

                node.attr("transform", function (d) {
                    if (d.x < 0) {
                        if (notVisible > d.x) notVisible = d.x;
                    }
                    if (d.y < 0) {
                        if (notVisible > d.y) notVisible = d.y;
                    }
                    return "translate(" + d.x + "," + d.y + ")";
                })
            }

            function checkVisibility(notVisible) {
                if (notVisible < 0) {
                    let scaleFactor = (notVisible % 10) / 10;
                    var transform = d3.zoomIdentity.translate(width / 8, (height / 8) + 10).scale(1 + scaleFactor);
                    svg.call(zoom.transform, transform);
                }
            }

            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.01).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }

            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }

            var divLegend = d3.select("#divLegend" + this.props.id);
            var legendHeight = data[1].length * 16;

            divLegend = divLegend.append("svg").attr('height', legendHeight).attr('width', legendWidth).attr('id', "legendSVG" + this.props.id)

            var legend = divLegend.selectAll('.legend')
                .data(data[1])
                .enter()
                .append('g')
                .attr('class', 'legend')
                .attr('transform', function (d, i) {
                    var height = legendRectSize;
                    var horz = -2 * legendRectSize + 50;
                    var vert = i * height;
                    return 'translate(' + horz + ',' + vert + ')';
                })
                .on('mouseover', function (_event, d) {
                    //selection animation
                    mouseOverAnimation(d);
                })
                .on('mouseout', function (_event, d) {
                    mouseOutAnimation(d);
                });

            legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style("stroke-width", "2px")
                .style("stroke", "white")
                .attr('fill', function (d, i) {
                    return xScale(d);
                }).on("click", (_event, d) => {
                    createFilter(field1 + ":\"" + d + "\" OR " + field2 + ":\"" + d + "\"");
                    //bug fix: if you click but not move out
                    var tooltips = document.getElementsByClassName("tooltipDonut");
                    if (tooltip) {
                        for (var j = 0; j < tooltips.length; j++) {
                            tooltips[j].remove();
                        }
                    }
                });

            legend.append('text')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize - legendSpacing)
                .text(function (d, i) {
                    //find value to key
                    let value = 0;
                    for (let hit of data[0]) {
                        if (hit.ip === d) {
                            value = hit.value;
                            break;
                        }
                    }
                    if (d.length <= 20) {
                        return d + " (" + value + ")";
                    }
                    else {
                        return d.substring(0, 20) + "... (" + value + ")";
                    }
                })
                .on("click", (_event, d) => {
                    createFilter(field1 + ":\"" + d + "\" OR " + field2 + ":\"" + d + "\"");
                    //bug fix: if you click but not move out
                    var tooltips = document.getElementsByClassName("tooltipDonut");
                    if (tooltip) {
                        for (var j = 0; j < tooltips.length; j++) {
                            tooltips[j].remove();
                        }
                    }
                })
                .append("svg:title")
                .text(function (d) { return d})
                .on("click", (_event, d) => {
                    createFilter(field1 + ":\"" + d + "\" OR " + field2 + ":\"" + d + "\"");
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
                let nodes = document.getElementsByClassName("circle");
                let nodeId = "";
                let adjacentNodes = [];
                //check also links to nodes                       
                for (let node of data[2]) {
                    if (node.source.ip === name) {
                        adjacentNodes.push(node.target.ip)
                    }
                    else if (node.target.ip === name) {
                        adjacentNodes.push(node.source.ip)
                    }
                }
                for (let node of nodes) {
                    if (node.getAttribute("ip") !== name) {
                        if (!adjacentNodes.includes(node.getAttribute("ip"))) {
                            node.style.fill = "grey";

                            node.nextSibling.style.visibility = "hidden";
                        }
                    }
                    else {
                        nodeId = node.getAttribute("id");
                    }
                }
                let links = document.getElementsByClassName("link");
                for (let link of links) {
                    if (link.getAttribute("source") === nodeId || link.getAttribute("target") === nodeId) {

                        link.style.stroke = "#343a40";
                        link.style.fill = "#343a40";
                        link.setAttribute('marker-end', 'url(#arrowheadblack)')
                    }
                }
            }

            //on mouse out reset selected
            function mouseOutAnimation() {
                //selection animation
                let nodes = document.getElementsByClassName("circle");
                for (let node of nodes) {
                    node.style.fill = xScale(node.getAttribute("ip"));
                    node.nextSibling.style.visibility = "visible";
                }
                let links = document.getElementsByClassName("link");
                for (let link of links) {
                    link.style.stroke = "grey";
                    link.style.fill = "grey";
                    link.setAttribute('marker-end', 'url(#arrowhead)')
                }

            }
        }

    }

    render() {
        return (<div className="chart">
            <h3 className="alignLeft title" > {this.props.name} </h3>  {window.location.pathname !== "/connectivity" && <Animation name={this.props.name} type={this.props.type} setData={this.setData} dataAll={this.state.data} />}
            <div className="row" style={{ "width": "max-content", "marginTop": "10px" }}>
                <div className="col-auto" >
                    <div id="topologyChart" />
                </div >
                <div className="col-auto">
                    <div id={"divLegend" + this.props.id} style={{ "height": "250px", "width": "250px", "overflowX": "auto", "marginTop": "15px" }} />
                </div>
            </div>
        </div >)
    }
}
