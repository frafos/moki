
import Datetime from "react-datetime";

import React, { Component } from 'react';
import store from "../store/index";
import storePersistent from "../store/indexPersistent";
import { setTimerange } from "../actions/index";
import Export from "./Export";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { parseTimestamp } from "../helpers/parseTimestamp";
import { shareFilters } from '../../gui';
const hiddenExport = ["wblist", "config", "account", "alarms", "settings", "monitoring"];

import timeForward from "/icons/timeForward.png";
import timeBack from "/icons/timeBack.png";
import shareIcon from "/icons/share.png";
import reloadIcon from "/icons/reload.png";
import historyIcon from "/icons/reload_time.png";
import historyIconGrey from "/icons/reload_time_grey.png";
import refreshIcon from "/icons/refresh.png";
import refreshStopIcon from "/icons/refreshStop.png";

class TimerangeBar extends Component {
    constructor(props) {
        super(props);

        var timeFormat = "hh:mm:ss";
        var dateFormat = "MM-DD-YYYY";
        var timezone = "Etc/GMT+0";

        //no aws - settings from json
        if (!storePersistent.getState().user.aws) {
            if (storePersistent.getState().settings && storePersistent.getState().settings.length > 0) {
                for (var i = 0; i < storePersistent.getState().settings[0].attrs.length; i++) {
                    if (storePersistent.getState().settings[0].attrs[i].attribute === "timeFormat") {
                        timeFormat = storePersistent.getState().settings[0].attrs[i].value;
                    }
                    if (storePersistent.getState().settings[0].attrs[i].attribute === "dateFormat") {
                        dateFormat = storePersistent.getState().settings[0].attrs[i].value;
                    }

                    if (storePersistent.getState().settings[0].attrs[i].attribute === "timezone") {
                        timezone = storePersistent.getState().settings[0].attrs[i].value;
                    }
                }
            }
        }
        //aws settings from profile
        else {
            if (storePersistent.getState().profile && storePersistent.getState().profile[0] && storePersistent.getState().profile[0].userprefs) {
                timeFormat = storePersistent.getState().profile[0].userprefs.time_format;
                dateFormat = storePersistent.getState().profile[0].userprefs.date_format;
                timezone = storePersistent.getState().profile[0].userprefs.timezone;
            }

        }

        this.state = {
            timerange: parseTimestamp(new Date(Math.trunc(Math.round(new Date().getTime() / 1000) - (6 * 3600)) * 1000)) + " + 6 hours",
            sipUser: storePersistent.getState().user.user,
            autoRefresh: storePersistent.getState().layout.autoRefresh,
            timestamp_gte: (Math.round(new Date().getTime() / 1000) - (6 * 3600)) * 1000,
            timestamp_lte: (Math.round(new Date().getTime() / 1000)) * 1000,
            refreshInterval: 30000,
            refreshIcon: refreshIcon,
            historyIcon: historyIconGrey,
            timer: "",
            isHistory: false,
            refreshUnit: "seconds",
            refreshValue: 30,
            click: false,
            history: [],
            timeFormat: timeFormat,
            dateFormat: dateFormat,
            exportJSONOpen: false,
            timezone: timezone
        }

        //no timerange set in URL parameters
        if (!store.getState().timerange[0]) {
            store.dispatch(setTimerange([(Math.round(new Date().getTime() / 1000) - (6 * 3600)) * 1000, (Math.round(new Date().getTime() / 1000)) * 1000, parseTimestamp(new Date(Math.trunc(Math.round(new Date().getTime() / 1000) - (6 * 3600)) * 1000)) + " + 6 hours"]));
        }

        this.setTimerange = this.setTimerange.bind(this);
        this.close = this.close.bind(this);
        this.share = this.share.bind(this);
        this.setToNow = this.setToNow.bind(this);
        this.moveTimerangeBack = this.moveTimerangeBack.bind(this);
        this.moveTimerangeForward = this.moveTimerangeForward.bind(this);
        this.changeTimerange = this.changeTimerange.bind(this);
        this.renderPDF = this.renderPDF.bind(this);
        this.rerenderTimerange = this.rerenderTimerange.bind(this);
        this.reload = this.reload.bind(this);
        this.setRefresh = this.setRefresh.bind(this);
        this.refresh = this.refresh.bind(this);
        this.setTimerangeLastX = this.setTimerangeLastX.bind(this);
        this.focousOutLte = this.focousOutLte.bind(this);
        this.focousOutGte = this.focousOutGte.bind(this);
        this.popupTrigger = React.createRef();
        this.addHistory = this.addHistory.bind(this);
        this.loadHistory = this.loadHistory.bind(this);
        this.exportJSON = this.exportJSON.bind(this);
        this.exportJSONclose = this.exportJSONclose.bind(this);
        this.toggleMenu = this.toggleMenu.bind(this);
        store.subscribe(() => this.rerenderTimerange());

        window.timebar = this;
        var parameters = window.location.search;
        if (parameters) {
            var refreshTime = parameters.indexOf("refresh=") !== -1 ? parseInt(parameters.substring(parameters.indexOf("refresh=") + 8)) : 0;

            //set refresh with time in seconds
            //format: &refresh=60
            if (refreshTime !== 0) {
                function refresh() {
                    var timestamp_lteOld = store.getState().timerange[1];
                    var timestamp_lte = Math.round((new Date()).getTime() / 1000) * 1000;
                    var timestamp_gte = store.getState().timerange[0];
                    timestamp_gte = timestamp_lte - (timestamp_lteOld - timestamp_gte);
                    var timestamp_readiable = parseTimestamp(new Date(timestamp_gte)) + " - " + parseTimestamp(new Date(timestamp_lte));
                    store.dispatch(setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]))
                }
                console.info("setting auto refresh every " + refreshTime + " ms.");
                window.setInterval(refresh, refreshTime);
            }

        }
    }


    //add to time history
    addHistory(timerange, timestamp_gte, timestamp_lte) {
        var historyTime = {
            timestamp: timerange,
            timestamp_gte: timestamp_gte,
            timestamp_lte: timestamp_lte
        }
        //keep only last 20 time ranges
        if (this.state.history.length > 20) {
            this.setState({ history: this.state.history.shift() });
        }
        this.setState({
            history: [...this.state.history, [historyTime]]
        })
    }

    loadHistory() {
        if (this.state.history.length !== 0) {
            var history = this.state.history;
            var lastHistory = history.pop();
            this.setState({
                history: history,
                isHistory: true
            }, () => {
                store.dispatch(setTimerange([lastHistory[0].timestamp_gte, lastHistory[0].timestamp_lte, lastHistory[0].timestamp]));
            });
        }
    }

    //if store timernage changes, render new state
    rerenderTimerange() {
        if (store.getState().timerange[2] !== this.state.timerange) {
            if (!this.state.isHistory) this.addHistory(this.state.timerange, this.state.timestamp_gte, this.state.timestamp_lte);

            console.info("Timerange is changed to " + store.getState().timerange[2]);
            this.setState({
                timerange: store.getState().timerange[2],
                timestamp_gte: store.getState().timerange[0],
                timestamp_lte: store.getState().timerange[1],
                isHistory: false
            });

        }
    }

    //share - create url with filters, types and time
    share() {
        shareFilters(store, storePersistent);
    }

    //show time select menu
    toggleMenu() {
        this.setState({ click: true });
    }

    //set refresh
    setRefresh() {
        var e = document.getElementById("timeUnit");
        var refreshInterval = document.getElementById("refresh").value * 1000
        if (e.options[e.selectedIndex].value === "minutes") {
            refreshInterval = document.getElementById("refresh").value * 60000
        }
        else if (e.options[e.selectedIndex].value === "hours") {
            refreshInterval = document.getElementById("refresh").value * 3600000
        }

        this.setState({
            refreshInterval: refreshInterval,
            refreshUnit: e.options[e.selectedIndex].value,
            refreshValue: document.getElementById("refresh").value,
            click: false
        }, () => this.clearAndStartNewRefresh());
    }

    //runs only if refresh is already running
    clearAndStartNewRefresh() {
        if (this.state.timer !== -1) {
            clearInterval(this.state.timer);
            this.startRefresh();
        }
    }

    //refresh
    refresh() {
        //stop refresh
        if (this.state.refreshIcon === refreshStopIcon) {
            clearInterval(this.state.timer);
            this.setState({
                refreshIcon: refreshIcon,
                timer: -1
            });
        }
        //start refresh
        else {
            this.startRefresh();
        }
    }

    //refresh
    startRefresh() {
        var refreshInterval = this.state.refreshInterval;
        console.info("Refresh started. Interval is " + refreshInterval);
        function refresh() {
            var timestamp_lteOld = store.getState().timerange[1];
            var timestamp_lte = Math.round((new Date()).getTime() / 1000) * 1000;
            var timestamp_gte = store.getState().timerange[0];
            timestamp_gte = timestamp_lte - (timestamp_lteOld - timestamp_gte);
            var timestamp_readiable = parseTimestamp(new Date(timestamp_gte)) + " - " + parseTimestamp(new Date(timestamp_lte));
            store.dispatch(setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]))
        }
        refresh();
        var timer = window.setInterval(refresh, refreshInterval);
        this.setState({
            refreshIcon: refreshStopIcon,
            timer: timer
        });
    }

    //reload data
    reload() {
        //relative time
        if (this.state.timerange.includes("+")) {

            if (this.state.timerange.includes("+ 6 hours")) {
                this.setTimerangeLastX("Last 6 hours");
            }
            else if (this.state.timerange.includes("+ 12 hours")) {
                this.setTimerangeLastX("Last 12 hours");
            }
            else if (this.state.timerange.includes("+ 1 day")) {
                this.setTimerangeLastX("Last 1 day");
            }
            else if (this.state.timerange.includes("+ 3 days")) {
                this.setTimerangeLastX("Last 3 days");
            }
            else if (this.state.timerange.includes("+ 15 min")) {
                this.setTimerangeLastX("Last 15 min");
            }
            else if (this.state.timerange.includes("+ 5 min")) {
                this.setTimerangeLastX("Last 5 min");
            }
            else if (this.state.timerange.includes("+ 1 hour")) {
                this.setTimerangeLastX("Last 1 hour");
            }
            else if (this.state.timerange === "Today" || this.state.timerange === "Yesterday" || this.state.timerange === "Last week") {
                this.setTimerangeLastX(this.state.timerange);
            }
        }
        //absolute time
        else {
            this.setState({ isHistory: false });
            store.dispatch(setTimerange(store.getState().timerange));

        }

    }

    focousOutLte(value) {
        this.setState({ timestamp_lte: value });

    }
    focousOutGte(value) {
        this.setState({ timestamp_gte: value });
    }

    //set to current timestamp
    setToNow(e) {
        if (e) {
            e.preventDefault();
        }
        this.focousOutLte(Math.round((new Date()).getTime() / 1000) * 1000);
    }

    //move half of timerange value back
    moveTimerangeForward(event) {
        var timestamp_gte = store.getState().timerange[0] - (store.getState().timerange[1] - store.getState().timerange[0]) / 2;
        var timestamp_lte = store.getState().timerange[1] - (store.getState().timerange[1] - store.getState().timerange[0]) / 2;
        var timestamp_readiable = parseTimestamp(new Date(timestamp_gte)) + " - " + parseTimestamp(new Date(timestamp_lte));

        this.setState({
            timerange: timestamp_readiable,
            isHistory: false
        });
        console.info("Timerange is changed to " + timestamp_readiable);
        store.dispatch(setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]));
    }

    moveTimerangeBack(event) {
        var timestamp_gte = store.getState().timerange[0] + (store.getState().timerange[1] - store.getState().timerange[0]) / 2;
        var timestamp_lte = store.getState().timerange[1] + (store.getState().timerange[1] - store.getState().timerange[0]) / 2;

        var timestamp_readiable = parseTimestamp(new Date(timestamp_gte)) + " - " + parseTimestamp(new Date(timestamp_lte));

        this.setState({
            timerange: timestamp_readiable
        });

        console.info("Timerange is changed to " + timestamp_readiable);
        store.dispatch(setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]));

    }

    //set timerange
    changeTimerange(timestamp_gte, timestamp_lte) {
        var timestamp_readiable = parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " - " + parseTimestamp(new Date(Math.trunc(timestamp_lte)));
        this.setState({
            timerange: timestamp_readiable,
            isHistory: false
        });
        console.info("Timerange is changed to " + timestamp_readiable);
        store.dispatch(setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]));
        timestamp_gte = Math.trunc(timestamp_gte);
    }



    setTimerangeLastX(timerange) {
        var timestamp_gte = "";
        var timestamp_lte = new Date();
        if (timerange === "Last 6 hours") {
            timestamp_gte = (Math.round(timestamp_lte.getTime() / 1000) - (6 * 3600)) * 1000;
            timerange = parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " + 6 hours";
        }
        else if (timerange === "Last 12 hours") {
            timestamp_gte = (Math.round(timestamp_lte.getTime() / 1000) - (12 * 3600)) * 1000;
            timerange = parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " + 12 hours";
        }
        else if (timerange === "Last 1 day") {
            timestamp_gte = (Math.round(timestamp_lte.getTime() / 1000) - (24 * 3600)) * 1000;
            timerange = parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " + 1 day";
        }
        else if (timerange === "Last 3 days") {
            timestamp_gte = (Math.round(timestamp_lte.getTime() / 1000) - (72 * 3600)) * 1000;
            timerange = parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " + 3 days";
        }
        else if (timerange === "Last 15 min") {
            timestamp_gte = (Math.round(timestamp_lte.getTime() / 1000) - (15 * 60)) * 1000;
            timerange = parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " + 15 min";
        }
        else if (timerange === "Last 5 min") {
            timestamp_gte = (Math.round(timestamp_lte.getTime() / 1000) - (5 * 60)) * 1000;
            timerange = parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " + 5 min";
        }
        else if (timerange === "Last 1 hour") {
            timestamp_gte = (Math.round(timestamp_lte.getTime() / 1000) - (3600)) * 1000;
            timerange = parseTimestamp(new Date(Math.trunc(timestamp_gte))) + " + 1 hour";
        }
        else if (timerange === "Today") {
            timestamp_gte = new Date();
            timestamp_gte.setHours(0, 0, 0, 0);
            timestamp_gte = Math.round(timestamp_gte / 1000) * 1000;
        }
        else if (timerange === "Yesterday") {
            timestamp_lte = new Date();
            timestamp_lte.setHours(24, 0, 0, 0);
            timestamp_lte = Math.round(timestamp_lte.setDate(timestamp_lte.getDate() - 1));

            timestamp_gte = new Date();
            timestamp_gte.setHours(0, 0, 0, 0);
            timestamp_gte = Math.round(timestamp_gte.setDate(timestamp_gte.getDate() - 1));
        }
        else if (timerange === "Last week") {
            timestamp_gte = (Math.round(timestamp_lte.getTime() / 1000) - (189 * 3600)) * 1000;
        }

        if (timerange !== "Yesterday") {
            timestamp_lte = Math.round((timestamp_lte).getTime() / 1000) * 1000;
        }

        this.setState({
            click: false,
            isHistory: false
        });
        console.info("Timerange is changed to " + timerange + " " + timestamp_gte + " " + timestamp_lte);

        store.dispatch(setTimerange([timestamp_gte, timestamp_lte, timerange]));
    }


    //compute and set timerange in UNIX timestamp
    setTimerange(event, fromState = false) {
        //set timestamp fron datepicker
        if (event.target.className === "setTimerange btn btn-primary") {
            var timestamp_lte = document.getElementsByClassName("timestamp_lteInput")[0].childNodes[0].value;
            var timestamp_gte = document.getElementsByClassName("timestamp_gteInput")[0].childNodes[0].value;
            if (fromState) {
                timestamp_lte = this.state.timestamp_lte;
                timestamp_gte = this.state.timestamp_gte;
            }

            function isValidDate(d) {
                return d instanceof Date && !isNaN(d);
            }

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
            // this.addHistory(store.getState().timerange[2], store.getState().timerange[0], store.getState().timerange[1]);
            const gte = Math.round((new Date(timestamp_gte)).getTime() / 1000) * 1000;
            const lte = Math.round((new Date(timestamp_lte)).getTime() / 1000) * 1000;

            if (gte - lte > 0) {
                alert("Error: Timestamp 'FROM' has to be lower than 'TO'.");
                return;
            }
            var timestamp_readiable = parseTimestamp(timestamp_gte) + " - " + parseTimestamp(timestamp_lte);

            console.info("Timerange is changed to " + timestamp_readiable + " " + gte + " " + lte);

            this.setState({
                isHistory: false,
                click: false
            });

            store.dispatch(setTimerange([gte, lte, timestamp_readiable]));
        }
        //set timestamp from dropdown menu
        else {
            var timerange = event.target.innerHTML;
            this.setTimerangeLastX(timerange);
        }
    }


    //close select time window
    close() {
        this.setState({
            click: false
        });
    }

    renderPDF() {
        const input = document.getElementById('context');
        html2canvas(input).then(function (canvas) {
            var imgData = canvas.toDataURL('image/png', 0.5);
            var width = input.scrollWidth;
            var height = input.scrollHeight;
            const pdf = new jsPDF("p", "pt", [width, height]);

            pdf.addImage(imgData, 'PNG', 0, 0);
            var pathname = window.location.pathname;
            pathname = pathname.substr(1);
            pdf.save(pathname + ".pdf");
        });
    }

    exportCSV() {
        document.getElementById("CSVexport").style.display = "block";
        this.setState({ exportCSVOpen: true });
    }

    exportJSON() {
        if (storePersistent.getState().user.jwt) {
            document.getElementById("JSONexport").style.display = "block";

        }
        this.setState({ exportJSONOpen: true });
    }

    exportJSONclose() {
        document.getElementById("JSONexport").style.display = "none"
        this.setState({ exportJSONOpen: false });
    }
    exportCSVclose() {
        document.getElementById("CSVexport").style.display = "none"
        this.setState({ exportCSVOpen: false });
    }


    render() {
        // const sipUser = this.state.sipUser.user;
        // const aws =store.getState().user.aws;
        let sipUserSwitch = <div />;
        var name = window.location.pathname.substr(1);

        return (
            <div id="popup">
                <div className="d-flex justify-content-between">
                    {sipUserSwitch}
                    {!hiddenExport.includes(name) && <div className="dropdown float-right text-right">
                        <button className="btn" type="button" id="dropdownMenuExportButton" onClick={this.exportJSON} aria-haspopup="true" aria-expanded="false">
                            Export
                        </button>
                    </div>
                    }

                    {name !== "wblist" && <div className="dropdown float-right text-right">
                        <span onClick={this.share} className="tabletd marginRight" ><img className="iconShare" alt="shareIcon" src={shareIcon} title="share" /><span id="tooltipshare" style={{ "display": "none" }}>copied to clipboard</span></span>
                        <span className="tabletd marginRight" onClick={this.moveTimerangeForward}><img alt="timeBackIcon" src={timeBack} title="move back" /></span><span className="tabletd marginRight" onClick={this.moveTimerangeBack}> <img alt="timeForwardIcon" src={timeForward} title="move forward" /></span>
                        <span id="reload" onClick={this.reload} className="tabletd marginRight" ><img className="iconReload" alt="reloadIcon" src={reloadIcon} title="reload" /></span>
                        <span onClick={this.loadHistory} className="tabletd marginRight" ><img className="iconHistory" alt="historyIcon" src={this.state.history.length === 0 ? historyIconGrey : historyIcon} title="previous time range" /></span>
                        {this.state.autoRefresh && <span onClick={this.refresh} className="tabletd" ><img style={{ "marginLeft": "10px", "marginRight": "0px" }} className="iconRefresh" alt="refreshIcon" src={this.state.refreshIcon} title="refresh" /></span>}
                        <button className="btn dropdown-toggle" type="button" id="dropdownMenuButton" onClick={this.toggleMenu} aria-haspopup="true" aria-expanded="false">
                            {store.getState().timerange[2]}
                        </button>
                        {this.state.click && <div className="dropdown-menu dropdown-menu-right show" aria-labelledby="dropdownMenuButton" id="toggleDropdown" style={{ "display": "block" }}>
                            <div className="row" id="timeMenu">
                                <div className="col-4 ">
                                    <h3 className="margins">Relative time</h3>
                                    <button className="dropdown-item tabletd" onClick={this.setTimerange}>Last 5 min</button>
                                    <button className="dropdown-item tabletd" onClick={this.setTimerange}>Last 15 min</button>
                                    <button className="dropdown-item tabletd" onClick={this.setTimerange}>Last 1 hour</button>
                                    <button className="dropdown-item tabletd" onClick={this.setTimerange}>Last 6 hours</button>
                                    <button className="dropdown-item tabletd" onClick={this.setTimerange} >Last 12 hours</button>
                                    <button className="dropdown-item tabletd" onClick={this.setTimerange} >Last 1 day</button>
                                    <button className="dropdown-item tabletd" onClick={this.setTimerange} >Today</button>
                                    <button className="dropdown-item tabletd" onClick={this.setTimerange} >Yesterday</button>
                                    <button className="dropdown-item tabletd" onClick={this.setTimerange} >Last 3 days</button>
                                    <button className="dropdown-item tabletd" onClick={this.setTimerange} >Last week</button>
                                </div>
                                <div className="col">
                                    <form className="px-4 py-3">
                                        <div className="form-group">
                                            <h3>Absolute time</h3>
                                            <p>From:</p>
                                            <Datetime closeOnTab
                                                closeOnSelect
                                                timeFormat={this.state.timeFormat}
                                                dateFormat={this.state.dateFormat}
                                                className="timestamp_gteInput"
                                                input={true}
                                                onBlur={this.focousOutGte}
                                                onChange={this.focousOutGte}
                                                defaultValue={new Date(this.state.timestamp_gte)}
                                                value={this.state.timestamp_gte} />
                                            <p>To: <button className="link" onClick={this.setToNow}>(now)</button></p>
                                            <Datetime closeOnTab
                                                closeOnSelect
                                                timeFormat={this.state.timeFormat}
                                                dateFormat={this.state.dateFormat}
                                                onBlur={this.focousOutLte}
                                                onChange={this.focousOutLte}
                                                defaultValue={new Date(this.state.timestamp_lte)}
                                                value={this.state.timestamp_lte}
                                                className="timestamp_lteInput" />
                                        </div>
                                    </form>

                                </div>
                                <button style={{ "marginLeft": "10%", "marginTop": "60px" }} onClick={this.close} className="setTimerange btn btn-secondary">Cancel</button>  <button style={{ "marginTop": "60px" }} onClick={(e) => this.setTimerange(e, true)} className="setTimerange btn btn-primary">Set</button>
                            </div>
                            <hr></hr>
                            {this.state.autoRefresh && <div className="row" style={{ "marginLeft": "15px" }}>
                                <br />
                                <h3 style={{ "marginTop": "15px" }}>Refresh </h3>
                            </div>}
                            {this.state.autoRefresh && <div className="row" style={{ "marginLeft": "30px" }}>
                                <p style={{ "whiteSpace": "pre-wrap" }}>every </p> <input type="number" id="refresh" min="1" max="60" defaultValue={this.state.refreshValue} style={{ "width": "fit-content" }} /><select id="timeUnit" style={{ "width": "fit-content" }} defaultValue={this.state.refreshUnit} >
                                    <option value="seconds">seconds</option>
                                    <option value="minutes">minutes</option>
                                    <option value="hours">hours</option>
                                </select>
                                <button onClick={this.setRefresh} className="setTimerange btn btn-secondary" style={{ "marginLeft": "50px" }}>OK</button>
                            </div>}
                        </div>
                        }
                    </div>
                    }


                </div>
                {name !== "web" && <div className="export" id="JSONexport">
                    <button className="close" onClick={this.exportJSONclose}>
                        &times;
                    </button>
                    <Export type="JSON" exportOpen={this.state.exportJSONOpen} close={this.exportJSONclose} />
                </div>
                }
            </div>
        );
    }
}
export default TimerangeBar;

