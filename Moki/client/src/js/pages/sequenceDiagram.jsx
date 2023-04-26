import React, { Component } from 'react';
import * as d3 from "d3";
import { downloadPcap } from '../helpers/download/downloadPcap';
import { downloadPcapMerged } from '../helpers/download/downloadPcapMerged';
import { downloadSD } from '../helpers/download/downloadSD';
import querySrv from '../helpers/querySrv';
import { parseTimestamp } from "../helpers/parseTimestamp";

import downloadIcon from "/icons/download.png";
import downloadPcapIcon from "/icons/downloadPcap.png";


class SequenceDiagram extends Component {
  constructor(props) {
    super(props);
    this.load = this.load.bind(this);
    this.check = this.check.bind(this);
    this.state = {
      data: "",
      nodesNames: []
    }
  }

  componentWillMount() {
    this.load();
  }

  /*
     Load data
     */
  async load() {
    var thiss = this;
    var path = "/data/sbcsync/traffic_log/" + window.location.pathname.substring(17);

    if (window.location.search) {
      if (window.location.search === "?id=") {
        alert("To see merged PCAPs files, you need to select them first.");
      }
      var array = window.location.search.split(",");
      //remove ?id=
      array[0] = array[0].substring(4);
      path = array;
    }

    try {
      await querySrv("api/diagram", {
        method: "POST",
        credentials: 'include',
        body:
          JSON.stringify({
            url: path
          }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Credentials": "include"
        }
      })
        .then(function (response) {
          if (response.status !== 200) {
            return response.status
          }
          return response.text();
        })
        .then(function (res) {
          var xml = "";
          if (!res || isFinite(res) || res === "") {
            xml = res;

          }
          else {
            const parser = new DOMParser();
            xml = parser.parseFromString(res, 'text/xml');

            //get nodes names
            var nodes = xml.querySelectorAll('object');
            var nodesNames = [];
            for (var i = 0; i < nodes.length; i++) {
              nodesNames.push(nodes[i].getAttribute("name"));

            }

          }
          thiss.setState({
            data: xml,
            nodesNames: nodesNames
          });

        })

    } catch (error) {
      console.error(error);
      alert("Problem with receiving data. " + error);
    }

  }

