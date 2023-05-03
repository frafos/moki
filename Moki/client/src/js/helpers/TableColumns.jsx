import React, { Component } from 'react';
import Popup from "reactjs-popup";
import TagRanger from "../bars/TagRanger";
import { formatDuration } from "./getDurationFormat";
import { downloadAll } from "./download/downloadAll";
import { exportJSON } from "./export";
import { getPcap } from './getPcap';
import { exclude } from './exclude';
import { parseTimestamp } from "../helpers/parseTimestamp";
import SimpleSequenceDiagram from "../charts/simpleSequenceDiagram";
import { checkBLip } from "../helpers/alertProfile";
import { getSearchableAttributes, getExceededName, 
isEncryptedAttr, createFilter } from "../../gui";
import querySrv from './querySrv';

import store from "@/js/store";

import detailsIcon from "/icons/details.png";
import filterIcon from "/icons/filter.png";
import clipboardIcon from "/icons/clipboard.png";
import shareIcon from "/icons/share_dark.png";
import overviewIcon from "/icons/alertProfile.png";
import suppressIcon from "/icons/suppress.png";
import unfilterIcon from "/icons/unfilter.png";
import BLIcon from "/icons/blacklist.png";
import downloadPcapIcon from "/icons/downloadPcap.png";
import downloadIcon from "/icons/download.png";
import viewIcon from "/icons/view.png";

const attrsTypes = {
    "@timestamp": "time",
    "timestamp": "time",
    "ts-start": "time",
    "created": "time",
    "rx": "round",
    "tx": "round",
    "shortterm": "round",
    "midterm": "round",
    "longterm": "round"
}

//support class for async value
class ExceededName extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: this.props.data,
        }
        this.getName = this.getName.bind(this);
    }
    componentDidMount() {
        this.getName();
    }

    async getName() {
        this.setState({
            name: await getExceededName(this.props.data)
        })
    }

    render() {
        return <span className="filterToggleActive"><span className="filterToggle">
            <img onClick={this.props.doFilterRaw} field="exceeded" value={this.props.value} className="icon" alt="filterIcon" src={filterIcon} /><img field="exceeded" value={this.props.notvalue} onClick={this.props.doFilterRaw} className="icon" alt="unfilterIcon" src={unfilterIcon} /></span >   {this.state.name}
        </span>
    }
}

//support class for async value for checking IP blacklisted
class BLcheck extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isBL: false
        }
        this.getBL = this.getBL.bind(this);
    }

    componentDidMount() {
        this.getBL();
    }

    componentWillUnmount() {
        // fix Warning: Can't perform a React state update on an unmounted component
        this.setState = (state, callback) => {
            return;
        };
    }

    async getBL() {
        this.setState({
            isBL: await checkBLip(this.props.data, "ipblack", true)
        })
    }

    render() {
        if (this.state.isBL) {
            return <span style={{ "marginLeft": "5px" }} title="blacklisted"><img style={{ "height": "20px" }} className="icon" title="blacklisted" alt="BLicon" src={BLIcon} /></span>
        }
        else {
            return "";
        }
    }
}

/*
create new filter based on html tag with field with attribute as name
*/
export const doFilter = (event) => {
    createFilter(event.currentTarget.getAttribute('field') + ":\"" + event.currentTarget.getAttribute('value') + "\"");
}
/*
create raw new filter without changing it's value
*/
export const doFilterRaw = (event) => {
    createFilter(event.currentTarget.getAttribute('value'));
}

/*
same as above but unfilter
*/
export const doUnfilter = (event) => {
    createFilter("NOT " + event.currentTarget.getAttribute('field') + ":\"" + event.currentTarget.getAttribute('value') + "\"");
}

/*
show exclude popup
*/
export const openExclude = (i) => {
    document.getElementById("popupExclude" + i.id).style.display = "inline";
    document.getElementById("input" + i.id).focus();
}

export const closePopupExclude = (i) => {
    document.getElementById("popupExclude" + i.id).style.display = "none";
}

