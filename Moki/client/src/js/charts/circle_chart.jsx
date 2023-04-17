import React, {
    Component
} from 'react';
import * as d3 from "d3";

export default class circleChart extends Component {

    componentDidUpdate(prevProps) {
        this.draw(this.props.data, this.props.id);
    }

    draw(data, id) {
        //FOR UPDATE: remove chart if it's already there
        var chart = document.getElementById(id+"SVG");
        if (chart) {
            chart.remove();
        }

        var size = 10;
        var width = size*2;
        var height = size*2;
        
        var color = "#ff0000";
        if(data && typeof data === "string" && data.startsWith("active")){
                color ="#00ff00";
        }

        var svg = d3.select('#' + id)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
             .attr('id', id + 'SVG');

        
        svg.append("circle")
            .attr("cx", size)
            .attr("cy", size)
            .attr("r", size)
            .style("fill", color);
    }
        render() {
            return ( <div style={{"display": "inline", "marginRight": "10px"}} id={this.props.id} />
                   )
        }
    }
