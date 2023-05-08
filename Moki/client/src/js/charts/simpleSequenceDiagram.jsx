import React, { Component } from 'react';
import * as d3 from "d3";
import { parseTimestamp } from "../helpers/parseTimestamp";

const eventDetails = ["attrs.r-uri", "r-uri-shorted", "attrs.source", "attrs.contact", "attrs.call-id", "attrs.from", "attrs.reason", "attrs.to", "attrs.method", "attrs.transport", "attrs.src-port", "attrs.sip-code", "attrs.from-ua", "server.port", "server.ip", "dbg.fromtag", "dbg.totag", "uas.original"];


class SimpleSequenceDiagram extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: this.props.data,
            dataAll: this.props.data
        }

        this.load = this.load.bind(this);
        this.draw = this.draw.bind(this);
    }

    componentDidMount() {
        this.load();
    }


    /*load data and change data format 
       id, src, dst, msg, color
       msg_trace: ">REGISTER>REGISTER{1}<401<401{1}>REGISTER>REGISTER{1}<200"
      */
    async load() {
        var data = this.props.data;
        var dataNew = [];
        var trace = data.dbg.msg_trace;
        var id = 1;

        while (!(trace.indexOf("<") === -1 && trace.indexOf(">") === -1)) {
            var src = "";
            var dst = "";
            var color = "";
            var msg = "";

            if ((trace.indexOf("<") < trace.indexOf(">")) && trace.indexOf("<") !== -1) {
                src = 1;
                dst = 0;
                color = "blue";
            }
            else if ((trace.indexOf(">") < trace.indexOf("<")) && trace.indexOf(">") !== -1) {
                src = 0;
                dst = 1;
                color = "red";
            }
            else if (trace.indexOf(">") !== -1 && trace.indexOf("<") === -1) {
                src = 0;
                dst = 1;
                color = "red";
            }
            else {
                src = 1;
                dst = 0;
                color = "blue";
            }

            trace = trace.substring(1, trace.length);

            //find second symbol and add msg
            if ((trace.indexOf("<") < trace.indexOf(">")) && trace.indexOf("<") !== -1) {
                msg = trace.substring(0, trace.indexOf("<"));
                trace = trace.substring(trace.indexOf("<"), trace.length);
            }
            else if ((trace.indexOf(">") < trace.indexOf("<")) && trace.indexOf(">") !== -1) {
                msg = trace.substring(0, trace.indexOf(">"));
                trace = trace.substring(trace.indexOf(">"), trace.length);
            }
            else if (trace.indexOf(">") !== -1 && trace.indexOf("<") === -1) {
                msg = trace.substring(0, trace.indexOf(">"));
                trace = trace.substring(trace.indexOf(">"), trace.length);
            }
            else if (trace.indexOf("<") !== -1 && trace.indexOf(">") === -1) {
                msg = trace.substring(0, trace.indexOf("<"));
                trace = trace.substring(trace.indexOf("<"), trace.length);
            }
            else {
                msg = trace;
            }

            dataNew.push({
                id: id,
                src: src,
                dst: dst,
                msg: msg,
                color: color
            });
            id++;
        }


        this.setState({
            data: dataNew
        })

        this.draw(dataNew);
    }

    draw(data) {
        var margin = { top: -20, right: 20, bottom: 20, left: 0 };
        var width = 400 - margin.left - margin.right;
        var height = (120 + data.length * 50) < 300 ? 300 : 120 + data.length * 50;
        var classes = [this.state.dataAll.attrs.source + ":" + this.state.dataAll.attrs["src-port"], this.state.dataAll.server.ip + ":" + this.state.dataAll.server.port];
        var XPAD = 30;
        var YPAD = 20;
        var VERT_SPACE = 300;
        var VERT_PAD = 40;

        var CLASS_LABEL_X_OFFSET = 30;
        var CLASS_LABEL_Y_OFFSET = 25;

        var MESSAGE_SPACE = 50;
        var MESSAGE_LABEL_X_OFFSET = -40;
        var MESSAGE_LABEL_Y_OFFSET = 70;
        var MESSAGE_ARROW_Y_OFFSET = 80;

        // Create an svg canvas
        var svg = d3.select('#simpleSequenceDiagram')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height)
            .attr('id', 'diagramSVG')
            .attr('transform', `translate(${margin.left}, ${margin.right})`);


        // Draw vertical lines
        classes.forEach(function (c, i) {
             svg.append("line")
                .style("stroke", "#888")
                .attr("x1", XPAD + i * VERT_SPACE)
                .attr("y1", YPAD + 30)
                .attr("x2", XPAD + i * VERT_SPACE)
                .attr("y2", YPAD + 30 + VERT_PAD + data.length * MESSAGE_SPACE);
        });


        // Draw class labels
        classes.forEach(function (c, i) {
            var x = XPAD + i * VERT_SPACE;
            svg.append("g")
                .attr("transform", "translate(" + x + "," + YPAD + ")")
                .attr("class", "first")
                .append("text")
                .text(function (d) { return c; })
                .attr("dx", function (d) { if (i === 0) return -CLASS_LABEL_X_OFFSET; return -CLASS_LABEL_X_OFFSET * 2 })
                .attr("dy", CLASS_LABEL_Y_OFFSET)
        });

        // Draw message arrows
        data.forEach(function (m, i) {
            var y = YPAD + MESSAGE_ARROW_Y_OFFSET + i * MESSAGE_SPACE;
            if (m.msg.includes("{")) {
                svg.append("line")
                    .style("stroke", m.color)
                    .attr("x1", XPAD + m.src * VERT_SPACE)
                    .attr("y1", y)
                    .attr("x2", XPAD + m.dst * VERT_SPACE)
                    .attr("y2", y + 10)
                    .style("stroke-dasharray", ("3, 3"))
                    .attr("marker-end", "url(#end)")

            }
            else {
                svg.append("line")
                    .style("stroke", m.color)
                    .attr("x1", XPAD + m.src * VERT_SPACE)
                    .attr("y1", y)
                    .attr("x2", XPAD + m.dst * VERT_SPACE)
                    .attr("y2", y + 10)
                    .attr("marker-end", "url(#end)")
                    .append("text")
                    .text(function (d) { return m.msg; });
            }

        });

        var time = parseTimestamp(this.state.dataAll.dbg.created, true);
        // Draw message labels
        data.forEach(function (m, i) {
            var xPos = XPAD + MESSAGE_LABEL_X_OFFSET + (((m.dst - m.src) * VERT_SPACE) / 2) + (m.src * VERT_SPACE);
            var yPos = YPAD + MESSAGE_LABEL_Y_OFFSET + i * MESSAGE_SPACE;

            //draw time on first line
            if (i === 0) {
                svg.append("g")
                    .attr("transform", "translate(" + xPos + "," + (yPos + 10) + ")")
                    .attr("class", "first")
                    .append("text")
                    .text(function (d) {
                        return time;
                    });
            }

            svg.append("g")
                .attr("transform", "translate(" + xPos + "," + yPos + ")")
                .attr("class", "first")
                .append("text")
                .text(function (d) {
                    if (m.msg.includes("{")) { return m.msg.substring(0, m.msg.indexOf("{")) }
                    return m.msg;
                });
        });

        // Arrow style
        svg.append("svg:defs").selectAll("marker")
            .data(["end"])
            .enter().append("svg:marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

    }



    render() {
        var dataAll = this.state.dataAll;

        //parse json structure in string
        var deep_value = function (obj, path) {
            for (var i = 0, path = path.split('.'), len = path.length; i < len; i++) {
                if (obj[path[i]]) obj = obj[path[i]];
                else obj = "";
            }
            if (obj) {
                return obj;
            }
            return "";
        };

        return (
            <div className="row no-gutters" >
                <div className="col-auto" style={{ "marginRight": "5px" }}>
                    <div style={{ "width": "100%", "marginTop": "0px" }} id="simpleSequenceDiagram"></div>
                </div>
                <div className="col" style={{ "marginRight": "5px", "marginTop": "20px" }}>
                    <span className="preStyle" >
                        {eventDetails.map(attr => (
                            deep_value(dataAll, attr) !== "" ?
                                <div><b>{attr}: </b><span className="rowSplit">{deep_value(dataAll, attr)}</span></div>
                                : ""
                        ))}
                    </span>
                </div>
            </div>)
    }
}

export default SimpleSequenceDiagram;
