/*
Class for chart animation. Get special format with time data from ES, parse it and display it in animation.
Play, pause and stop function.
30s long animation
*/
import { useEffect, useState } from "react";
import { elasticsearchConnection } from "../../gui";
import {
  parseDateHeatmapAnimation,
  parseDateHeatmapDocCountAnimation,
  parseDistinctDataAnimation,
  parseGeoipAnimation,
  parseHistogramDataAnimation,
  parseListDataAnimation,
  parseQueryStringDataAnimation,
  parseTopologyDataAnimation,
  parseTwoAggAnimation,
} from "../../es-response-parser";

import { setTimerange } from "@/js/slices";
import { useDispatch, useSelector } from "react-redux";

import playIcon from "/icons/play.png";
import pauseIcon from "/icons/stop.png";
import historyIcon from "/icons/reload_time_grey.png";

function Animation(props) {
  const [data, setData] = useState([]);
  const [animationTime, setAnimationTime] = useState("");
  const [count, setCount] = useState(-1);
  const [icon, setIcon] = useState(playIcon);
  const [dataAll, setDataAll] = useState("");
  const [animation, setAnimation] = useState("");

  const timerange = useSelector((state) => state.filter.timerange);
  const dispatch = useDispatch();

  /*
    if timerange is changed hide animation
  */
  useEffect(() => {
    setData([]);
    setAnimationTime("");
    setCount(-1);
  }, [timerange]);

  if (window.location.pathname === "/web") {
    if (
      props.dataAll !== dataAll &&
      (dataAll === "" || dataAll === 0 ||
        dataAll === undefined || dataAll.length === 0)
    ) {
      setDataAll(props.dataAll);
    }
  } else {
    if (
      props.dataAll !== dataAll &&
      (dataAll === "" || dataAll === undefined)
    ) {
      setDataAll(props.dataAll);
    }
  }

  useEffect(() => {
    if (props.autoplay) {
      document.getElementById(props.name).click();
    }
  }, []);

  /*
    get data with timestamps
  */
  const loadData = async () => {
    //first run load data, else just play animation
    if (count === -1) {
      //replace space for underscore and lower case
      var name = props.name.replace(/ /g, "_").toLowerCase();
      var dashboard = window.location.pathname.substring(1);

      //check of path name end with "/", if so remove it
      if (dashboard.substring(dashboard.length - 1) === "/") {
        dashboard = dashboard.substring(0, dashboard.length - 1);
      }
      //get format is "dashboardName/chartName"
      let data = await elasticsearchConnection(dashboard + "/" + name);
      if (typeof data === "string" && data.includes("ERROR:")) {
        alert("Problem with getting data: " + data);
        return;
      } else if (data) {
        //get the right data format and parse it
        if (props.type === "4agg") {
          data = parseDateHeatmapAnimation(data.responses[0]);
        } else if (props.type === "2agg") {
          data = parseTwoAggAnimation(data.responses[0]);
        } else if (props.type === "geoip") {
          data = parseGeoipAnimation(data.responses[0]);
        } else if (props.type === "4aggdoc") {
          data = parseDateHeatmapDocCountAnimation(data.responses[0]);
        } else if (props.type === "topology") {
          data = parseTopologyDataAnimation(data.responses[0]);
        } else if (props.type === "histogram") {
          data = parseHistogramDataAnimation(data.responses[0]);
        } else if (props.type === "list") {
          data = parseListDataAnimation(data.responses[0]);
        } else if (props.type === "countUP") {
          data = parseQueryStringDataAnimation(data.responses[0]);
        } else if (props.type === "distinct") {
          data = parseDistinctDataAnimation(data.responses[0]);
        } else {
          alert("Problem with parsing data.");
        }
        setData(data);
        play(data);
      }
    } else play(data);
  };

  /*
    play animation
  */
  const play = (loadedData) => {
    let animation;
    // pause
    if (icon === pauseIcon && count !== -1) {
      pause();
    } else {
      // play
      if (loadedData) {
        setIcon(pauseIcon);
        let i = count;
        console.info("Animation: starting");
        animation = setInterval(function () {
          i++;
          if (loadedData && loadedData[i] && loadedData[i].data) {
            setAnimationTime(loadedData[i].time);
            setCount(i);
            props.setData(loadedData[i].data);
          } else {
            console.info("Animation: finish, ending");
            props.setData(dataAll, false);
            clearInterval(animation);
            setData([]);
            setAnimationTime("");
            setCount(-1);
            setIcon(playIcon);
            setAnimation("");
            setDataAll("");
          }
        }, 1000);

        setAnimation(animation);
      } else {
        clearInterval(animation);
        console.info("Animation: no data, ending");
        setData([]);
        setAnimationTime("");
        setCount(-1);
        setIcon(playIcon);
        setAnimation("");
        props.setData(dataAll);
      }
    }
  };

  const pause = () => {
    console.info("animation pause");
    clearInterval(animation);
    setIcon(playIcon);
    if (typeof (props.setAnimation) === "function") {
      props.setAnimation(false);
    }
  };

  //load selected timerange by animation
  const loadTimerange = () => {
    const interval = (timerange[1] -
      timerange[0]) / 30;
    const timestamp_readiable = new Date(animationTime).toLocaleString() +
      " - " +
      new Date(animationTime + interval).toLocaleString();
    dispatch(
      setTimerange([
        animationTime,
        animationTime + interval,
        timestamp_readiable,
      ]),
    );
  };

  //user changes input
  const changeSliderInput = (event) => {
    //pause if something is running
    pause();
    if (
      data[event.target.value] &&
      data[event.target.value].time
    ) {
      setAnimationTime(data[event.target.value].time);
      setCount(event.target.value);
      if (event.target.value >= data.length - 1) {
        props.setData(dataAll);
      } else {
        props.setData(data[event.target.value].data);
      }
    }
  };

  //special case if refresh is active, delete animation
  if (data.length === 0 && animation) {
    clearInterval(animation);
    setAnimation("");
    setAnimationTime("");
    setCount(-1);
    setIcon(playIcon);
    setDataAll("");
  }

  const display = props.display === "none" ? "none" : "block";
  let interval = (timerange[1] -
    timerange[0]) / 30000;
  interval = interval / 60 > 1
    ? Math.round(interval / 60) + "min"
    : interval + "s";

  return (
    <div style={{ "display": display, "paddingTop": "10px" }}>
      <span onClick={loadData} id={props.name}>
        <img
          style={{ "marginLeft": "10px", "marginRight": "0px" }}
          className="iconRefresh"
          alt="playIcon"
          src={icon}
          title="play"
        />
      </span>
      {animationTime
        ? (
          <span onClick={loadTimerange}>
            <img
              style={{ "marginLeft": "10px", "marginRight": "0px" }}
              className="iconRefresh"
              alt="loadIcon"
              src={historyIcon}
              title="load selected time"
            />
          </span>
        )
        : ""}
      {animationTime
        ? (
          <span className="slidecontainer">
            <input
              type="range"
              min="0"
              max={data.length - 1}
              onInput={changeSliderInput}
              value={count}
              className="slider"
              id="animationRange"
            >
            </input>
            <span style={{ "color": "grey" }}>
              {new Date(animationTime).toLocaleString() + " + " +
                interval}
            </span>
          </span>
        )
        : ""}
    </div>
  );
}

export default Animation;
