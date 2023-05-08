import Datetime from "react-datetime";

import { useEffect, useRef, useState } from "react";
import Export from "./Export";
import { parseTimestamp } from "../helpers/parseTimestamp";
import { shareFilters } from "../../gui";
const hiddenExport = [
  "wblist",
  "config",
  "account",
  "alarms",
  "settings",
  "monitoring",
];

import store from "@/js/store";
import { setTimerange } from "@/js/slices";

import timeForward from "/icons/timeForward.png";
import timeBack from "/icons/timeBack.png";
import shareIcon from "/icons/share.png";
import reloadIcon from "/icons/reload.png";
import historyIcon from "/icons/reload_time.png";
import historyIconGrey from "/icons/reload_time_grey.png";
import refreshStartIcon from "/icons/refresh.png";
import refreshStopIcon from "/icons/refreshStop.png";
import { useSelector } from "react-redux";

function TimerangeBar(props) {
  let timeFormat = "hh:mm:ss";
  let dateFormat = "MM-DD-YYYY";

  const { user, settings, profile, layout } = store.getState().persistent;
  const autoRefresh = layout.autoRefresh;

  // no aws - settings from json
  if (!user.aws) {
    if (settings && settings.length > 0) {
      for (const attr of settings[0].attrs) {
        switch (attr.attribute) {
          case "timeFormat":
            timeFormat = attr.value;
          case "dateFormat":
            dateFormat = attr.value;
        }
      }
    }
  } //aws settings from profile
  else {
    if (profile && profile[0] && profile[0].userprefs) {
      const prefs = profile[0].userprefs;
      timeFormat = prefs.time_format;
      dateFormat = prefs.date_format;
    }
  }

  const [timestampGte, setTimestampGte] = useState(
    (Math.round(new Date().getTime() / 1000) - (6 * 3600)) *
      1000,
  );
  const [timestampLte, setTimestampLte] = useState(
    (Math.round(new Date().getTime() / 1000)) * 1000,
  );
  const [refreshIcon, setRefreshIcon] = useState(refreshStartIcon);
  const [timer, setTimer] = useState("");
  const [isHistory, setIsHistory] = useState(false);
  const [refreshUnit, setRefreshUnit] = useState("seconds");
  const [refreshValue, setRefreshValue] = useState(30);
  const [click, setClick] = useState(false);
  const [history, setHistory] = useState([]);

  const refreshInterval = useRef(30000);
  const timestamp = useRef([
    timestampGte,
    timestampLte,
    parseTimestamp(
      new Date(
        Math.trunc(Math.round(new Date().getTime() / 1000) - (6 * 3600)) * 1000,
      ),
    ) + " + 6 hours",
  ]);

  const timerange = useSelector((state) => state.filter.timerange);

  // if store timernage changes, render new state
  useEffect(() => {
    // no timerange set in URL parameters
    if (!timerange[0]) {
      store.dispatch(
        setTimerange([
          (Math.round(new Date().getTime() / 1000) - (6 * 3600)) * 1000,
          (Math.round(new Date().getTime() / 1000)) * 1000,
          parseTimestamp(
            new Date(
              Math.trunc(Math.round(new Date().getTime() / 1000) - (6 * 3600)) *
                1000,
            ),
          ) + " + 6 hours",
        ]),
      );
    }

    if (!timerange[2] || timestamp.current[2] == timerange[2]) return;
    if (!isHistory) {
      addHistory(timestamp.current);
    }
    console.info("Timerange is changed to " + timerange);
    timestamp.current = timerange;
    setTimestampGte(timerange[0]);
    setTimestampLte(timerange[1]);
    setIsHistory(false);
  }, [timerange]);

  // TODO: use react router
  let parameters = window.location.search;
  if (parameters) {
    let refreshTime = parameters.indexOf("refresh=") !== -1
      ? parseInt(parameters.substring(parameters.indexOf("refresh=") + 8))
      : 0;

    // set refresh with time in seconds
    // format: &refresh=60
    if (refreshTime !== 0) {
      const refresh = () => {
        let timestamp_lteOld = timerange[1];
        let timestamp_lte = Math.round((new Date()).getTime() / 1000) * 1000;
        let timestamp_gte = timerange[0];
        timestamp_gte = timestamp_lte - (timestamp_lteOld - timestamp_gte);
        let timestamp_readiable = parseTimestamp(new Date(timestamp_gte)) +
          " - " + parseTimestamp(new Date(timestamp_lte));
        store.dispatch(
          setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]),
        );
      };
      console.info("setting auto refresh every " + refreshTime + " ms.");
      window.setInterval(refresh, refreshTime);
    }
  }

  //add to time history
  const addHistory = (timestamp) => {
    //keep only last 20 time ranges
    const newHistory = [...history];
    if (history.length > 20) {
      newHistory.shift();
    }
    newHistory.push(timestamp);
    setHistory(newHistory);
  };

  const loadHistory = () => {
    if (history.length !== 0) {
      const newHistory = [...history];
      const lastTime = newHistory.pop();
      setHistory(newHistory);
      setIsHistory(true);
      store.dispatch(setTimerange(lastTime));
    }
  };

  //share - create url with filters, types and time
  const share = () => {
    shareFilters(store);
  };

  //show time select menu
  const toggleMenu = () => {
    setClick(true);
  };

  //set refresh
  const setRefresh = () => {
    let e = document.getElementById("timeUnit");
    refreshInterval.current = document.getElementById("refresh").value * 1000;
    if (e.options[e.selectedIndex].value === "minutes") {
      refreshInterval.current = document.getElementById("refresh").value *
        60000;
    } else if (e.options[e.selectedIndex].value === "hours") {
      refreshInterval.current = document.getElementById("refresh").value *
        3600000;
    }

    setRefreshUnit(e.options[e.selectedIndex].value);
    setRefreshValue(document.getElementById("refresh").value);
    setClick(false);

    // runs only if refresh is already running
    if (timer !== -1) {
      clearInterval(timer);
      startRefresh();
    }
  };

  // refresh
  const onRefresh = () => {
    // stop refresh
    if (refreshIcon === refreshStopIcon) {
      clearInterval(timer);
      setRefreshIcon(refreshStartIcon);
      setTimer(-1);
    } //start refresh
    else {
      startRefresh();
    }
  };

  //refresh
  const startRefresh = () => {
    console.info("Refresh started. Interval is " + refreshInterval.current);
    const refreshStart = () => {
      let timestamp_lteOld = timerange[1];
      let timestamp_lte = Math.round((new Date()).getTime() / 1000) * 1000;
      let timestamp_gte = timerange[0];
      timestamp_gte = timestamp_lte - (timestamp_lteOld - timestamp_gte);
      let timestamp_readiable = parseTimestamp(new Date(timestamp_gte)) +
        " - " + parseTimestamp(new Date(timestamp_lte));
      store.dispatch(
        setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]),
      );
    };
    refreshStart();
    const refreshTimer = window.setInterval(
      refreshStart,
      refreshInterval.current,
    );
    setTimer(refreshTimer);
    setRefreshIcon(refreshStopIcon);
  };

  //reload data
  const reload = () => {
    // relative time
    if (timerange[2].includes("+")) {
      if (timerange[2].includes("+ 6 hours")) {
        setTimerangeLastX("Last 6 hours");
      } else if (timerange[2].includes("+ 12 hours")) {
        setTimerangeLastX("Last 12 hours");
      } else if (timerange[2].includes("+ 1 day")) {
        setTimerangeLastX("Last 1 day");
      } else if (timerange[2].includes("+ 3 days")) {
        setTimerangeLastX("Last 3 days");
      } else if (timerange[2].includes("+ 15 min")) {
        setTimerangeLastX("Last 15 min");
      } else if (timerange[2].includes("+ 5 min")) {
        setTimerangeLastX("Last 5 min");
      } else if (timerange[2].includes("+ 1 hour")) {
        setTimerangeLastX("Last 1 hour");
      } else if (
        timerange[2] === "Today" || timerange[2] === "Yesterday" ||
        timerange[2] === "Last week"
      ) {
        setTimerangeLastX(timerange[2]);
      }
    } //absolute time
    else {
      setIsHistory(false);
      // copy to trigger reload, even if timerange didn't change
      store.dispatch(setTimerange([...timerange]));
    }
  };

  const focousOutLte = (value) => {
    setTimestampLte(value.valueOf());
  };
  const focousOutGte = (value) => {
    setTimestampGte(value.valueOf());
  };

  //set to current timestamp
  const setToNow = (e) => {
    if (e) {
      e.preventDefault();
    }
    focousOutLte(Math.round((new Date()).getTime() / 1000) * 1000);
  };

  //move half of timerange value back
  const moveTimerangeForward = () => {
    let timestamp_gte = timerange[0] - (timerange[1] - timerange[0]) / 2;
    let timestamp_lte = timerange[1] - (timerange[1] - timerange[0]) / 2;
    let timestamp_readiable = parseTimestamp(new Date(timestamp_gte)) + " - " +
      parseTimestamp(new Date(timestamp_lte));

    setIsHistory(false);
    console.info("Timerange is changed to " + timestamp_readiable);
    store.dispatch(
      setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]),
    );
  };

  const moveTimerangeBack = () => {
    let timestamp_gte = timerange[0] + (timerange[1] - timerange[0]) / 2;
    let timestamp_lte = timerange[1] + (timerange[1] - timerange[0]) / 2;
    let timestamp_readiable = parseTimestamp(new Date(timestamp_gte)) + " - " +
      parseTimestamp(new Date(timestamp_lte));

    console.info("Timerange is changed to " + timestamp_readiable);
    store.dispatch(
      setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]),
    );
  };

  const setTimerangeLastX = (lastX) => {
    let timestamp_gte = "";
    let timestamp_lte = new Date();
    if (lastX === "Last 6 hours") {
      timestamp_gte =
        (Math.round(timestamp_lte.getTime() / 1000) - (6 * 3600)) *
        1000;
      lastX = parseTimestamp(new Date(Math.trunc(timestamp_gte))) +
        " + 6 hours";
    } else if (lastX === "Last 12 hours") {
      timestamp_gte =
        (Math.round(timestamp_lte.getTime() / 1000) - (12 * 3600)) *
        1000;
      lastX = parseTimestamp(new Date(Math.trunc(timestamp_gte))) +
        " + 12 hours";
    } else if (lastX === "Last 1 day") {
      timestamp_gte =
        (Math.round(timestamp_lte.getTime() / 1000) - (24 * 3600)) *
        1000;
      lastX = parseTimestamp(new Date(Math.trunc(timestamp_gte))) +
        " + 1 day";
    } else if (lastX === "Last 3 days") {
      timestamp_gte =
        (Math.round(timestamp_lte.getTime() / 1000) - (72 * 3600)) *
        1000;
      lastX = parseTimestamp(new Date(Math.trunc(timestamp_gte))) +
        " + 3 days";
    } else if (lastX === "Last 15 min") {
      timestamp_gte = (Math.round(timestamp_lte.getTime() / 1000) - (15 * 60)) *
        1000;
      lastX = parseTimestamp(new Date(Math.trunc(timestamp_gte))) +
        " + 15 min";
    } else if (lastX === "Last 5 min") {
      timestamp_gte = (Math.round(timestamp_lte.getTime() / 1000) - (5 * 60)) *
        1000;
      lastX = parseTimestamp(new Date(Math.trunc(timestamp_gte))) +
        " + 5 min";
    } else if (lastX === "Last 1 hour") {
      timestamp_gte = (Math.round(timestamp_lte.getTime() / 1000) - (3600)) *
        1000;
      lastX = parseTimestamp(new Date(Math.trunc(timestamp_gte))) +
        " + 1 hour";
    } else if (lastX === "Today") {
      timestamp_gte = new Date();
      timestamp_gte.setHours(0, 0, 0, 0);
      timestamp_gte = Math.round(timestamp_gte / 1000) * 1000;
    } else if (lastX === "Yesterday") {
      timestamp_lte = new Date();
      timestamp_lte.setHours(24, 0, 0, 0);
      timestamp_lte = Math.round(
        timestamp_lte.setDate(timestamp_lte.getDate() - 1),
      );

      timestamp_gte = new Date();
      timestamp_gte.setHours(0, 0, 0, 0);
      timestamp_gte = Math.round(
        timestamp_gte.setDate(timestamp_gte.getDate() - 1),
      );
    } else if (lastX === "Last week") {
      timestamp_gte =
        (Math.round(timestamp_lte.getTime() / 1000) - (189 * 3600)) * 1000;
    }

    if (lastX !== "Yesterday") {
      timestamp_lte = Math.round((timestamp_lte).getTime() / 1000) * 1000;
    }

    setClick(false);
    setIsHistory(false);
    console.info(
      "Timerange is changed to " + lastX + " " + timestamp_gte + " " +
        timestamp_lte,
    );
    store.dispatch(setTimerange([timestamp_gte, timestamp_lte, lastX]));
  };

  // compute and set timerange in UNIX timestamp
  const setUnixTimerange = (event, fromState = false) => {
    //set timestamp fron datepicker
    if (event.target.className === "setTimerange btn btn-primary") {
      let timestamp_lte =
        document.getElementsByClassName("timestamp_lteInput")[0].childNodes[0]
          .value;
      let timestamp_gte =
        document.getElementsByClassName("timestamp_gteInput")[0].childNodes[0]
          .value;
      if (fromState) {
        timestamp_lte = timestampLte;
        timestamp_gte = timestampGte;
      }

      const isValidDate = (d) => {
        return d instanceof Date && !isNaN(d);
      };

      if (!isValidDate(new Date(timestamp_gte))) {
        alert("Error: timestamp from is not valid date");
        return;
      }

      if (!isValidDate(new Date(timestamp_lte))) {
        alert("Error: timestamp to is not valid date");
        return;
      }

      if (new Date(timestamp_gte).getTime() < 0) {
        alert("Error: Timestamp 'FROM' is not valid date.");
        return;
      }

      if (new Date(timestamp_lte).getTime() < 0) {
        alert("Error: Timestamp 'TO' is not valid date.");
        return;
      }
      const gte = Math.round((new Date(timestamp_gte)).getTime() / 1000) * 1000;
      const lte = Math.round((new Date(timestamp_lte)).getTime() / 1000) * 1000;

      if (gte - lte > 0) {
        alert("Error: Timestamp 'FROM' has to be lower than 'TO'.");
        return;
      }
      let timestamp_readiable = parseTimestamp(timestamp_gte) + " - " +
        parseTimestamp(timestamp_lte);

      console.info(
        "Timerange is changed to " + timestamp_readiable + " " + gte + " " +
          lte,
      );

      setIsHistory(false);
      setClick(false);
      store.dispatch(setTimerange([gte, lte, timestamp_readiable]));
    } //set timestamp from dropdown menu
    else {
      setTimerangeLastX(event.target.innerHTML);
    }
  };

  //close select time window
  const close = () => {
    setClick(false);
  };

  const exportJSON = () => {
    if (store.getState().persistent.user.jwt) {
      document.getElementById("JSONexport").style.display = "block";
    }
    setOpenExportJSON(true);
  };

  const exportJSONclose = () => {
    document.getElementById("JSONexport").style.display = "none";
    setOpenExportJSON(false);
  };

  // const sipUser = this.state.sipUser.user;
  // const aws =store.getState().user.aws;
  let sipUserSwitch = <div />;
  let name = window.location.pathname.substr(1);

  return (
    <div id="popup">
      <div className="d-flex justify-content-between">
        {sipUserSwitch}
        {!hiddenExport.includes(name) && user.user !== "report"  && <Export />}
        {user.user === "report" && <div style={{"marginLeft": "30px"}}> {props.type + timerange[2]}</div>}
        {name !== "wblist" && user.user !== "report" && (
          <div className="dropdown float-right text-right">
            <span onClick={share} className="tabletd marginRight">
              <img
                className="iconShare"
                alt="shareIcon"
                src={shareIcon}
                title="share"
              />
              <span id="tooltipshare" style={{ "display": "none" }}>
                copied to clipboard
              </span>
            </span>
            <span
              className="tabletd marginRight"
              onClick={moveTimerangeForward}
            >
              <img alt="timeBackIcon" src={timeBack} title="move back" />
            </span>
            <span
              className="tabletd marginRight"
              onClick={moveTimerangeBack}
            >
              <img
                alt="timeForwardIcon"
                src={timeForward}
                title="move forward"
              />
            </span>
            <span
              id="reload"
              onClick={reload}
              className="tabletd marginRight"
            >
              <img
                className="iconReload"
                alt="reloadIcon"
                src={reloadIcon}
                title="reload"
              />
            </span>
            <span onClick={loadHistory} className="tabletd marginRight">
              <img
                className="iconHistory"
                alt="historyIcon"
                src={history.length === 0 ? historyIconGrey : historyIcon}
                title="previous time range"
              />
            </span>
            {autoRefresh && user.user !== "report" && (
              <span onClick={onRefresh} className="tabletd">
                <img
                  style={{ "marginLeft": "10px", "marginRight": "0px" }}
                  className="iconRefresh"
                  alt="refreshIcon"
                  src={refreshIcon}
                  title="refresh"
                />
              </span>
            )}
            <button
              className="btn dropdown-toggle"
              type="button"
              id="dropdownMenuButton"
              onClick={toggleMenu}
              aria-haspopup="true"
              aria-expanded="false"
            >
              {timerange[2]}
            </button>
            {click && (
              <div
                className="dropdown-menu dropdown-menu-right show"
                aria-labelledby="dropdownMenuButton"
                id="toggleDropdown"
                style={{ "display": "block" }}
              >
                <div className="row" id="timeMenu">
                  <div className="col-4 ">
                    <h3 className="margins">Relative time</h3>
                    <button
                      className="dropdown-item tabletd"
                      onClick={setUnixTimerange}
                    >
                      Last 5 min
                    </button>
                    <button
                      className="dropdown-item tabletd"
                      onClick={setUnixTimerange}
                    >
                      Last 15 min
                    </button>
                    <button
                      className="dropdown-item tabletd"
                      onClick={setUnixTimerange}
                    >
                      Last 1 hour
                    </button>
                    <button
                      className="dropdown-item tabletd"
                      onClick={setUnixTimerange}
                    >
                      Last 6 hours
                    </button>
                    <button
                      className="dropdown-item tabletd"
                      onClick={setUnixTimerange}
                    >
                      Last 12 hours
                    </button>
                    <button
                      className="dropdown-item tabletd"
                      onClick={setUnixTimerange}
                    >
                      Last 1 day
                    </button>
                    <button
                      className="dropdown-item tabletd"
                      onClick={setUnixTimerange}
                    >
                      Today
                    </button>
                    <button
                      className="dropdown-item tabletd"
                      onClick={setUnixTimerange}
                    >
                      Yesterday
                    </button>
                    <button
                      className="dropdown-item tabletd"
                      onClick={setUnixTimerange}
                    >
                      Last 3 days
                    </button>
                    <button
                      className="dropdown-item tabletd"
                      onClick={setUnixTimerange}
                    >
                      Last week
                    </button>
                  </div>
                  <div className="col">
                    <form className="px-4 py-3">
                      <div className="form-group">
                        <h3>Absolute time</h3>
                        <p>From:</p>
                        <Datetime
                          closeOnTab
                          closeOnSelect
                          timeFormat={timeFormat}
                          dateFormat={dateFormat}
                          className="timestamp_gteInput"
                          input={true}
                          onBlur={focousOutGte}
                          onChange={focousOutGte}
                          defaultValue={new Date(timestampGte)}
                          value={timestampGte}
                        />
                        <p>
                          To:{" "}
                          <button className="link" onClick={setToNow}>
                            (now)
                          </button>
                        </p>
                        <Datetime
                          closeOnTab
                          closeOnSelect
                          timeFormat={timeFormat}
                          dateFormat={dateFormat}
                          onBlur={focousOutLte}
                          onChange={focousOutLte}
                          defaultValue={new Date(timestampLte)}
                          value={timestampLte}
                          className="timestamp_lteInput"
                        />
                      </div>
                    </form>
                  </div>
                  <button
                    style={{ "marginLeft": "10%", "marginTop": "60px" }}
                    onClick={close}
                    className="setTimerange btn btn-secondary"
                  >
                    Cancel
                  </button>{" "}
                  <button
                    style={{ "marginTop": "60px" }}
                    onClick={(e) => setUnixTimerange(e, true)}
                    className="setTimerange btn btn-primary"
                  >
                    Set
                  </button>
                </div>
                <hr></hr>
                {autoRefresh && user.user !== "report" && (
                  <div className="row" style={{ "marginLeft": "15px" }}>
                    <br />
                    <h3 style={{ "marginTop": "15px" }}>Refresh</h3>
                  </div>
                )}
                {autoRefresh && user.user !== "report" && (
                  <div className="row" style={{ "marginLeft": "30px" }}>
                    <p style={{ "whiteSpace": "pre-wrap" }}>every</p>{" "}
                    <input
                      type="number"
                      id="refresh"
                      min="1"
                      max="60"
                      defaultValue={refreshValue}
                      style={{ "width": "fit-content" }}
                    />
                    <select
                      id="timeUnit"
                      style={{ "width": "fit-content" }}
                      defaultValue={refreshUnit}
                    >
                      <option value="seconds">seconds</option>
                      <option value="minutes">minutes</option>
                      <option value="hours">hours</option>
                    </select>
                    <button
                      onClick={setRefresh}
                      className="setTimerange btn btn-secondary"
                      style={{ "marginLeft": "50px" }}
                    >
                      OK
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimerangeBar;