//json syntax highlight
export const syntaxHighlight = (json) => {

    if (typeof json != 'string') {
        try {
            if (json.attrs && json.attrs["rtp-stats-a"]) {
                json.attrs["rtp-stats-a"] = JSON.parse(json.attrs["rtp-stats-a"]);
            }

            if (json.attrs && json.attrs["rtp-stats-b"]) {
                json.attrs["rtp-stats-b"] = JSON.parse(json.attrs["rtp-stats-b"]);
            }
        }
        catch (e) { }


        /*      let innerPaths = [];
              function sortObject(obj, path) {
                  for (let hit of Object.keys(obj)) {
                      if (typeof obj[hit] === 'object' && obj[hit].constructor !== Array) {
                          if (path === "") {
                              innerPaths.push(hit);
                          }
                          else {
                              innerPaths.push(path + "." + hit);
                          }
                          sortObject(obj[hit], hit);
                      }
                  }
                  sortObject(json, "")


                 for (let hit of innerPaths) {
                      Object.keys(eval("json." + hit))
                          .sort()
                          .reduce((acc, key) => ({
                              ...acc, [key]: eval("json." + hit)[key]
                          }), {})
                  }
      */

        let listInnerObject = [];
        for (let hit of Object.keys(json)) {
            if (typeof json[hit] === 'object' && json[hit].constructor !== Array) {
                listInnerObject.push(hit);
            }
        }

        //sort main object
        let not_sorted = json;
        json = Object.keys(not_sorted)
            .sort(function (a, b) {
                return a.toLowerCase().localeCompare(
                    b.toLowerCase()
                );
            })
            .reduce((acc, key) => ({
                ...acc, [key]: not_sorted[key]
            }), {})

        //sort all of it
        for (let hit of listInnerObject) {
            let not_sorted = json[hit];
            json[hit] = Object.keys(not_sorted)
                .sort(function (a, b) {
                    return a.toLowerCase().localeCompare(
                        b.toLowerCase()
                    );
                })
                .reduce((acc, key) => ({
                    ...acc, [key]: not_sorted[key]
                }), {})
        }

        //sort rtp-stats-a - is an array
        if (json.attrs && json.attrs["rtp-stats-a"] && json.attrs["rtp-stats-a"][0]) {
            for (let k = 0; k < json.attrs["rtp-stats-a"].length; k++) {
                let not_sorted = json.attrs["rtp-stats-a"][k];
                json.attrs["rtp-stats-a"][k] = Object.keys(not_sorted)
                    .sort(function (a, b) {
                        return a.toLowerCase().localeCompare(
                            b.toLowerCase()
                        );
                    })
                    .reduce((acc, key) => ({
                        ...acc, [key]: not_sorted[key]
                    }), {})
            }
        }

        if (json.attrs && json.attrs["rtp-stats-b"] && json.attrs["rtp-stats-b"][0]) {
            for (let k = 0; k < json.attrs["rtp-stats-b"].length; k++) {
                let not_sorted = json.attrs["rtp-stats-b"][k];
                json.attrs["rtp-stats-b"][k] = Object.keys(not_sorted)
                    .sort(function (a, b) {
                        return a.toLowerCase().localeCompare(
                            b.toLowerCase()
                        );
                    })
                    .reduce((acc, key) => ({
                        ...acc, [key]: not_sorted[key]
                    }), {})
            }
        }

        json = JSON.stringify(json, undefined, 4);
    }


    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    json = json.substring(1);
    json = json.substring(0, json.length - 1);
    json = json.replaceAll("{", "<button class='expandJson'>-</button><span>{");
    json = json.replaceAll("}", "}</span>");

    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }

        return '<span class="rowSplit ' + cls + '">' + match + '</span>';
    });
}

