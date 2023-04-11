import React, {
    Component
} from 'react';
import * as d3 from "d3";
import * as topojson from "topojson-client";
import map from "./world_map.json";
import { createFilter } from '@moki-client/gui';
import cities from "./cities_11.csv";
import emptyIcon from "../../styles/icons/empty_small.png";
import Animation from '../helpers/Animation';
import storePersistent from "../store/indexPersistent";
import { getGeoData, decryptGeoData } from '@moki-client/gui';
import { showTooltip } from '../helpers/tooltip';
var geohash = require('ngeohash');

export default class geoIpMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            svg: "",
            g: "",
            dataNotShown: [],
            animation: false
        }
        this.setData = this.setData.bind(this);
        this.setAnimation = this.setAnimation.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.data !== prevState.data) {
            return { data: nextProps.data };
        }
        if (nextProps.dataNotShown !== prevState.dataNotShown) {
            return { dataNotShown: nextProps.dataNotShown };
        }
        else return null;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.data !== this.props.data) {
            this.setState({ data: this.props.data });
            this.draw(this.props.data, this.props.width, this.props.units, this.props.name, this.props.dataNotShown);
        }
        else if (prevProps.dataNotShown !== this.props.dataNotShown) {
            this.setState({ dataNotShown: this.props.dataNotShown });
            this.draw(this.props.data, this.props.width, this.props.units, this.props.name, this.props.dataNotShown);
        }
    }

    setData(data, animation = true) {
        if (data) {
            this.setState({
                data: data,
                animation: animation
            });
            this.draw(data, this.props.width, this.props.units, this.props.name);
        }
    }

    setAnimation(animation) {
        this.setState({
            animation: animation
        });
        this.draw(this.state.data, this.props.width, this.props.units, this.props.name);
    }

    async draw(data, width, units, name, dataNotShown = this.state.dataNotShown) {
        if (data.length === 0) {
            dataNotShown = [];
        }
        if (storePersistent.getState().user.aws && storePersistent.getState().profile[0] && storePersistent.getState().profile[0].userprefs) {
            if (storePersistent.getState().profile[0].userprefs.mode === "encrypt") {
                var geoData = await getGeoData(window.location.pathname.substring(1));
                if (geoData && geoData.responses[0].aggregations.agg.buckets.length > 0) {
                    data = await decryptGeoData(geoData.responses[0].aggregations.agg.buckets);
                    dataNotShown = data[1];
                    data = data[0];
                }
            }
        }

        width = width < 0 ? 1028 : width;
        units = units ? " (" + units + ")" : "";
        //FOR UPDATE: remove chart if it's already there
        var chart = document.getElementById("geoIpMapSVGempty");
        if (chart) {
            chart.remove();
            var tooltips = document.getElementById("tooltipgeoIpMap");
            if (tooltips) {
                tooltips.remove();
            }
        }

        //remove old pins if exists
        var pins = document.getElementsByClassName("pins");
        if (pins.length > 0) {
            if (pins) {
                while (pins.length > 0) {
                    pins[0].parentNode.removeChild(pins[0]);
                }
            }
        }
        pins = document.getElementsByClassName("pinsPulse");
        if (pins.length > 0) {
            if (pins) {
                while (pins.length > 0) {
                    pins[0].parentNode.removeChild(pins[0]);
                }
            }
        }
        // var margin = { top: 20, right: 10, bottom: 150, left: 60 };

        var height = 400;

        //var color= ["#61BEE2",  "#53B6DC", "#408CA9", "#30697F", "#3F555D"];
        // var  colorScale =d3.scaleLinear().range(["white", "blue"]);

        if (data.length === 0 && dataNotShown.length === 0) {
            chart = document.getElementById("geoIpMapSVG");
            if (chart) {
                chart.remove();
            }

            var svg = d3.select('#geoIpMap')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('id', 'geoIpMapSVGempty');
            svg.append('svg:image')
                .attr("xlink:href", emptyIcon)
                .attr("id", "emptyIconChart")
                .attr("class", "noData")
                .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
        } else {

            var isEmpty = document.getElementsByClassName("country");
            //chart is empty /first run
            if (isEmpty.length === 0) {
                svg = d3.select('#geoIpMap')
                    .append('svg')
                    .attr("id", "geoIpMapSVG")
                    .attr('width', width)
                    .attr('height', height);

                var g = svg.append("g").attr('transform', 'translate(' + width / 8 + ',0)').attr("id", "svgG");
                var projection = d3.geoMercator();
                var path = d3.geoPath().projection(projection);
                var rScale = d3.scaleSqrt();
                var first = true;

                //get max value
                var maxValue = 0;
                var minValue = data.length > 0 ? data[0].doc_count : 0;
                for (var i = 0; i < data.length; i++) {
                    if (maxValue < data[i].doc_count) {
                        maxValue = data[i].doc_count;
                    }
                    if (minValue > data[i].doc_count) {
                        minValue = data[i].doc_count;
                    }
                }

                //check also dataNotShown max and min value
                for (i = 0; i < dataNotShown.length; i++) {
                    if (maxValue < dataNotShown[i].doc_count) {
                        maxValue = dataNotShown[i].doc_count;
                    }
                    if (minValue > dataNotShown[i].doc_count) {
                        minValue = dataNotShown[i].doc_count;
                    }
                }

                rScale.domain([minValue - 1, maxValue + 1]).range([3, 10]);
                var thiss = this;
                // zoom and pan


                const zoom = d3.zoom()
                    .scaleExtent([1, 20])
                    .extent([[0, 0], [width, height]])
                    .on('zoom', () => {
                        if (!this.state.animation) {
                            g.style('stroke-width', `${1.5 / d3.event.transform.k}px`);
                            g.attr('transform', d3.event.transform);

                            // draw the circles in their new positions
                            /* d3.selectAll("circle").attr("r", d => d.doc_count ?
                                 rScale(d.doc_count) / d3.event.transform.k : 2 / d3.event.transform.k
                             );
         */
                            //data values
                            d3.selectAll("circle.pins").attr("r", function (d) {
                                if (d.doc_count) {
                                    return rScale(d.doc_count) / d3.event.transform.k;
                                } else {
                                    return 2 / d3.event.transform.k;
                                }
                            })

                            //cities
                            d3.selectAll("circle.city").attr("r", function (d) {
                                if (d.doc_count) {
                                    if (rScale(d.doc_count) / d3.event.transform.k > 2) {
                                        return 2;
                                    }
                                    else {
                                        return rScale(d.doc_count) / d3.event.transform.k;
                                    }
                                } else {
                                    return 2 / d3.event.transform.k;
                                }
                            })

                            //display names
                            if (d3.event.transform.k >= 4 && first) {
                                first = false;
                                d3.csv(cities).then(function (city) {
                                    g.selectAll(".city_label")
                                        .data(city)
                                        .enter()
                                        .append("text")
                                        .attr("class", "city_label")
                                        .text(function (d) {
                                            return d.city_ascii
                                        })
                                        .style("font-size", "2px")
                                        .attr("transform", function (d) {
                                            if (d.lng && d.lat) {
                                                return "translate(" + projection([
                                                    d.lng,
                                                    d.lat
                                                ]) + ")";
                                            }
                                        })
                                }
                                )
                            }
                            //zooming out
                            if (d3.event.transform.k < 4 && !first) {
                                first = true;
                                g.selectAll(".city_label").remove();
                            }
                        }
                    })

                svg.call(zoom);


                var countries = topojson.feature(map, map.objects.countries).features;
                g.selectAll("path")
                    .data(countries)
                    .enter().append("path")
                    .attr("class", "country")
                    .attr("d", path)
                    .attr("fill", "#343a40");

                if (!this.state.animation) {
                    var tooltip = d3.select('#geoIpMap').append('div')
                        .attr('id', 'tooltipgeoIpMap')
                        .attr("class", "tooltipCharts");

                    tooltip.append("div");
                }


                //cites
                d3.csv(cities).then(function (city) {
                    var cit = g.selectAll("city")
                        .data(city)
                        .enter()
                        .append("circle")
                        .attr("r", 2)
                        .attr("fill", "#121416")
                        .attr("class", "city")
                        .attr("transform", function (d) {
                            if (d.lng && d.lat) {
                                return "translate(" + projection([
                                    d.lng,
                                    d.lat
                                ]) + ")";
                            }
                        });

                    if (!thiss.state.animation) {
                        cit.on("mouseover", function (d) {
                            tooltip.select("div").html(d.city_ascii);
                            showTooltip(tooltip)
                        })
                            .on("mouseout", function (d) {
                                tooltip.style("visibility", "hidden")
                            })
                            .on("mousemove", function (d) {
                                showTooltip(tooltip)
                            });
                    }
                    thiss.drawOnlyPins(g, name, data, dataNotShown, units, svg)
                    thiss.setState({
                        g: g,
                        svg: svg
                    });
                });
            }
            //rerender only pins
            else {
                this.drawOnlyPins(this.state.g, name, data, dataNotShown, units, this.state.svg)
            }
        }
    }


    //draw only data
    drawOnlyPins(g, name, data, dataNotShown, units, svg) {
        var projection = d3.geoMercator();

        if (!this.state.animation) {
            var tooltip = d3.select('#geoIpMap').append('div')
                .attr('id', 'tooltipgeoIpMap')
                .attr("class", "tooltipCharts");

            tooltip.append("div");
        }

        var rScale = d3.scaleSqrt();

        //get max value
        var maxValue = 0;
        var minValue = data.length > 0 ? data[0].doc_count : 0;
        for (var i = 0; i < data.length; i++) {
            if (maxValue < data[i].doc_count) {
                maxValue = data[i].doc_count;
            }
            if (minValue > data[i].doc_count) {
                minValue = data[i].doc_count;
            }
        }

        //check also dataNotShown max and min value
        for (i = 0; i < dataNotShown.length; i++) {
            if (maxValue < dataNotShown[i].doc_count) {
                maxValue = dataNotShown[i].doc_count;
            }
            if (minValue > dataNotShown[i].doc_count) {
                minValue = dataNotShown[i].doc_count;
            }
        }

        rScale.domain([minValue - 1, maxValue + 1]).range([3, 10]);
        //remove old pins if exists
        var pins = document.getElementsByClassName("pins");
        if (pins.length > 0) {
            if (pins) {
                while (pins.length > 0) {
                    pins[0].parentNode.removeChild(pins[0]);
                }
            }
        }

        var pinsPulse = document.getElementsByClassName("pinsPulse");
        if (pinsPulse) {
            while (pinsPulse.length > 0) {
                pinsPulse[0].parentNode.removeChild(pinsPulse[0]);
            }
        }


        g = d3.select('#svgG');
        svg = d3.select('#geoIpMap');
        var color = name === "REGISTRATIONS MAP" ? "#caa547" : "#c41d03";

        if (data.length < 50) {
            pins = g.selectAll(".pin")
                .data(data)
                .enter().append("circle")
                .attr("r", function (d) {
                    if (rScale(d.doc_count) < 2) return 2;
                    return rScale(d.doc_count);
                })
                .attr("fill", "transparent")
                .attr("class", "pinsPulse")
                .style("stroke", color)
                .attr("transform", function (d) {
                    if (d.centroid && d.centroid.location && d.centroid.location.lon && d.centroid.location.lat) {
                        return "translate(" + projection([
                            d.centroid.location.lon,
                            d.centroid.location.lat
                        ]) + ")";
                    }
                    return "translate(-10,-10)";
                });

        }

        var pin = g.selectAll(".pin")
            .data(data)
            .enter().append("circle")
            .attr("r", function (d) {
                return rScale(d.doc_count) < 2 ? 2 : rScale(d.doc_count);
            })
            .attr("fill", color)
            .attr("class", "pins")
            .attr("transform", function (d) {
                if (d.centroid && d.centroid.location && d.centroid.location.lon && d.centroid.location.lat) {
                    return "translate(" + projection([
                        d.centroid.location.lon,
                        d.centroid.location.lat
                    ]) + ")";
                }
                return "translate(-10,-10)";
            });
        if (!this.state.animation) {
            pin.on("mouseover", function (d) {
                var types;
                if (d.aggs && d.aggs.buckets) {
                    types = d.aggs.buckets.map(type =>
                        " <br/><strong>" + type.key + ": </strong> " + type.doc_count
                    );
                    types = "<strong>City: </strong>" + d.key + " <br/>" + types;
                }
                else {
                    types = " <strong>" + d.key + ": </strong> " + d.doc_count;
                }

                d3.select(this).style("cursor", "pointer");
                tooltip.select("div").html(types);

                showTooltip(tooltip)
            })
                .on("mouseout", function (d) {

                    tooltip.style("visibility", "hidden")

                })
                .on("mousemove", function (d) {
                    showTooltip(tooltip)
                    //position tooltip based on count of cities
                    // if (d.aggs && d.aggs.buckets) {
                    //     tooltip
                    //         .style("left", (d3.event.layerX - 20) + "px")
                    //         .style("top", (d3.event.layerY - (d.aggs.buckets.length * 20) - 100) + "px");
                    // }
                    // else {
                    //     tooltip
                    //         .style("left", (d3.event.layerX - 20) + "px")
                    //         .style("top", (d3.event.layerY - 100) + "px");
                    // }
                })
                .on("click", el => {
                    if (storePersistent.getState().user.aws && storePersistent.getState().profile[0] && storePersistent.getState().profile[0].userprefs && storePersistent.getState().profile[0].userprefs.mode === "encrypt") {
                        createFilter("geoip.src.city_id:" + el.id);
                    }
                    else {
                        createFilter("geoip.city_name:" + el.key);
                    }

                    //bug fix: if you click but not move out
                    tooltip.style("visibility", "hidden")
                });
        }

        //draw missing part of data
        if (dataNotShown.length > 0) {
            pin = g.selectAll(".pin")
                .data(dataNotShown)
                .enter().append("circle")
                .attr("r", function (d) {
                    return rScale(d.doc_count) < 2 ? 2 : rScale(d.doc_count);
                })
                .attr("fill", "#AA59E0")
                .attr("class", "pins")
                .attr("z-index", 5)
                .attr("fill-opacity", 0.5)
                .attr("transform", function (d) {

                    if (d.centroid && d.centroid.location && d.centroid.location.lon && d.centroid.location.lat) {
                        return "translate(" + projection([
                            d.centroid.location.lon,
                            d.centroid.location.lat
                        ]) + ")";
                    }
                    else if (d.key && geohash.decode(d.key)) {
                        return "translate(" + projection([
                            geohash.decode(d.key).longitude,
                            geohash.decode(d.key).latitude
                        ]) + ")";
                    }
                    return "translate(-10,-10)";
                });
            if (!this.state.animation) {
                pin.on("mouseover", function (d) {
                    if (d.types && d.types.buckets) {
                        var types = d.types.buckets.map(type =>
                            "<br/><strong>" + type.key + ": </strong> " + type.doc_count
                        );
                    }
                    else {
                        types = " <strong>" + d.country + ": </strong> " + d.doc_count;
                    }

                    d3.select(this).style("cursor", "pointer");
                    tooltip.select("div").html("<strong>AVG longitude: </strong>" + geohash.decode(d.key).longitude + " <br/><strong>AVG latitude: </strong>" + geohash.decode(d.key).latitude + " <br/>" + types);

                    showTooltip(tooltip)
                })
                    .on("mouseout", function (d) {
                        tooltip.style("visibility", "hidden")
                    })
                    .on("mousemove", function (d) {
                        showTooltip(tooltip)
                        //position tooltip based on count of cities
                        // if (d.aggs && d.aggs.buckets) {
                        //     tooltip
                        //         .style("left", (d3.event.layerX - 20) + "px")
                        //         .style("top", (d3.event.layerY - (d.aggs.buckets.length * 20) - 100) + "px");
                        // }
                        // else if (d.types && d.types.buckets) {
                        //     tooltip
                        //         .style("left", (d3.event.layerX - 20) + "px")
                        //         .style("top", (d3.event.layerY - (d.types.buckets.length * 20) - 100) + "px");
                        // }
                        // else {
                        //     tooltip
                        //         .style("left", (d3.event.layerX - 20) + "px")
                        //         .style("top", (d3.event.layerY - 100) + "px");
                        // }
                    })
            }
        }



        function transition() {
            var i = 0;
            // Grow circles
            pins
                .transition()
                .ease(d3.easeLinear)
                .attr("r", function (d) { if (d.doc_count) { return rScale(d.doc_count) + 5 } })
                .style("opacity", function (d) { return d === 60 ? 0 : 1 })
                .duration(1000)
                .on("end", function () { if (++i === pins.size() - 1) { transition(); } });

            // Reset circles where r == 0
            pins
                .attr("r", 0)
                .style("opacity", 1);
        }

        if (data.length < 50) {
            transition();
        }
    }

    render() {
        return (<div id="geoIpMap" className="chart"> <h3 className="alignLeft title" > {
            this.props.name
        } </h3>
            <Animation display={this.props.displayAnimation} setAnimation={this.setAnimation} name={this.props.name} type={this.props.type} setData={this.setData} dataAll={this.state.data} autoplay={this.props.autoplay} /></div >)
    }
}