  check(name) {
    var data = this.state.data;
    var checkbox = document.getElementById(name);
    if (checkbox.checked) {
      //find callr tags that should be rename to call
      var nodes = data.querySelectorAll('callr');
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].getAttribute("src") === name || nodes[i].getAttribute("dst") === name) {

          var newNode = document.createElement('call');
          newNode.innerHTML = nodes[i].innerHTML;
          newNode.setAttribute("src", nodes[i].getAttribute("src"));
          newNode.setAttribute("dst", nodes[i].getAttribute("dst"));
          newNode.setAttribute("desc", nodes[i].getAttribute("desc"));
          newNode.setAttribute("color", nodes[i].getAttribute("color"));
          nodes[i].parentNode.replaceChild(newNode, nodes[i]);
        }
      }

    }
    else {
      //change tag name from call to callr
      nodes = data.querySelectorAll('call');
      for (i = 0; i < nodes.length; i++) {
        if (nodes[i].getAttribute("src") === name || nodes[i].getAttribute("dst") === name) {

          newNode = document.createElement('callr');
          newNode.innerHTML = nodes[i].innerHTML;
          newNode.setAttribute("src", nodes[i].getAttribute("src"));
          newNode.setAttribute("dst", nodes[i].getAttribute("dst"));
          newNode.setAttribute("desc", nodes[i].getAttribute("desc"));
          newNode.setAttribute("color", nodes[i].getAttribute("color"));
          nodes[i].parentNode.replaceChild(newNode, nodes[i]);
        }
      }

    }
    this.setState({ data: data });
  }


  async getPcap(event) {
    if (window.location.search) {
      var array = window.location.search.split(",");
      //remove ?id=
      array[0] = array[0].substring(4);
      var filename = array;

      await downloadPcapMerged(filename).then(function (data) {
        if (typeof data === 'string') {
          alert(data);
        }
        else {
          var blob = new Blob([data], { type: "pcap" });
          const element = document.createElement("a");
          element.download = "merge-" + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10) + ".pcap";
          element.href = URL.createObjectURL(blob);
          document.body.appendChild(element);
          element.click();
        }
      })
    }
    else {
      filename = window.location.pathname.substring(17);
      await downloadPcap(filename).then(function (data) {

        if (typeof data === 'string') {
          alert(data);
        }
        else {
          var blob = new Blob([data], { type: "pcap" });
          const element = document.createElement("a");
          element.download = filename;
          element.href = URL.createObjectURL(blob);
          document.body.appendChild(element);
          element.click();
        }
      })
    }
  }


  async getDiagram(event) {
    if (window.location.search) {
      var array = window.location.search.split(",");
      //remove ?id=
      array[0] = array[0].substring(4);
      var filename = array;

      await downloadSD(filename).then(function (data) {
        if (data && (!data.includes("Error") || !data.includes("error"))) {
          var blob = new Blob([data], { type: "pcap" });
          const element = document.createElement("a");
          element.download = "merge-" + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10) + ".html";
          element.href = URL.createObjectURL(blob);
          document.body.appendChild(element);
          element.click();
        }
      })
    }
    else {
      filename = window.location.pathname.substring(17);
      await downloadSD(filename).then(function (data) {
        if (data && (!data.includes("Error") || !data.includes("error"))) {
          var blob = new Blob([data], { type: "html" });
          const element = document.createElement("a");
          element.download = filename + ".html";
          element.href = URL.createObjectURL(blob);
          document.body.appendChild(element);
          element.click();
        }
      })
    }
  }

  render() {

    var data = this.state.data;
    var classes = [];
    const renderDiagram = () => {
      if (!data || data === "") {
        return <div style={{
          "textAlign": "center",
          "margin": "auto", "marginTop": "10%", "marginLeft": "80px"
        }}><b>Trying to get pcap file...</b></div>
      }
      else if (isFinite(data)) {
        return <div style={{
          "textAlign": "center",
          "margin": "auto", "marginTop": "10%", "marginLeft": "80px"
        }}><b>Whoops</b><p>Pcap file not found. You can extend the storage time for pcaps in the settings.</p></div>
      } else {
        var margin = { top: 0, right: 20, bottom: 20, left: 0 };
        var width = 1200 - margin.left - margin.right;

        /*change data format

         id, time, src, dst, msg, color, details

        */
        var dataNew = [];
        var date = "";
        let previousTimestamp = 0;
        let actualTimestamp = 0;
        var calls = data.querySelectorAll('call');
        for (var i = 0; i < calls.length; i++) {
          let details = "";
          if(calls[i] && calls[i].innerHTML){
            details = calls[i].innerHTML;
          }
          for (var j = 2; j < calls[i].attributes.length; j++) {
            if (calls && calls[i] && calls[i].attributes[j] && calls[i].attributes[j].name === "timestamp" && calls[i].attributes[j] && calls[i].attributes[j].nodeValue) {
              date = calls[i].attributes[j].nodeValue;
              previousTimestamp = actualTimestamp;
              actualTimestamp = calls[i].attributes[j].nodeValue;
              if (i === 0) {
                previousTimestamp = calls[i].attributes[j].nodeValue;
              }
            }
          }

          if (i === 0) {
            date = parseTimestamp(parseFloat(date * 1000));
          }
          else {
            let diff = Math.round((actualTimestamp - previousTimestamp) * 1000);
            if (diff > 1000) {
              date = "+ " + Math.round(diff / 1000) + "s";
            }
            else {
              date = "+ " + diff + "ms";

            }
          }

          dataNew.push({
            id: i,
            time: date,
            src: calls[i].getAttribute("src"),
            dst: calls[i].getAttribute("dst"),
            msg: calls[i].getAttribute("desc"),
            color: calls[i].getAttribute("color"),
            details: details
          })
        }


        classes = this.state.nodesNames;
        var chart = document.getElementById("diagramSVG");
        if (chart) {
          chart.remove();
        }

        function syntaxHighlight(data) {
          var result = ["<div><b>" + data.msg + "</b></div>"];
          data = data.details;
          let split = data.split("\n");
          let secondPart = false;
          for (var j = 0; j < split.length; j++) {
            if (j !== 0) {
              if (split[j].length === 0) {
                secondPart = true;
                result = result + "<br/>";
              }

              if (!secondPart) {
                var nameIndex = split[j].indexOf(":");

                if (nameIndex !== -1) {
                  result = result + "<div><span className='key'><b>" + split[j].substring(0, nameIndex) + ": </b></span><span className='value'>" + split[j].substring(nameIndex + 1) + "<span></div>";
                }
                else {
                  result = result + "<div><span className='value'>" + split[j] + "<span></div>";
                }
              }
              if (secondPart) {
                if (split[j].includes("c=") || split[j].includes("m=")) {
                  result = result + "<div><span className='value' style='color:green'>" + split[j] + "<span></div>";
                }
                else {
                  result = result + "<div><span className='value'>" + split[j] + "<span></div>";
                }
              }
            }
          }
          return result;
        }

        var svg = d3.select('#diagram')
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('id', 'diagramSVG')
          .attr('transform', `translate(${margin.left}, ${margin.right})`);

        var XPAD = 100;
        var YPAD = 30;
        var VERT_SPACE = parseInt(width / classes.length);
        var VERT_PAD = 20;

        var MESSAGE_SPACE = 30;
        svg.attr("height", (dataNew.length + 2) * MESSAGE_SPACE + 20);

        var MESSAGE_LABEL_X_OFFSET = -40;
        var MESSAGE_LABEL_Y_OFFSET = 75;
        var MESSAGE_ARROW_Y_OFFSET = 80;

        var CLASS_WIDTH = VERT_SPACE - 10;

        // Draw vertical lines
        classes.forEach(function (c, i) {
          svg.append("line")
            .style("stroke", "#888")
            .style("stroke-dasharray", ("3, 3"))
            .attr("x1", XPAD + i * VERT_SPACE)
            .attr("y1", YPAD + 20)
            .attr("x2", XPAD + i * VERT_SPACE)
            .attr("y2", YPAD + VERT_PAD + dataNew.length * (MESSAGE_SPACE + 5));
        });

        // Draw classes
        classes.forEach(function (c, i) {
          var x = XPAD + i * VERT_SPACE;
          svg.append("g")
            .attr("transform", "translate(" + x + "," + YPAD + ")")
            .attr("class", "class-rect")
            .append("rect")
            .attr({ x: -CLASS_WIDTH / 2, y: 0, width: CLASS_WIDTH, height: "24px" });

        });

        // Draw class labels
        classes.forEach(function (c, i) {
          var x = XPAD + i * VERT_SPACE;
          svg.append("g")
            .attr("transform", "translate(" + x + "," + YPAD + ")")
            .append("text")
            .attr("class", "class-label")
            .attr("text-anchor", "middle")
            .text(function (d) { return c; })
            .attr("dy", "16px");
        });


        var curve = d3.line()
          .curve(d3.curveBasisClosed);

        // Draw message arrows
        dataNew.forEach(function (m, i) {
          if (m.src === m.dst) {
            var y = MESSAGE_ARROW_Y_OFFSET + (i) * MESSAGE_SPACE;
            var pathData = curve([[XPAD + classes.indexOf(m.src) * VERT_SPACE - 10, y - 20], [XPAD + classes.indexOf(m.src) * VERT_SPACE + 10, y + 45], [XPAD + classes.indexOf(m.src) * VERT_SPACE + 45, y + 10]]);
            svg.append("path")
              .attr("d", pathData)
              .attr("stroke", function (d) { return m.color; })
              .attr("fill", "transparent")
              .attr("marker-end", "url(#end" + m.id + ")");

          }
          else {
            y = MESSAGE_ARROW_Y_OFFSET + (i) * MESSAGE_SPACE;
            svg.append("line")
              .style("stroke", function (d) { return m.color; })
              .attr("x1", XPAD + classes.indexOf(m.src) * VERT_SPACE)
              .attr("y1", y)
              .attr("x2", XPAD + classes.indexOf(m.dst) * VERT_SPACE)
              .attr("y2", y)
              .attr("marker-end", "url(#end" + m.id + ")")
          }
        }
        );

        // Draw message timestamps
        dataNew.forEach(function (m, i) {
          var xPos = XPAD + MESSAGE_LABEL_X_OFFSET;
          var yPos = MESSAGE_LABEL_Y_OFFSET + i * MESSAGE_SPACE;

          svg.append("g")
            .attr("transform", "translate(" + xPos + "," + yPos + ")")
            .attr("class", "first")
            .attr("text-anchor", "middle")
            .append("text")
            .style("font-size", "10px")
            .text(function (d) {
              if (m.time.includes("+")) {
                return m.time;
              }
              else { return m.time; }
            });
        });

        // create tooltips for each record
        dataNew.forEach(function (m, i) {
          d3.select("#diagram").append("div")
            .attr("class", "tooltipDiagram tooltiptextCSS")
            .attr("id", "tooltip" + i)
            .style("display", "none")
            .style("opacity", 0);

          dragElement(document.getElementById("tooltip" + i));
        })

        /*   function hideTooltip(){
             document.getElementById('tooltip"+i+"').style.display='none';
           }
          */
        // Draw message labels
        dataNew.forEach(function (m, i) {
          var xPos = XPAD + MESSAGE_LABEL_X_OFFSET + (((classes.indexOf(m.dst) - classes.indexOf(m.src)) * VERT_SPACE) / 2) + (classes.indexOf(m.src) * VERT_SPACE);
          var yPos = MESSAGE_LABEL_Y_OFFSET + i * MESSAGE_SPACE;
          svg.append("g")
            .attr("transform", "translate(" + xPos + "," + yPos + ")")
            .append("text")
            .attr("class", "tooltipCSS")
            .attr("dx", "5px")
            .attr("dy", "-2px")
            .attr("text-anchor", "begin")
            .style("cursor", "grab")
            .style("font-size", "10px")
            .text(function (d) { return m.msg; })
            /*   .on("mouseover", function(d) {
                  d3.select("#tooltip"+i).transition()
                       .duration(200)
                       .style("opacity", 1)
                   .style("display", "inline-block");
                   d3.select("#tooltip"+i).html("<div class='tooltipDiagramHeader'>"+m.msg+"<span style='cursor: default; float: right;' onclick=getElementById('tooltip"+i+"').style.display='none'>X</span></div><div class='tooltipDiagramBody'>"+syntaxHighlight(m)+"</div>")
                       .style("left", (d3.event.pageX-120) + "px")
                       .style("top", (d3.event.pageY +20) + "px");
                   })
               .on("mouseout", function(d) {
                   if(d3.select("#tooltip"+i)._groups[0][0].getAttribute('clicked') !== "true"){
                       d3.select("#tooltip"+i).transition()
                       .duration(500)
                           .style("display", "none")
                       .style("opacity", 0);
                   }
               })*/
            .on("click", function (event, d) {
              //set z-index to front when you click on popup
              var allTooltips = document.getElementsByClassName("tooltipDiagram");
              for (var j = 0; j < allTooltips.length; j++) {
                allTooltips[j].style['z-index'] = 10;
              }

              d3.select("#tooltip" + i).transition()
                .duration(200)
                .style("display", "inline-block")
                .attr("clicked", "true")
                .style("z-index", 20)
                .style("opacity", 1);


              let e = window.event;
              let mouseOffsetY = 0;
              let elTop = e.clientY - mouseOffsetY;
              let maxY = document.documentElement.scrollHeight;

              if (maxY - elTop < 150) elTop = maxY - 200;

              d3.select("#tooltip" + i).html("<div class='tooltipDiagramHeader'><span style='cursor: default; margin-right: 10px; margin-left: 3px; font-size: 12px; color: black;' onclick=getElementById('tooltip" + i + "').style.display='none'>X</span>" + m.msg + "</div><div class='tooltipDiagramBody'>" + syntaxHighlight(m) + "</div>")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (elTop) + "px");
            })

        });
        //getElementById('tooltip"+i+"').setAttribute('clicked', 'false')
        // Arrow style
        svg.append("svg:defs").selectAll(".arrows")
          .data(dataNew)
          .enter()
          .append("svg:marker")
          .attr("id", function (d) { return "end" + d.id })
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 10)
          .attr("refY", 0)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
          .style("fill", function (d) { return d.color })
          .append("svg:path")
          .attr("d", "M0,-5L10,0L0,5");


        function dragElement(elmnt) {
          var mouseOffsetX = 0;
          var mouseOffsetY = 0;

          if (document.getElementById(elmnt.id + "Header")) {
            // if present, the header is where you move the DIV from:
            document.getElementById(elmnt.id + "Header").onmousedown = dragMouseDown;
          } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            elmnt.onmousedown = dragMouseDown;
          }

          function dragMouseDown(e) {
            var path = e.path || (e.composedPath && e.composedPath());
            if (path && path[0].getAttribute("class") === "tooltipDiagramHeader") {

              e = e || window.event;
              e.preventDefault();

              var elRect = elmnt.getBoundingClientRect();

              // get the mouse cursor offset to the element at startup:
              mouseOffsetX = e.clientX - elRect.x;
              mouseOffsetY = e.clientY - elRect.y;

              document.onmouseup = closeDragElement;
              // call a function whenever the cursor moves:
              document.onmousemove = elementDrag;
            }

            //set z-index to front when you click on popup
            var allTooltips = document.getElementsByClassName("tooltipDiagram");
            for (var j = 0; j < allTooltips.length; j++) {
              allTooltips[j].style['z-index'] = 10;
            }
            path[0].parentElement.style['z-index'] = 20;


            function elementDrag(e) {
              e = e || window.event;
              e.preventDefault();

              // calculate the new element position:
              var elTop = e.clientY - mouseOffsetY;
              var elLeft = e.clientX - mouseOffsetX;

              /* //if you want to move window only to visible area, allow this code
              var elRect = elmnt.getBoundingClientRect();
              var maxX = document.documentElement.scrollWidth;
              var maxY = document.documentElement.scrollHeight;

              if (elTop < 0) elTop = 0;
              if (elLeft < 0) elLeft = 0;

              if ((elTop + elRect.height) > maxY) elTop  = maxY - elRect.height;
              if ((elLeft + elRect.width) > maxX) elLeft = maxX - elRect.width;
              */

              // set the element's new position:
              elmnt.style.top = elTop + "px";
              elmnt.style.left = elLeft + "px";
            }
          }

          function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
          }
        }

        return <span></span>
      }
    }

    var nodeNames = this.state.nodesNames;
    return <span style={{ "width": "100%", "marginLeft": "30px", "marginTop": "20px" }}>
      <span>
        {nodeNames && <button className="noFormatButton" key="downloadPCAP" onClick={this.getPcap}> <img className="icon" alt="downloadIcon" src={downloadPcapIcon} title="download PCAP" /></button>}
        {nodeNames && <button className="noFormatButton" key="downloadSD" onClick={this.getDiagram}> <img className="icon" alt="downloadIcon" src={downloadIcon} title="download chart" /></button>}
        {nodeNames && nodeNames.map(name => <span style={{ "marginLeft": "5px" }} key={name}><input type="checkbox" defaultChecked="true" id={name} onClick={() => this.check(name)} style={{ "verticalAlign": "middle" }}></input><label style={{ "marginLeft": "5px", "verticalAlign": "middle" }}>{name}</label></span>)}
      </span>
      <div style={{ "width": "100%", "marginTop": "0px" }} id="diagram">{renderDiagram()}</div>
    </span>
  }
}
export default SequenceDiagram;