function clickHandlerHTML(e) {
    let el = e.target;
    if (el.className === "expandJson") {
        if (el.innerText === '-') {
            el.setAttribute("expand", 'false');
            el.innerText = "+";
            el.nextSibling.style.display = "none";
        }
        else {
            el.setAttribute("expand", 'true');
            el.innerText = "-";
            el.nextSibling.style.display = "inline";
        }
    }
}


const shareEvent = (id) => {
    const { timerange } = store.getState().filter;

    let href = window.location.origin + window.location.pathname + "?from=" + timerange[0] + "&to=" + timerange[1];

    //put it into clipboard
    let dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = href + "&filter=_id:" + id;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);

    document.getElementById("tooltipshareFilter" + id).style.display = "inline";
    setTimeout(function () {
        document.getElementById("tooltipshareFilter" + id).style.display = "none";
    }, 1000);
}

/*
handle user input on exclude
*/
export const onEnterKeyExclude = (event, ob) => {
    if (event.keyCode === 13) {
        exclude(ob);
    }
}
// check if column width is stored in local storage
function getColumnWidth(column, width = 0) {

    if (width !== 0) {
        return width;
    }
    else {
        return "auto";
    }
}

//IL suppress alert  /api/alertapi/supress?toggle=true&key=37.128.36.211&hmac=a2b87&alertid=TMAA
async function supressAlert(ob) {
    let id = ob.alert.alertId;
    let url = "api/alertapi/supress?keyRef=" + ob.alert.key.keyRef + "&toggle=false&alertid=" + id;

    try {
        const response = await querySrv(url, {
            method: "GET",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": "include"
            }
        });
        var jsonData = await response.json();

        if (jsonData.statusCode && jsonData.statusCode === 404) {
            alert(jsonData.statusDescription);
            return;
        }

        alert("Next time, you won't see " + ob.alert.key.attrName + " alert for " + ob.alert.key.value);
    } catch (error) {
        console.error(error);
        alert("Problem with receiving data. " + error);
        return;
    }
}

//copy value in table to clipboard and show msg
function copyToclipboard(value, id = null) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = value;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);

    if (!id) {
        id = value;
    }

    document.getElementById("copyToClipboardText" + id).style.display = "inline";
    setTimeout(function () {
        document.getElementById("copyToClipboardText" + id).style.display = "none";
    }, 1000);
}

