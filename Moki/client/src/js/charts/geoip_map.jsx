import { useEffect, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import map from "./world_map.json";
import cities from "./cities_11.csv";
import Animation from "../helpers/Animation";
import { showTooltip } from "../helpers/tooltip";
import geohash from "ngeohash";
import { createFilter, decryptGeoData, getGeoData } from "../../gui";

import store from "@/js/store";

import emptyIcon from "/icons/empty_small.png";

export default function GeoIpMap(props) {
  const [animation, setAnimation] = useState(false);
  const [currentData, setCurrentData] = useState(props.data);

  useEffect(() => {
    if (!props.data) return;
    draw(props.data, props.dataNotShown, animation);
  }, [props.data, props.width]);

  const setData = (newData, activeAnimation = true) => {
    if (!newData) return;
    setCurrentData(newData);
    setAnimation(activeAnimation);
    draw(newData, props.dataNotShown, activeAnimation);
  };

  const updateAnimation = (activeAnimation) => {
    setAnimation(activeAnimation);
    draw(currentData, props.dataNotShown, activeAnimation);
  };

  const draw = async (data, dataNotShown, activeAnimation) => {

    const { user, profile } = store.getState().persistent;

    if (user.aws && profile[0] && profile[0].userprefs) {
      if (profile[0].userprefs.mode === "encrypt") {
        var geoData = await getGeoData(window.location.pathname.substring(1));
        if (
          geoData && geoData.responses[0].aggregations.agg.buckets.length > 0
        ) {
          data = await decryptGeoData(
            geoData.responses[0].aggregations.agg.buckets,
          );
          dataNotShown = data[1];
          data = data[0];
        }
      }
    }

    const width = props.width < 0 ? 1028 : props.width;
    const units = props.units ? " (" + props.units + ")" : "";
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

    var height = 400;

    //var color= ["#61BEE2",  "#53B6DC", "#408CA9", "#30697F", "#3F555D"];
    // var  colorScale =d3.scaleLinear().range(["white", "blue"]);

    if (data.length === 0 && dataNotShown.length === 0) {
      chart = document.getElementById("geoIpMapSVG");
      if (chart) {
        chart.remove();
      }

      var svg = d3.select("#geoIpMap")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "geoIpMapSVGempty");
      svg.append("svg:image")
        .attr("xlink:href", emptyIcon)
        .attr("id", "emptyIconChart")
        .attr("class", "noData")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    } else {
      var isEmpty = document.getElementsByClassName("country");
      //chart is empty / first run
      if (isEmpty.length === 0) {
        svg = d3.select("#geoIpMap")
          .append("svg")
          .attr("id", "geoIpMapSVG")
          .attr("width", width)
          .attr("height", height);

        var g = svg.append("g").attr(
          "transform",
          "translate(" + width / 8 + ",0)",
        ).attr("id", "svgG");
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

        // zoom and pan
        const zoom = d3.zoom()
          .scaleExtent([1, 20])
          .extent([[0, 0], [width, height]])
          .on("zoom", (event) => {
            if (!activeAnimation) {
              g.style("stroke-width", `${1.5 / event.transform.k}px`);
              g.attr("transform", event.transform);

              //data values
              d3.selectAll("circle.pins").attr("r", function (d) {
                if (d.doc_count) {
                  return rScale(d.doc_count) / event.transform.k;
                } else {
                  return 2 / event.transform.k;
                }
              });

              //cities
              d3.selectAll("circle.city").attr("r", function (d) {
                if (d.doc_count) {
                  if (rScale(d.doc_count) / event.transform.k > 2) {
                    return 2;
                  } else {
                    return rScale(d.doc_count) / event.transform.k;
                  }
                } else {
                  return 2 / event.transform.k;
                }
              });

              //display names
              if (event.transform.k >= 4 && first) {
                first = false;
                g.selectAll(".city_label")
                  .data(cities)
                  .enter()
                  .append("text")
                  .attr("class", "city_label")
                  .text(function (d) {
                    return d.city_ascii;
                  })
                  .style("font-size", "2px")
                  .attr("transform", function (d) {
                    if (d.lng && d.lat) {
                      return "translate(" + projection([
                        d.lng,
                        d.lat,
                      ]) + ")";
                    }
                  });
              }
              //zooming out
              if (event.transform.k < 4 && !first) {
                first = true;
                g.selectAll(".city_label").remove();
              }
            }
          });

        svg.call(zoom);

        var countries = topojson.feature(map, map.objects.countries).features;
        g.selectAll("path")
          .data(countries)
          .enter().append("path")
          .attr("class", "country")
          .attr("d", path)
          .attr("fill", "#343a40");

        if (!activeAnimation) {
          var tooltip = d3.select("#geoIpMap").append("div")
            .attr("id", "tooltipgeoIpMap")
            .attr("class", "tooltip");

          tooltip.append("div");
        }

        //cites
        var cit = g.selectAll("city")
          .data(cities)
          .enter()
          .append("circle")
          .attr("r", 2)
          .attr("fill", "#121416")
          .attr("class", "city")
          .attr("transform", function (d) {
            if (d.lng && d.lat) {
              return "translate(" + projection([
                d.lng,
                d.lat,
              ]) + ")";
            }
          });

        if (!activeAnimation) {
          cit.on("mouseover", function (event, d) {
            tooltip.select("div").html(d.city_ascii);
            showTooltip(event, tooltip);
          })
            .on("mouseout", function () {
              tooltip.style("visibility", "hidden");
            })
            .on("mousemove", function (event) {
              showTooltip(event, tooltip);
            });
        }
        drawOnlyPins(data, props.name, dataNotShown, activeAnimation);
      } //rerender only pins
      else {
        drawOnlyPins(data, props.name, dataNotShown, activeAnimation);
      }
    }
  };

  //draw only data
  const drawOnlyPins = (data, name, dataNotShown, activeAnimation) => {
    console.log(data);
    const projection = d3.geoMercator();

    if (!activeAnimation) {
      var tooltip = d3.select("#geoIpMap").append("div")
        .attr("id", "tooltipgeoIpMap")
        .attr("class", "tooltip");

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

    var g = d3.select("#svgG");
    var svg = d3.select("#geoIpMap");
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
          if (
            d.centroid && d.centroid.location && d.centroid.location.lon &&
            d.centroid.location.lat
          ) {
            return "translate(" + projection([
              d.centroid.location.lon,
              d.centroid.location.lat,
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
        if (
          d.centroid && d.centroid.location && d.centroid.location.lon &&
          d.centroid.location.lat
        ) {
          return "translate(" + projection([
            d.centroid.location.lon,
            d.centroid.location.lat,
          ]) + ")";
        }
        return "translate(-10,-10)";
      });
    if (!activeAnimation) {
      pin.on("mouseover", function (event, d) {
        var types;
        if (d.aggs && d.aggs.buckets) {
          types = d.aggs.buckets.map((type) =>
            " <br/><strong>" + type.key + ": </strong> " + type.doc_count
          );
          types = "<strong>City: </strong>" + d.key + " <br/>" + types;
        } else {
          types = " <strong>" + d.key + ": </strong> " + d.doc_count;
        }

        d3.select(this).style("cursor", "pointer");
        tooltip.select("div").html(types);

        showTooltip(event, tooltip);
      })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
        })
        .on("mousemove", function (event) {
          showTooltip(event, tooltip);
        })
        .on("click", (_event, d) => {
          const { user, profile } = store.getState().persistent;
          if (
            user.aws && profile[0] && profile[0].userprefs &&
            profile[0].userprefs.mode === "encrypt"
          ) {
            createFilter("geoip.src.city_id:" + d.id);
          } else {
            createFilter("geoip.city_name:" + d.key);
          }

          //bug fix: if you click but not move out
          tooltip.style("visibility", "hidden");
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
          if (
            d.centroid && d.centroid.location && d.centroid.location.lon &&
            d.centroid.location.lat
          ) {
            return "translate(" + projection([
              d.centroid.location.lon,
              d.centroid.location.lat,
            ]) + ")";
          } else if (d.key && geohash.decode(d.key)) {
            return "translate(" + projection([
              geohash.decode(d.key).longitude,
              geohash.decode(d.key).latitude,
            ]) + ")";
          }
          return "translate(-10,-10)";
        });
      if (!activeAnimation) {
        pin.on("mouseover", function (event, d) {
          if (d.types && d.types.buckets) {
            var types = d.types.buckets.map((type) =>
              "<br/><strong>" + type.key + ": </strong> " + type.doc_count
            );
          } else {
            types = " <strong>" + d.country + ": </strong> " + d.doc_count;
          }

          d3.select(this).style("cursor", "pointer");
          tooltip.select("div").html(
            "<strong>AVG longitude: </strong>" +
              geohash.decode(d.key).longitude +
              " <br/><strong>AVG latitude: </strong>" +
              geohash.decode(d.key).latitude + " <br/>" + types,
          );

          showTooltip(event, tooltip);
        })
          .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
          })
          .on("mousemove", function (event) {
            showTooltip(event, tooltip);
          });
      }
    }

    function transition() {
      var i = 0;
      // Grow circles
      pins
        .transition()
        .ease(d3.easeLinear)
        .attr("r", function (d) {
          if (d.doc_count) return rScale(d.doc_count) + 5;
        })
        .style("opacity", function (d) {
          return d === 60 ? 0 : 1;
        })
        .duration(1000)
        .on("end", function () {
          if (++i === pins.size() - 1) transition();
        });

      // Reset circles where r == 0
      pins
        .attr("r", 0)
        .style("opacity", 1);
    }

    if (data.length < 50) {
      transition();
    }
  };

  return (
    <div id="geoIpMap" className="chart">
      <h3 className="alignLeft title">{props.name}</h3>
      <Animation
        display={props.displayAnimation}
        setAnimation={updateAnimation}
        name={props.name}
        type={props.type}
        setData={setData}
        dataAll={props.data}
        autoplay={props.autoplay}
      />
    </div>
  );
}
