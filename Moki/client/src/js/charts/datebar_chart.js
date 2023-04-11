import React, {
    Component
} from 'react';
import * as d3 from "d3";
import store from "../store/index";
import { setTimerange } from "../actions/index";
import { Colors } from '@moki-client/gui';
import emptyIcon from "../../styles/icons/empty_small.png";
import { getTimeBucket, getTimeBucketInt } from "../helpers/getTimeBucket";
import { durationFormat } from "../helpers/durationFormat";
import { parseTimestamp, parseTimestampD3js, parseTimeData } from "../helpers/parseTimestamp";
import {setTickNrForTimeXAxis} from "../helpers/chart";
import { showTooltip } from '../helpers/tooltip';

export default class datebarChart extends Component {
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
            this.draw(this.props.data, this.props.id, this.props.marginLeft, this.props.height, this.props.width, this.props.name, this.props.units);
        }
    }

    draw(data, id, marginLeft, heightTotal, width, name, units) {
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

        for (let hit of data) {
            hit.time = parseTimeData(hit.time);
        }

        var margin = {
            top: 10,
            right: 45,
            bottom: 30,
            left: marginLeft + 45
        };
        width = width - margin.left - margin.right;
        var height = heightTotal - margin.top - margin.bottom;
        var colorScale = d3.scaleOrdinal(Colors);

        //max and min date
        var maxTime = parseTimeData(store.getState().timerange[1]) + getTimeBucketInt();
        var minTime = parseTimeData(store.getState().timerange[0]) - (60 * 1000); //minus one minute fix for round up


        var xScale = d3.scaleLinear()
            .range([0, width])
            .domain([minTime, maxTime]);

        var max = d3.max(data, d => d.agg.value + 5);
        var domain = max ? max + max / 3 : 1;

        var yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, domain]);

        var parseDate = parseTimestampD3js(store.getState().timerange[0], store.getState().timerange[1]);


        // gridlines in y axis function
        function make_y_gridlines() {
            return d3.axisLeft(yScale)
                .ticks(5)
        }


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

        var svg = d3.select('#' + id)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('id', id + 'SVG')
            .append('g');


        svg.attr('transform', `translate(${margin.left}, ${margin.top})`);

        if (data.length === 0) {
            svg.append('svg:image')
                .attr("xlink:href", emptyIcon)
                .attr("class", "noData")
                .attr('transform', 'translate(' + (width - 60) / 2 + ',' + height / 2 + ')')

        } else {

            svg.append('g')
                .attr('class', 'x axis')
                .attr('transform', `translate(0, ${height})`)
                .call(xAxis);

            svg.append('g')
                .attr('class', 'y axis')
                .call(yAxis)
                .append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', 6)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text('Count');

            svg.append("g")
                .attr("class", "brush")
                .call(d3.brushX()
                    .extent([[0, 0], [width, height]])
                    .on("end", brushended));



            function brushended() {
                if (!d3.event.sourceEvent) return;
                // Only transition after input.
                if (!d3.event.selection) return;
                // Ignore empty selections.
                var extent = d3.event.selection;
                var timestamp_gte = xScale.invert(extent[0]);
                var timestamp_lte = xScale.invert(extent[1]);
                var timestamp_readiable = parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " - " + parseTimestamp(new Date(Math.trunc(timestamp_lte)))
                store.dispatch(setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]));


            }

            var tooltip = d3.select('#' + id).append('div')
                .attr('id', 'tooltip ' + id)
                .attr("class", "tooltipCharts");
            tooltip.append("div");

            svg.selectAll('.bar').data(data)
                .enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('value', function (d) {
                    return d.agg.value;
                })
                .attr('fill', function (d) {
                    if (name === "ASR OVER TIME") {
                        if (d.agg.value >= 50) return "#58a959";
                        else if (d.agg.value >= 20) return "#f58231";
                        else return "#c41d03";

                    } else {
                        return colorScale(0);
                    }
                })
                .attr('x', function (d) {
                    //bug fix
                    if (xScale(d.key) < 0) {
                        return -1000;
                    }
                    return xScale(d.key);
                })
                .attr('width', function (d, i) {
                    var timebucket = getTimeBucket();
                    var nextTime = d.key;
                    if (timebucket.includes("m")) {
                        nextTime = nextTime + (timebucket.slice(0, -1) * 60 * 1000);
                    }
                    else if (timebucket.includes("s")) {
                        nextTime = nextTime + (timebucket.slice(0, -1) * 1000);
                    }
                    else {
                        nextTime = nextTime + (timebucket.slice(0, -1) * 60 * 60 * 1000);
                    }

                    if (nextTime < maxTime && d.key > minTime) {
                        return xScale(nextTime) - xScale(d.key) - 1;
                    }
                    return;
                })
                .attr('y', function (d) {
                    if (d.agg) return yScale(d.agg.value);
                    return 0;
                })
                .attr('height', function (d) {
                    if (d.agg) return height - yScale(d.agg.value);
                    return 0;
                })
                .on('mouseover', (d) => {
                    var timestamp = new Date(d.key);
                    var value = d3.format(',')(Math.round(d.agg.value));
                    if (name.includes("DURATION")) {
                        value = durationFormat(d.agg.value);
                    }
                    tooltip.select("div").html("<strong>Value:</strong> " + value + units + "</br><strong>Time: </strong>" + parseTimestamp(timestamp) + " + " + getTimeBucket());
                    showTooltip(tooltip)
                })
                .on('mouseout', () => //tooltip.transition().style('opacity', 0));
                    tooltip.style("visibility", "hidden"))
                .on("mousemove", function (d) {
                    showTooltip(tooltip)
                });


            //animation for 2 sec, transition delay is in milliseconds
            /* Add 'curtain' rectangle to hide entire graph */
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

            // add the Y gridlines
            svg.append("g")
                .attr("class", "grid")
                .call(make_y_gridlines()
                    .tickSize(-width)
                    .tickFormat("")
                )

        }
    }

    render() {
        var bucket = getTimeBucket();
        return (<div id={
            this.props.id
        } className="chart"> <h3 className="alignLeft title" > {
            this.props.name
        } <span className="smallText"> (interval: {bucket})</span></h3></div >)
    }
}