function getColumn(column_name, tags, tag, width = 0, hidden = false, dashboard) {

    const { user, profile } = store.getState().persistent;

    switch (column_name.source) {
        case '_id': return {
            dataField: '_source._id',
            text: 'ID',
            hidden: true,
            isKey: true
        }
        //different fields for reason
        case 'attrs.reason': return {
            dataField: '_source.attrs.reason',
            editable: false,
            headerStyle: { width: getColumnWidth("REASON", width) },
            sort: true,
            hidden: hidden,
            text: 'REASON',
            formatter: (cell, obj) => {
                var ob = obj._source;
                let reason = ob.attrs.reason;
                if (ob.attrs.type === "parse-error") {
                    reason = ob.err_info;
                }
                return <span className="filterToggleActive"><div className="filterToggle">
                    <span><img onClick={() => copyToclipboard(reason)} className="icon" title="copy to clipboard" alt="clipboardIcon" src={clipboardIcon} />
                        <span id={"copyToClipboardText" + reason} className="copyToClip">copied to clipboard</span></span>
                </div>{reason}
                </span>
            }
        }
        case 'exceeded': return {
            dataField: '_source.exceeded',
            text: 'EXCEEDED',
            sort: true,
            hidden: hidden,
            editable: false,
            headerStyle: { width: getColumnWidth("EXCEEDED", width) },
            formatter: (cell, obj) => {
                var ob = obj._source;
                var value = "";
                var notvalue = "";
                if (Array.isArray(ob.exceeded)) {
                    for (var i = 0; i < ob.exceeded.length; i++) {
                        if (i === 0) {
                            value = "exceeded: " + ob.exceeded[i];
                            notvalue = "NOT (exceeded: " + ob.exceeded[i];
                        }
                        else {
                            value = value + " AND exceeded:" + ob.exceeded[i];
                            notvalue = notvalue + " AND exceeded:" + ob.exceeded[i];
                        }
                    }
                    notvalue = notvalue + ")";

                }
                else {
                    value = "exceeded: " + ob.exceeded;
                    notvalue = "NOT exceeded: " + ob.exceeded;
                }
                var exceededName = ob.exceeded ? ob.exceeded.toString() : "";
                return <ExceededName data={exceededName} notvalue={notvalue} value={value} doFilterRaw={doFilterRaw}></ExceededName>
            }
        }
        //array format concat
        case 'exceeded-by': return {
            dataField: '_source.exceeded-by',
            text: 'EXCEEDED BY',
            sort: true,
            hidden: hidden,
            editable: false,
            headerStyle: { width: getColumnWidth("EXCEEDED BY", width) },
            formatter: (cell, obj) => {

                var ob = obj._source;
                if (ob["exceeded-by"]) {
                    if (Array.isArray(ob["exceeded-by"])) {
                        var value = "";
                        var notvalue = "";
                        for (var i = 0; i < ob["exceeded-by"].length; i++) {
                            if (i === 0) {
                                value = "exceeded-by: " + ob["exceeded-by"][i];
                                notvalue = "NOT (exceeded-by: " + ob["exceeded-by"][i];
                            }
                            else {
                                value = value + " AND exceeded-by:" + ob["exceeded-by"][i];
                                notvalue = notvalue + " AND exceeded-by:" + ob["exceeded-by"][i];
                            }
                        }
                        notvalue = notvalue + ")";
                    }
                    else {
                        value = "exceeded-by: " + ob["exceeded-by"];
                        notvalue = "NOT exceeded-by: " + ob["exceeded-by"];
                    }
                    return <span className="filterToggleActive"><div className="filterToggle">
                        <img onClick={doFilterRaw} field="exceeded-by" value={value} className="icon" alt="filterIcon" src={filterIcon} />
                        <img field="exceeded-by" value={notvalue} onClick={doFilterRaw} className="icon" alt="unfilterIcon" src={unfilterIcon} /></div > {ob['exceeded-by'] ? ob['exceeded-by'].toString() : ""}
                    </span>
                }
            }
        }
        //translate severity: 0 - hight, 1 - medium, 2 - low
        case 'severity': return {
            dataField: '_source.severity',
            text: 'SEVERITY',
            sort: true,
            editable: false,
            hidden: hidden,
            headerStyle: { width: getColumnWidth("SEVERITY", width) },
            formatter: (cell, obj) => {
                var ob = obj._source;
                return <span className="filterToggleActive"><div className="filterToggle">
                    <img onClick={doFilter} field="severity" value={ob.severity} className="icon" title="filter" alt="filterIcon" src={filterIcon} />
                    <img field="severity" value={ob.severity} onClick={doUnfilter} className="icon" title="unfilter" alt="unfilterIcon" src={unfilterIcon} />
                    <span><img onClick={() => copyToclipboard(ob.severity)} className="icon" title="copy to clipboard" alt="clipboardIcon" src={clipboardIcon} /><span id={"copyToClipboardText" + ob.severity} className="copyToClip">copied to clipboard</span></span>
                </div >{ob.severity === 0 ? "high" : ob.severity === 1 ? "medium" : "low"}
                </span>
            }
        }
        //special time format
        case 'attrs.duration': return {
            dataField: '_source.attrs.duration',
            text: 'DURATION',
            sort: true,
            editable: false,
            hidden: hidden,
            headerStyle: { width: getColumnWidth("DURATION", width) },
            formatter: (cell, obj) => {
                var ob = obj._source;
                return <span className="filterToggleActive"><div className="filterToggle">
                    <img onClick={doFilter} field="attrs.duration" value={ob.attrs.duration} className="icon" title="filter" alt="filterIcon" src={filterIcon} />
                    <img field="attrs.duration" value={ob.attrs.duration} onClick={doUnfilter} className="icon" title="unfilter" alt="unfilterIcon" src={unfilterIcon} />
                    <span><img onClick={() => copyToclipboard(ob.attrs.duration)} className="icon" title="copy to clipboard" alt="clipboardIcon" src={clipboardIcon} /><span id={"copyToClipboardText" + ob.attrs.duration} className="copyToClip">copied to clipboard</span></span>
                </div >{formatDuration(ob.attrs.duration)}
                </span>
            }
        }
        case 'attrs.tags': return {
            dataField: '_source.attrs.tags',
            text: 'TAGS',
            sort: true,
            hidden: hidden,
            headerStyle: { width: '150px !important' },
            editorRenderer: (editorProps, value, row, column, rowIndex, columnIndex) => (
                <TagRanger tags={tags} row={row} />
            ),
            formatter: (cell, obj) => {
                var ob = obj._source;
                return <span className="filterToggleActive"><div className="filterToggle">
                    <img onClick={doFilter} field="attrs.tags" value={ob.attrs.tags} className="icon" alt="filterIcon" src={filterIcon} />
                    <img field="attrs.tags" value={ob.attrs.tags} onClick={doUnfilter} className="icon" alt="unfilterIcon" src={unfilterIcon} /></div > {ob.attrs.tags ? ob.attrs.tags.toString() : []}
                </span>
            }
        }
        //different color
        case 'attrs.rtp-MOScqex-avg': return {
            dataField: '_source.attrs.rtp-MOScqex-avg',
            text: 'AVG QoS',
            sort: true,
            hidden: hidden,
            headerStyle: { width: getColumnWidth("AVG QoS", width) },
            editable: false,
            formatter: (cell, obj) => { 
                const value = obj?._source?.attrs["rtp-MOScqex-avg"];
                return <span className="filterToggleActive" 
                    style={{ color: (cell <= 3) ? "red" : "" }}>
                    {value && value.toString()}
                </span>
            }
        }
        case 'advanced': return {
            dataField: '_source',
            text: column_name.name.toUpperCase(),
            headerStyle: { width: "150px" },
            editable: false,
            formatter: (cell, obj) => {
                var ob = obj._source;
                if (!obj._source) {
                    ob = obj;
                }

                //remove _attr
                const iterate = (obj) => {
                    Object.keys(obj).forEach(key => {
                        if (key.startsWith("_")) {
                            delete obj[key];
                        }
                        if (typeof obj[key] === 'object' && obj[key] !== null) {
                            iterate(obj[key])
                        }
                    })

                    return obj;
                }
                ob = iterate(JSON.parse(JSON.stringify(ob)));


                return <span>
                    {(ob.attrs && ob.attrs.filenameDownload && column_name.icons.includes("download")) &&
                        <button className="noFormatButton" onClick={getPcap} file={ob.attrs.filenameDownload}>  <img className="icon" alt="downloadIcon" src={downloadPcapIcon} title="download PCAP" /></button>
                    }

                    {(ob.attrs && ob.attrs.filenameDownload && column_name.icons.includes("downloadAll")) &&
                        <button className="noFormatButton" onClick={() => downloadAll(ob)} file={ob.attrs.filenameDownload} data={obj}>  <img className="icon" alt="downloadIcon" src={downloadIcon} title="download all" /></button>
                    }
                    {(ob.attrs && ob.attrs.filenameDownload && column_name.icons.includes("diagram") && !user.aws) && <a href={"/sequenceDiagram/" + ob.attrs.filenameDownload} target="_blank" rel="noopener noreferrer"><img className="icon" alt="viewIcon" src={viewIcon} title="view PCAP" /></a>}
                    {(ob.dbg && ob.dbg.msg_trace && column_name.icons.includes("diagram")) && <Popup trigger={<img className="icon" alt="viewIcon" src={viewIcon} title="diagram" />} modal>
                        {close => (
                            <div className="Advanced">
                                <button className="close" onClick={close}>
                                    &times;
                                </button>
                                <div className="contentAdvanced" style={{ "padding": "0px" }}>
                                    <SimpleSequenceDiagram data={ob} />
                                </div>
                            </div>
                        )}
                    </Popup>
                    }
                    {(user.aws && user.jwt !== 0 && window.location.pathname.includes("/alerts")) && <Popup trigger={<img className="icon" data={obj} alt="suppressIcon" src={suppressIcon} title="suppress alert" />} modal>
                        {close => (
                            <div className="Advanced">
                                <button className="close" onClick={close}>
                                    &times;
                                </button>
                                <div className="contentAdvanced" style={{ "padding": "35px" }}>
                                    <p>Are you sure, you want to suppress {ob.alert.desc} for key <b>{ob.alert.key.name}</b></p>
                                    <p>and value <b>{ob.alert.key.value}</b>?</p>
                                    <button className="btn btn-primary shadow" style={{ "marginLeft": "40%", "marginTop": "6px" }} onClick={() => supressAlert(ob)} data={obj}> Yes </button>
                                </div>
                            </div>
                        )}
                    </Popup>
                    }
                    {user.aws && (window.location.pathname.includes("/exceeded") || window.location.pathname.includes("/alerts")) &&
                        <button className="noFormatButton" onClick={() => window.tableChart.createFilterAndRedirect(obj)} data={obj}>  <img className="icon" alt="cause analysis redirect" src={overviewIcon} title="show records in cause analysis" /></button>
                    }
                    {column_name.icons.includes("details") && <Popup trigger={<img className="icon" alt="detailsIcon" src={detailsIcon} title="details" />} modal>
                        {close => (
                            <div className="Advanced">
                                <button className="link close" onClick={() => exportJSON(ob)} style={{ "position": "absolute", "right": "40px" }}>
                                    <img className="icon" alt="downloadIcon" src={downloadIcon} title="download json" />
                                </button>
                                <span>
                                    <button className="link close" onClick={() => copyToclipboard(JSON.stringify(ob), "Details")} style={{ "position": "absolute", "right": "65px" }}>
                                        <img className="icon" alt="clipboardIcon" src={clipboardIcon} title="copy to clipboard" />
                                    </button>
                                    <span id={"copyToClipboardTextDetails"} className="copyToClip" style={{ "position": "absolute", "right": "22px", "top": "18px" }}>copied to clipboard</span>
                                </span>
                                <button className="close" onClick={close}>
                                    &times;
                                </button>
                                <div className="contentAdvanced">
                                    <pre> <div onClick={clickHandlerHTML} dangerouslySetInnerHTML={{ __html: syntaxHighlight(ob) }} /></pre>

                                </div>
                            </div>
                        )}
                    </Popup>
                    }
                    {(obj._id && column_name.icons.includes("share")) && !window.location.pathname.includes("/profiles") &&
                        <button className="noFormatButton" onClick={() => shareEvent(obj._id)}>  <img className="icon" alt="shareIcon" src={shareIcon} title="copy event link to share" /><span id={"tooltipshareFilter" + obj._id} style={{ "display": "none", "marginTop": "8px", "position": "absolute", "backgroundColor": "white" }}>Copied to clipboard</span></button>
                    }

                </span>
            }
        }

        //default case with searchable icons and not searchable
        default:
            //fnc case - round
            if (attrsTypes[column_name.source] && attrsTypes[column_name.source] === "round") {
                return {
                    dataField: '_source.' + column_name.source,
                    text: column_name ? column_name.name.toUpperCase() : "",
                    sort: true,
                    hidden: hidden,
                    editable: false,
                    headerStyle: { width: getColumnWidth(column_name.source, width) },
                    formatter: (cell, obj) => {
                        var ob = obj._source[column_name.source]
                        if (ob) {
                            return Math.round(ob * 100) / 100;
                        }
                        return 0;
                    }
                }
            }
            //time format
            else if ((attrsTypes[column_name.source] && attrsTypes[column_name.source] === "time") || column_name.source.includes("TS")) {
                let dataPath = "_source.";
                if (window.location.pathname === "/profiles") {
                    dataPath = "";
                }

                let dataField = dataPath + column_name.source;
       
                return {
                    dataField: dataField,
                    text: column_name ? column_name.name.toUpperCase() : "",
                    editable: false,
                    sort: true,
                    hidden: hidden,
                    headerStyle: { width: getColumnWidth(column_name.source, width) },
                    formatter: (cell, obj) => {
                        if (cell) {
                            if (parseTimestamp(cell) !== "Invalid date") {
                                return parseTimestamp(cell)
                            }
                            else {
                                return parseTimestamp(new Date(parseInt(cell)));
                            }
                        }
                    }
                }
            }
            else if (getSearchableAttributes().includes(column_name.source)) {
                let col = {
                    dataField: '_source.' + column_name.source,
                    text: column_name ? column_name.name.toUpperCase() : "",
                    editable: false,
                    sort: true,
                    hidden: hidden,
                    headerStyle: { width: getColumnWidth(column_name.source, width) },
                    formatter: (cell, obj) => {
                        var ob = obj._source;
                        try {
                            var value = column_name.source.split('.').reduce((o, i) => o[i], ob);
                        }
                        catch { }
                        var field = column_name.source;
                        if (field === "attrs.from" || field === "attrs.to") {
                            field = field + ".keyword";
                        }

                        let isEncrypted = false;
                        if (ob.encrypt) {
                            isEncrypted = isEncryptedAttr(field, ob.encrypt);
                        }
                        if (value) {
                            return <span className="filterToggleActive" style={{ "color": isEncrypted ? "darkred" : "#212529" }}>
                                <div className="filterToggle">
                                    <img onClick={doFilter} field={field} value={value} className="icon" title="filter" alt="filterIcon" src={filterIcon} />
                                    <img field={field} value={value} onClick={doUnfilter} className="icon" title="unfilter" alt="unfilterIcon" src={unfilterIcon} />
                                    <span><img onClick={() => copyToclipboard(value)} className="icon" title="copy to clipboard" alt="clipboardIcon" src={clipboardIcon} /><span id={"copyToClipboardText" + value} className="copyToClip">copied to clipboard</span></span>
                                </div >{value}
                                {field === "attrs.source" && user.aws && (window.location.pathname.includes("/alerts") || window.location.pathname.includes("/overview")) && <BLcheck data={ob} />}
                            </span>
                        }
                    }
                }

                //encrypt state
                if (profile && profile[0] && profile[0].userprefs.mode === "encrypt") {
                    col.onSort = (field, order) => {
                        window.tableChart.orderDecrypt(field, order);
                    };

                    col.sortFunc = (a, b, order, dataField, rowA, rowB) => {
                        return true;
                    }

                    return col;
                }
                else {
                    return col;
                }
            }
            else {
                let dataPath = '_source.';
                if (window.location.pathname === "/profiles") {
                    dataPath = "";
                }

                let dataField = dataPath + column_name.source;

                let col = {
                    dataField: dataField,
                    text: column_name ? column_name.name.toUpperCase() : "",
                    editable: false,
                    sort: true,
                    hidden: hidden,
                    headerStyle: { width: getColumnWidth(column_name.source, width) },
                    formatter: (cell, obj) => {
                        var ob = obj[dataPath];
                        var field = column_name.source;
                        let isEncrypted = false;
                        if (ob && ob.encrypt) {
                            isEncrypted = isEncryptedAttr(field, ob.encrypt);
                        }
                        return <span style={{ "color": isEncrypted ? "darkred" : "#212529" }}>{cell}</span>
                    }
                }
                //encrypt state
                if (profile && profile[0] && profile[0].userprefs.mode === "encrypt") {
                    col.onSort = (field, order) => {
                        window.tableChart.orderDecrypt(field, order);
                    };

                    col.sortFunc = (a, b, order, dataField, rowA, rowB) => {
                        return true;
                    }

                    return col;
                }
                else {
                    return col;
                }
            }
    }
}

