import React, {
    Component
} from 'react';
import * as d3 from "d3";

import emptyIcon from "/icons/empty_small.png";


export default class GaugeChart extends Component {

    componentDidUpdate(prevProps) {
        this.draw(this.props.data, this.props.id, this.props.width);
    }

    draw(data, id, width) {
        //FOR UPDATE: remove chart if it's already there
        var chart = document.getElementById(id + "SVG");
        if (chart) {
            chart.remove();
        }

        var height = width/3;
        var svg = d3.select('#' + id).append("svg");
        if (data === 0) {
            svg.attr('width', 250)
                .attr('height', 250)
                .attr('id', id + 'SVG');

            svg.append('svg:image')
                .attr("xlink:href", emptyIcon)
                .attr("class", "noData")
                .attr('transform', 'translate(' + 0 + ',' + 250 / 2 + ')');

        } else {

            svg.attr('width', width)
                .attr('height', height)
                .attr('style', "margin-top: 42px")
                .attr('id', id + 'SVG');

            var g = svg.append('g')
                .attr('transform', 'translate(' + width / 2 + ',' + height + ')');

            var value = data / 100;
            var text = Math.round(value * 100) + '%';
            data = [value, 1 - value];
            var anglesRange = 0.5 * Math.PI;
            var radis = Math.min(width, 2 * height) / 2;
            var thickness = 20;
            var colors = ["#ff0000", "#F5F5F5"];

            if (value < 0.5) {
                colors = ["#00ff00", "#F5F5F5"];
            }
            else if (value < 0.8) {
                colors = ["#ffa500", "#F5F5F5"];
            }


            var pies = d3.pie()
                .value(d => d)
                .sort(null)
                .startAngle(anglesRange * -1)
                .endAngle(anglesRange)

            var arc = d3.arc()
                .outerRadius(radis)
                .innerRadius(radis - thickness)

            g.selectAll("path")
                .data(pies(data))
                .enter()
                .append("path")
                .attr("fill", (d, i) => colors[i])
                .attr("d", arc)

            g.append("text")
                .text(d => text)
                .attr("dy", "-1rem")
                .attr("class", "h4")
                .attr("text-anchor", "middle")

        }
    }

    render() {
        return (
            <div id={this.props.id} className="chart chartMinHeight" style={{"width": this.props.id === "used_disc" ? "fit-content" : "100%"}}>
                <h3 className="alignLeft title"  style={{"float": "inherit"}}> {this.props.name} </h3>
            </div>)
    }
}