export function tableColumns(dashboard, tags, layout) {
    //check browser local storage
    var storedColumns = JSON.parse(window.localStorage.getItem("columns"));
    var result = [];

    var name = dashboard;
    if (!name) {
        if (dashboard === "homeLoginCalls") name = "calls";
        if (dashboard === "exceeded") name = "exceeded";
    }
    //get also layout and compare it
    var columnsTableDefault = (layout.columns[name] ? layout.columns[name] : layout.columns.default) ?? [];
    var toggleListDefault = layout.toggleList[name] ? layout.toggleList[name] : layout.toggleList.default;
    var columnsTableDefaultListConcat = JSON.parse(JSON.stringify(columnsTableDefault ?? "[]"));

    //everything from table is visible
    if (columnsTableDefaultListConcat) {
        for (let hit of columnsTableDefaultListConcat) {
            hit.hidden = false;
        }
    }

    if (name !== "domains" && dashboard !== "modeChanges" && toggleListDefault) {
        for (let toggleHit of toggleListDefault) {
            let isExist = false;
            for (let hit of columnsTableDefault) {
                if (toggleHit.source === hit.source) {
                    isExist = true;
                }
            }
            if (!isExist) {
                columnsTableDefaultListConcat.push(toggleHit);
            }
        }
    }

    if (storedColumns && storedColumns[dashboard] && storedColumns.version && storedColumns.version === "1.0") {
        storedColumns = storedColumns[dashboard];
        for (let i = 0; i < columnsTableDefaultListConcat.length; i++) {
            //check if this column was stored, if so use the parameraters
            var isExists = false
            var field = null;
            var tag = null;
            for (var fields of storedColumns) {
                if ("_source." + columnsTableDefaultListConcat[i].source === fields.dataField) {
                    isExists = true;
                    field = fields;
                }
            }
            if (isExists) {
                var width = field.headerStyle && field.headerStyle.width ? field.headerStyle.width : null;
                var hidden = field.hidden ? field.hidden : false;
                var source = field.text === "ADVANCED" ? "advanced" : field.dataField.slice(8);
                result.push(getColumn({ source: source, name: field.text, "icons": ["download", "diagram", "details", "share"] }, tags, tag, width, hidden, dashboard));
            }
            else {
                let name = columnsTableDefaultListConcat[i].name ? columnsTableDefaultListConcat[i].name : columnsTableDefaultListConcat[i];
                let source = columnsTableDefaultListConcat[i].source ? columnsTableDefaultListConcat[i].source : columnsTableDefaultListConcat[i];
                let hidden = columnsTableDefaultListConcat[i].hasOwnProperty("hidden") ? columnsTableDefaultListConcat[i].hidden : false;
                result.push(getColumn({ source: source, name: name, "icons": ["download", "diagram", "details", "share"] }, tags, tag, width = "50px", hidden, dashboard));
            }
        }
        return result;
    }
    else {
        if (window.localStorage.getItem("columns") && (!storedColumns.version || storedColumns.version !== "1.0")) {
            window.localStorage.removeItem("columns");
        }
        tag = true;
        //disable tags for end user
        if (store.getState().persistent.user.jwt === "2") { tag = false };

        for (let i = 0; i < columnsTableDefaultListConcat.length; i++) {
            let name = columnsTableDefaultListConcat[i].name ? columnsTableDefaultListConcat[i].name : columnsTableDefaultListConcat[i];
            let source = columnsTableDefaultListConcat[i].source ? columnsTableDefaultListConcat[i].source : columnsTableDefaultListConcat[i];
            let hidden = columnsTableDefaultListConcat[i].hasOwnProperty("hidden") ? columnsTableDefaultListConcat[i].hidden : true;
            result.push(getColumn({ source: source, name: name, "icons": ["download", "diagram", "details", "share"] }, tags, tag = null, width = "150px", hidden, dashboard));
        }

        return result;
    }
}
