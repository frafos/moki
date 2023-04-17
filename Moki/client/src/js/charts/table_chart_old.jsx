
/*
Get call table

it is seperate request from call charts
*/
import React, { Component } from 'react';
// import BootstrapTable from '@moki-client/react-bootstrap-table-next';
// import paginationFactory from 'react-bootstrap-table-next/lib/';
// import ToolkitProvider from 'react-bootstrap-table2-toolkit';
import Datetime from 'react-datetime';
import { Navigate } from 'react-router';
import { getSearchableAttributes, getDisplayedAttributes, 
    isEncryptedAttr, createFilter, getCategory, elasticsearchConnection } from '../../gui';
import { decryptTableHits, decryptAttr } from '../../es-response-parser';
import AdvancedProfile from "../helpers/advancedProfile";
import storePersistent from "../store/indexPersistent";
import store from "../store/index";
import { downloadPcap } from '../helpers/download/downloadPcap';
import { downloadSD } from '../helpers/download/downloadSD';
import { tableColumns } from '../helpers/TableColumns';
import { getPcap } from '../helpers/getPcap.js';
import { downloadPcapMerged } from '../helpers/download/downloadPcapMerged';
import { parseTimestamp } from "../helpers/parseTimestamp";
import querySrv from '../helpers/querySrv';

import shareIcon from "/icons/share_dark.png";
import downloadPcapIcon from "/icons/downloadPcap.png";
import viewIcon from "/icons/view.png";
import filter from "/icons/filter.png";
import unfilter from "/icons/unfilter.png";
import emptyIcon from "/icons/empty_small.png";
import downloadIcon from "/icons/download.png";
import resetIcon from "/icons/disable_grey.png";

const NOT_EXPAND_OR_COLUMNS_SELECTION = ["LAST LOGIN EVENTS", "LAST MODE CHANGES"];

import FileSaver from "file-saver";
import JSZip from "jszip";

export default class listChart extends Component {
    constructor(props) {
        super(props);
        var layout = storePersistent.getState().layout.table;
        const columns = tableColumns(this.props.name, this.props.tags, layout);
        //if there is settings with min pages, use it
        var count = 10;
        var aws = storePersistent.getState().user.aws;
        if (aws !== true) {
            if (storePersistent.getState().settings.length > 0) {
                for (var i = 0; i < storePersistent.getState().settings[0].attrs.length; i++) {
                    if (storePersistent.getState().settings[0].attrs[i].attribute === "eventTableCount") {
                        count = storePersistent.getState().settings[0].attrs[i].value;
                    }
                }
            }
        }
        this.state = {
            columns: columns,
            data: [],
            dataEncrypted: [],
            excludeList: [],
            selectedRowsList: [],
            tags: this.props.tags,
            checkall: false,
            selected: [],
            redirect: false,
            redirectLink: "/causeAnalysis",
            count: count,
            page: 1,
            decryptAttrs: [],
            seenPages: [1],
            timestamp_gte: (Math.round(new Date().getTime() / 1000) - (6 * 3600)) * 1000,
            timestamp_lte: (Math.round(new Date().getTime() / 1000)) * 1000,
        }

        this.chartRef = React.createRef();

        this.filter = this.filter.bind(this);
        this.unfilter = this.unfilter.bind(this);
        this.tags = this.tags.bind(this);
        this.movetooltip = this.movetooltip.bind(this);
        this.onEnterKey = this.onEnterKey.bind(this);
        this.handleOnSelect = this.handleOnSelect.bind(this);
        this.handleOnSelectAll = this.handleOnSelectAll.bind(this);
        this.getRecord = this.getRecord.bind(this);
        this.resizableGrid = this.resizableGrid.bind(this);
        this.orderDecrypt = this.orderDecrypt.bind(this);
        this.focousOutLte = this.focousOutLte.bind(this);
        this.focousOutGte = this.focousOutGte.bind(this);
        this.focousSaveOutLte = this.focousSaveOutLte.bind(this);
        this.focousSaveOutGte = this.focousSaveOutGte.bind(this);
        window.tableChart = this;
    }

    async UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.data !== this.state.data) {
            this.setState({ data: nextProps.data, total: nextProps.total });
            let copy = JSON.parse(JSON.stringify(nextProps.data));
            let parseData = await decryptTableHits(copy, storePersistent.getState().profile, this.state.count, this.state.page, this.state.decryptAttrs);
            this.setState({
                data: parseData,
                seenPages: [this.state.page],
                total: nextProps.total,
                dataEncrypted: this.props.data
            });

        }
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.data !== this.props.data) {
            if (this.props.type !== "raw") {
                let copy = JSON.parse(JSON.stringify(this.props.data));
                let parseData = await decryptTableHits(copy, storePersistent.getState().profile, this.state.count, this.state.page, this.state.decryptAttrs);
                this.setState({
                    data: parseData,
                    seenPages: [this.state.page],
                    dataEncrypted: this.props.data
                });
            }
            else {
                this.setState({
                    data: this.props.data,
                    seenPages: [this.state.page],
                    dataEncrypted: this.props.data
                });
            }
        }

        var table = this.chartRef.current?.getElementsByClassName('table table-hover')[0];
        if (table) {
            this.resizableGrid(table);
        }
    }

    orderDecrypt(field, order) {
        function compareStrings(field, order) {
            return function (a, b) {
                a = eval("a." + field);
                b = eval("b." + field);
                // Assuming you want case-insensitive comparison
                if (!a) return -1;
                if (!b) return -1;

                a = a.toLowerCase();
                b = b.toLowerCase();

                if (order === "desc") {
                    return (a < b) ? -1 : (a > b) ? 1 : 0;
                }
                else {
                    return (a > b) ? -1 : (a < b) ? 1 : 0;
                }
            }
        }
        this.setState({
            decryptAttrs: [field.replace('_source.', '')],
            seenPages: []
        }, async function () {
            let copy = JSON.parse(JSON.stringify(this.state.dataEncrypted));
            let decryptAttrData = await decryptAttr(copy, storePersistent.getState().profile, field);
            decryptAttrData.sort(compareStrings(field, order));
            let parseData = await decryptTableHits(decryptAttrData, storePersistent.getState().profile, this.state.count, this.state.page, this.state.decryptAttrs);
            this.setState({
                data: parseData,
                seenPages: [this.state.page]
            });

        });

    }



    //create exceeded-by filter and redirect to overview
    createFilterAndRedirect(ob) {
        let obj = ob._source;
        this.setState({
            redirect: true,
            redirectLink: "/causeAnalysis?event_id=" + ob._id + "&timestamp=" + obj["@timestamp"]
        });
    }

    //add resizable grid to table, function from https://www.brainbell.com/javascript/making-resizable-table-js.html
    resizableGrid(table) {
        var thiss = this;
        var row = table.getElementsByTagName('tr')[0],
            cols = row ? row.children : undefined;
        if (!cols) return;

        table.style.overflow = 'hidden';

        var tableHeight = table.offsetHeight;
        for (var i = 0; i < cols.length; i++) {
            if (cols[i].querySelector(':scope > div')) continue;                // do not add the resizable element if the column already contains it
            if (cols[i].classList.contains('expand-cell-header')) continue;     // do not add the resizable element to expand column
            if (cols[i].classList.contains('selection-cell-header')) continue;  // do not add the resizable element to selection column

            var div = createDiv(tableHeight);
            cols[i].appendChild(div);
            cols[i].style.position = 'relative';
            setListeners(div);
        }
        function setListeners(div) {

            var pageX, curCol, nxtCol, curColWidth, nxtColWidth;

            div.addEventListener('mousedown', function (e) {
                e.stopPropagation();
                curCol = e.target.parentElement;
                nxtCol = curCol.nextElementSibling;
                pageX = e.pageX;

                var padding = paddingDiff(curCol);

                curColWidth = curCol.offsetWidth - padding;
                if (nxtCol)
                    nxtColWidth = nxtCol.offsetWidth - padding;
            });

            div.addEventListener('mouseover', function (e) {
                e.target.style.borderRight = '4px solid #30427f';
            })

            div.addEventListener('mouseout', function (e) {
                e.target.style.borderRight = '';
            })
            document.addEventListener('mousemove', function (e) {
                if (curCol) {
                    var diffX = e.pageX - pageX;
                    if (curColWidth + diffX > 80 && curColWidth + diffX < 400) {
                        if (nxtCol && nxtColWidth - (diffX) > 80) {
                            nxtCol.style.width = (nxtColWidth - (diffX)) + 'px';
                            curCol.style.width = (curColWidth + diffX) + 'px';
                        }
                    }
                }
            });

            document.addEventListener('mouseup', function (e) {
                //store column width in browser localstorage
                if (curCol) {
                    var width = curCol.style.width;
                    var column = curCol.innerHTML.substr(0, curCol.innerHTML.indexOf("<"));
                    var columns = JSON.parse(window.localStorage.getItem("columns"));
                    var dashboard = window.location.pathname.substring(1);
                    if (!columns) {
                        columns = { "version": "1.0" };
                    }

                    var result = JSON.parse(JSON.stringify(thiss.state.columns));

                    for (let hit of result) {
                        if (hit.text === column) {
                            hit.headerStyle.width = width;
                        }
                    }

                    var stateColumns = thiss.state.columns;
                    for (let hit of stateColumns) {
                        if (hit.text === column) {
                            hit.headerStyle.width = width;
                        }
                    }
                    thiss.setState({ columns: stateColumns });
                    columns[dashboard] = result;

                    window.localStorage.setItem("columns", JSON.stringify(columns));
                }
                curCol = undefined;
                nxtCol = undefined;
                pageX = undefined;
                nxtColWidth = undefined;
                curColWidth = undefined
            });
        } function createDiv(height) {
            var div = document.createElement('div');
            div.className = "resize";
            div.style.top = 0;
            div.style.right = 0;
            div.style.width = '50px';
            div.style.position = 'absolute';
            div.style.cursor = 'col-resize';
            div.style.userSelect = 'none';
            div.style.height = height + 'px';
            return div;
        }

        function paddingDiff(col) {

            if (getStyleVal(col, 'box-sizing') === 'border-box') {
                return 0;
            }
            var padLeft = getStyleVal(col, 'padding-left');
            var padRight = getStyleVal(col, 'padding-right');
            return (parseInt(padLeft) + parseInt(padRight));

        }

        function getStyleVal(elm, css) {
            return (window.getComputedStyle(elm, null).getPropertyValue(css))
        }
    }

    //insert columns into table
    async componentDidMount() {
        //store already exclude alarms list
        if (window.location.pathname === "/exceeded" || window.location.pathname === "/alerts") {
            try {
                const response = await querySrv(import.meta.env.BAE_URL + "api/setting", {
                    method: "GET",
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": "include"
                    }
                });
                var jsonData = await response.json();
                var thiss = this;
                jsonData.forEach(data => {
                    if (data.app === "m_alarms")
                        thiss.setState({ excludeList: data.attrs });
                });
            } catch (error) {
                console.error(error);
                alert("Problem with receiving alarms data. " + error);
            }
        }

        var table = this.chartRef.current?.getElementsByClassName('table table-hover')[0];
        if (table) {
            this.resizableGrid(table);
        }
    }

    //check if alarms is already exclude -> don't display exclude icon
    isAlreadyExclude(ob) {
        var excludeList = this.state.excludeList;
        for (var i = 0; i < excludeList.length; i++) {
            //ob.exceeded + "_exclude" === excludeList[i].attribute
            var filterExclude = ob.exceeded.filter(ex => ex + "_exclude" === excludeList[i].attribute);
            if (excludeList[i].attribute === ob.exceeded + "_exclude" || (Array.isArray(ob.exceeded) && filterExclude.length > 0)) {
                if (excludeList[i].category === "URI") {
                    if (excludeList[i].value.includes(ob.attrs.from)) return true;
                }
            } else if (excludeList[i].category === "IP") {
                if (excludeList[i].value.includes(ob.attrs.source)) return true;
            }
        }
        return false;

    }

    //filter
    filter(event) {
        createFilter(event.currentTarget.getAttribute('field') + ":\"" + event.currentTarget.getAttribute('value') + "\"");
    }

    //unfilter
    unfilter(event) {
        createFilter("NOT " + event.currentTarget.getAttribute('field') + ":\"" + event.currentTarget.getAttribute('value') + "\"");
    }

    //moving tooltip according cursor position
    movetooltip(e) {
        var x = e.clientX;
        var y = e.clientY;

        //Set tooltip position according to mouse position
        e.currentTarget.style.top = (y + 20) + 'px';
        e.currentTarget.style.left = (x + 20) + 'px';

    }

    onEnterKey(event) {
        if (event.keyCode === 13) {
            this.tags();
        }
    }

    //reset table layout - delete it from localstorage
    resetLayout() {
        let storedColumns = JSON.parse(window.localStorage.getItem("columns"));
        let name = window.location.pathname.substring(1);

        if (storedColumns && storedColumns[name]) {
            delete storedColumns[name];
            window.localStorage.setItem("columns", JSON.stringify(storedColumns));
            window.location.reload();
        }
    }


    getRecord(id) {
        var data = this.state.data;
        for (var i = 0; i < data.length; i++) {
            if (data[i]._id === id) return data[i];
        }
    }

    focousOutLte(value) {
        this.setState({ timestamp_lte: value });
    }

    focousOutGte(value) {
        this.setState({ timestamp_gte: value });
    }

    focousSaveOutGte(value) {
        this.setState({ timestamp_gte: value });
        this.props.getApiLogs(value, this.state.timestamp_lte);
    }

    focousSaveOutLte(value) {
        this.setState({ timestamp_lte: value });
        this.props.getApiLogs(this.state.timestamp_gte, value);
    }

    //add tags to event
    async tags() {
        var selected = this.state.selected;
        var tag = document.getElementById("tag").value;
        var result;
        if (selected.length === 0) {
            alert("You must check events to tag.");
        }
        else {
            for (var i = 0; i < selected.length; i++) {
                var record = this.getRecord(selected[i]);
                //previous tag exist
                if (record['_source']['attrs']['tags']) {
                    var tags = record['_source']['attrs']['tags'] + "," + tag.toString();
                    result = await elasticsearchConnection(import.meta.env.BASE_URL + "api/tag", { id: record['_id'], index: record['_index'], tags: tags });
                }
                else {
                    result = await elasticsearchConnection(import.meta.env.BASE_URL + "api/tag", { id: record['_id'], index: record['_index'], tags: tag });
                }
                console.info("Tagging event");
                console.info(result);
            }
            //get rid of race condition by waiting before getting new data again
            if (result.result && result.result === "updated") {
                setTimeout(function () {
                    //alert("Tag has been saved.");
                    document.getElementById("popupTag").style.display = "none";
                    document.getElementById("tag").value = "";
                    document.getElementsByClassName("iconReload")[0].click();
                }, 1000);
            }
            else {
                alert(result);
            }
        }
    }

    //create filter based on checked event ids
    async shareFilters() {
        var selected = this.state.selected;
        if (selected.length === 0) {
            alert("You must check events to share them.");
        }
        else if (selected.length > 20) {
            alert("You must check less than 20 events to share them. Otherwise use filter sharing.");
        }
        else {
            let href = window.location.origin + window.location.pathname + "?from=" + store.getState().timerange[0] + "&to=" + store.getState().timerange[1];
            href = href + "&filter=";
            for (var i = 0; i < selected.length; i++) {
                href = href + "_id:" + selected[i];
                if (i < selected.length - 1) {
                    href = href + " OR ";
                }
            }

            //put it into clipboard
            let dummy = document.createElement("textarea");
            document.body.appendChild(dummy);
            dummy.value = href
            dummy.select();
            document.execCommand("copy");
            document.body.removeChild(dummy);
            document.getElementById("tooltipshareFilters").style.display = "inline";
            setTimeout(function () {
                document.getElementById("tooltipshareFilters").style.display = "none";
            }, 1000);
        }
    }


    openPopupTag() {
        document.getElementById("popupTag").style.display = "inline";
        document.getElementById("tag").focus();
    }

    closePopupTag() {
        document.getElementById("popupTag").style.display = "none";
    }

    isAdmin() {
        var aws = storePersistent.getState().user.aws;
        if (aws === true) {

            var user = document.getElementById("user").innerHTML;
            if (user.includes("ADMIN")) {
                return true;
            }
        }
        return false;
    }


    handleOnSelect(row, isSelect) {
        if (isSelect) {
            this.setState(() => ({
                selected: [...this.state.selected, row._id]
            }));
        } else {
            this.setState(() => ({
                selected: this.state.selected.filter(x => x !== row._id)
            }));
        }
    }

    handleOnSelectAll(isSelect, rows) {
        const ids = this.state.data.map(r => r._id);
        if (isSelect) {
            this.setState(() => ({
                selected: ids
            }));
        } else {
            this.setState(() => ({
                selected: []
            }));
        }
    }

    renderExpandRow(cell, value, isSearchable, category, attr) {
        let isEncrypted = false;
        if (attr.encrypt) {
            isEncrypted = isEncryptedAttr(category + "." + cell, attr.encrypt);
        }
        var style = { "color": isEncrypted ? "darkred" : "#212529" };
        //if  attrs.rtp-MOScqex-avg: [* TO 3] red
        //attrs.rtp-MOScqex-min : [* TO 2] red
        //attrs.rtp-lossmax: [25 TO *]  red
        //attrs.rtp-lossavg: [15 TO *] red
        //attrs.rtp-direction:'oneway'  red
        if ((cell === "rtp-MOScqex-avg" && value < 3) || (cell === "rtp-MOScqex-min" && value < 2) || (cell === "rtp-lossmax" && value > 25) || (cell === "rtp-lossavg" && value > 15) || (cell === "rtp-direction" && value === "oneway")) {
            return <p value={value}>
                <span className="spanTab">{cell}:</span>
                <span className="red">{value}</span>
            </p>
        }

        //attrs.to or attrs.from, use keyword
        if (cell === "from" || cell === "to") {
            return <p key={cell} field={"attrs." + cell + ".keyword"} value={value}>
                <span className="spanTab">{cell}: </span>
                <img onClick={this.filter} field={"attrs." + cell + ".keyword"} value={value} title="filter" className="icon" alt="filterIcon" src={filter} />
                <img field={"attrs." + cell + ".keyword"} value={value} onClick={this.unfilter} className="icon" alt="unfilterIcon" title="unfilter" src={unfilter} />
                <span className="spanTab" style={style} >{value}</span>
            </p>
        }

        //if filename make a link
        if (cell === "filename") {
            return <p value={value}> <span className="spanTab">{cell}: </span>
                <span className="tab">
                    <button className="noFormatButton" onClick={getPcap} file={value}>
                        <img className="icon" alt="downloadIcon" src={downloadPcapIcon} title="download PCAP" />
                    </button>
                    <a href={"/sequenceDiagram/" + value} target="_blank" rel="noopener noreferrer"><img className="icon" alt="viewIcon" src={viewIcon} title="view PCAP" /></a></span></p>
        }

        //if audio_file make download icon (only for call-end)
        if (cell === "audio_file") {
            return <p value={value}> <span className="spanTab">{cell}: </span>
                <span className="tab">
                    <a href={value} ><img className="icon" alt="wavIcon" title="download WAV" src={downloadIcon} /></a>
                </span></p>
        }

        //if  reg_expire make human-readable format
        if (cell === "reg_expire" || cell === "ua_expire") {
            return <p value={value}>
                <span className="spanTab">{cell}: </span>
                <span className="tab">{parseTimestamp(new Date(value * 1000))}</span>
            </p>
        }

        //special case: if filename contains "downloadWav" (only for recording) - make a wav link
        if (cell === "downloadWav") {
            return <p value={value}> <span className="spanTab">{cell}: </span>
                <span className="tab">
                    <a href={value} ><img className="icon" alt="wavIcon" title="download WAV" src={downloadIcon} /></a>
                </span></p>
        }

        //searchable fields with attrs
        if (getSearchableAttributes().includes("attrs." + cell)) {
            return <p key={cell} field={"attrs." + cell} value={value}>
                <span className="spanTab">{cell}: </span>
                <img onClick={this.filter} field={"attrs." + cell} value={value} title="filter" className="icon" alt="filterIcon" src={filter} />
                <img field={"attrs." + cell} value={value} onClick={this.unfilter} className="icon" alt="unfilterIcon" title="unfilter" src={unfilter} />
                <span className="spanTab" style={style} >{value}</span>
            </p>
        }

        //var*
        if (isSearchable) {
            return <p key={cell} field={"attrs.vars." + cell} value={value}>
                <span className="spanTab">{cell}: </span>
                <img onClick={this.filter} field={"attrs.vars." + cell} value={value} title="filter" className="icon" alt="filterIcon" src={filter} />
                <img field={"attrs.vars." + cell} value={value} onClick={this.unfilter} className="icon" alt="unfilterIcon" title="unfilter" src={unfilter} />
                <span className="spanTab" style={style} >{value}</span>
            </p>
        }

        return <p value={value} key={value}>
            <span className="spanTab">{cell}: </span>
            <span className="tab" style={style} >{value}</span>
        </p>
    }

    renderExpand(row, all = false) {
        var keys = Object.keys(row);
        var displayedAttrs = getDisplayedAttributes();
        var result = [];
        var categorySort = [];
        for (var i = 0; i < keys.length; i++) {
            if (all) {
                result.push(<p value={row[keys[i]]} key={keys[i]}>
                    <span className="spanTab">{keys[i]}{!["id", "_id", "key", "description"].includes(keys[i]) && window.location.pathname.includes("/profiles") && <AdvancedProfile obj={{"id": keys[i], "key": row.key, "supression": row.supression, "listmall": row.listmall}} />}: </span>
                    {typeof row[keys[i]] !== 'object' ?
                        <span>
                            {row[keys[i]]}
                        </span>
                        : <div className="tab"  >
                            {Object.keys(row[keys[i]]).map(key => (
                                <div className="tab" style={{ "paddingBottom": "3px" }}>
                                    {typeof row[keys[i]][key] === 'object' ? key + ": " + JSON.stringify(row[keys[i]][key]) : key + ": " + row[keys[i]][key]}
                                </div>
                            ))}
                        </div>}
                </p>)
            }
            else {
                if (keys[i] === "attrs") {
                    let attrs = Object.keys(row[keys[i]]);
                    for (let j = 0; j < attrs.length; j++) {
                        if (displayedAttrs.includes("attrs." + attrs[j])) {
                            let category = getCategory("attrs." + attrs[j]);
                            if (!categorySort[category]) categorySort[category] = [];
                            categorySort[category].push(this.renderExpandRow(attrs[j], row[keys[i]][attrs[j]], false, "attrs", row));
                        }

                        //custom variable in vars.* - render all and everything is searchable
                        if (attrs[j] === "vars") {
                            var variable = Object.keys(row[keys[i]][attrs[j]]);
                            for (let k = 0; k < variable.length; k++) {
                                let categoryInner = "VARS";
                                if (!categorySort[categoryInner]) categorySort[categoryInner] = [];
                                categorySort[categoryInner].push(this.renderExpandRow(variable[k], row[keys[i]][attrs[j]][variable[k]], true, "attrs.vars", row));
                            }
                        }
                    }

                }
                else if (keys[i] === "geoip") {
                    let attrs = Object.keys(row[keys[i]]);
                    for (let j = 0; j < attrs.length; j++) {
                        if (displayedAttrs.includes("geoip." + attrs[j])) {
                            let category = getCategory("geoip." + attrs[j]);
                            if (!categorySort[category]) categorySort[category] = [];
                            categorySort[category].push(this.renderExpandRow(attrs[j], row[keys[i]][attrs[j]], false, "geoip", row));
                        }
                    }

                }
                else {
                    if (displayedAttrs.includes(keys[i])) {
                        let category = getCategory(keys[i]);
                        if (!categorySort[category]) categorySort[category] = [];
                        categorySort[category].push(this.renderExpandRow(keys[i], row[keys[i]], false, "", row));
                    }
                }


                var categories = Object.keys(categorySort);
                //create div for each category
                for (i = 0; i < categories.length; i++) {
                    result.push(
                        <div key={categories[i]}><h3>{categories[i].toUpperCase()}</h3>
                            {categorySort[categories[i]]}
                        </div>
                    )
                }
            }
        }
        return result;

    }

    render() {
        var thiss = this;
        //download merge pcaps
        async function getPcaps(event) {
            var selectedData = thiss.state.selected;
            if (selectedData.length === 0) {
                alert("You must select PCAPs to merge.");
            } else {
                var pcaps = [];
                for (var i = 0; i < selectedData.length; i++) {
                    var record = thiss.getRecord(selectedData[i]);
                    if (record._source.attrs.filename) {
                        pcaps.push("/data/sbcsync/traffic_log/" + record._source.attrs.filename);
                    }
                }

                if (pcaps.length === 0) {
                    alert("You have to choose events with PCAP file.");
                } else if (pcaps.length > 10) {
                    alert("You can choose maximum 10 PCAPs.");
                }
                else {
                    await downloadPcapMerged(pcaps).then(function (data) {
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
            }

        }

        //download all with check
        async function downloadAllCheck() {
            var selectedData = thiss.state.selected;
            if (selectedData.length === 0) {
                alert("You have to choose events to download.");
            }
            else {
                if (selectedData.length > 10) {
                    document.getElementById("downloadAllTooltip").style.display = "inline";
                    setTimeout(function () {
                        document.getElementById("downloadAllTooltip").style.display = "none";
                    }, 2000);

                }
                var zip = new JSZip();

                for (var i = 0; i < selectedData.length; i++) {
                    var record = thiss.getRecord(selectedData[i]);
                    let isPcap = false;
                    var filename = selectedData[i];

                    // var filename = record._source && record._source.attrs && record._source.attrs.filename ? record._source.attrs.filename : selectedData[i];
                    if (record._source && record._source.attrs && record._source.attrs.filename) {
                        await downloadPcap(record._source.attrs.filename).then(function (data) {
                            if (typeof data !== 'string') {
                                filename = filename ? filename.substring(filename.lastIndexOf("/") + 1) : selectedData[i];
                                var blob = new Blob([data], { type: "pcap" });
                                isPcap = true;
                                zip.file(filename + ".pcap", blob);
                            }
                        })
                    }

                    //download sd
                    if (record._source && record._source.attrs && record._source.attrs.filename && isPcap) {
                        var sd = await downloadSD(record._source.attrs.filename);
                        if (sd && (!sd.includes("Error") || !sd.includes("error"))) {
                            zip.file(filename + ".html", sd);
                        }
                    }

                    var json = new Blob([JSON.stringify(record)], { type: 'text/plain' });
                    zip.file(filename + ".json", json);

                }
                zip.generateAsync({ type: "blob" })
                    .then(function (blob) {
                        FileSaver.saveAs(blob, "export.zip");
                    });
            }
        }

        //display merge pcaps
        function displayPcaps(event) {
            var selectedData = thiss.state.selected;
            var pcaps = [];
            for (var i = 0; i < selectedData.length; i++) {
                var record = thiss.getRecord(selectedData[i]);
                if (record._source.attrs.filename) {
                    pcaps.push("/data/sbcsync/traffic_log/" + record._source.attrs.filename);
                }
            }
            if (pcaps.length === 0) {
                alert("You have to choose events with PCAP file.");
            } else if (pcaps.length > 8) {
                alert("You can choose maximum 8 PCAPs.");
            }
            else {
                window.open("/sequenceDiagram/?id=" + pcaps.join(','), '_blank');
            }


        }

        //this.isAdmin() || isDisplay("attrs."+cell) ?
        //what render if user click on row
        const expandRow = {
            onExpand: (row, isExpand, rowIndex, e) => {
            },
            renderer: row => (
                <div className="tab">
                    {this.renderExpand(row._source ? row._source : row, row._source ? false : true)}
                </div>
            ),
            expandByColumnOnly: true,
            showExpandColumn: true,
            nonExpandable: [1],
            expandHeaderColumnRenderer: ({ isAnyExpands }) => {
                if (isAnyExpands) {
                    return <span>-</span>;
                }
                return <span>+</span>;
            },
            expandColumnRenderer: ({ expanded }) => {
                if (expanded) {
                    return (
                        <span>-</span>
                    );
                }
                return (
                    <span>+</span>
                );
            }
        };

        const NoDataIndication = () => (
            <span className="noDataIcon">
                <img alt="nodata" src={emptyIcon} />
            </span>
        );


        const selectRowProp = {
            mode: 'checkbox',
            clickToSelect: false,
            clickToEdit: true,
            selected: this.state.selected,
            onSelect: this.handleOnSelect,
            onSelectAll: this.handleOnSelectAll
        };

        const columnsList = this.state.columns;

        var CustomToggleList = ({
            columns,
            onColumnToggle,
            toggles
        }) => (
            <div style={{ "display": "inline-block", "marginLeft": "15px" }} data-toggle="buttons">
                {
                    columns
                        .map(column => ({
                            ...column,
                            toggle: toggles[column.toggles]
                        }))
                        .filter(column => column.dataField !== "_source" && !NOT_EXPAND_OR_COLUMNS_SELECTION.includes(this.props.id)).map(column => (
                            <button
                                type="button"
                                id={column.dataField}
                                key={column.dataField + this.props.name}
                                className={`${!column.hidden ? ' selectColumnButton green' : 'selectColumnButton'}`}
                                data-toggle="button"
                                aria-pressed={column.toggle ? 'true' : 'false'}
                                onClick={() => {
                                    onColumnToggle(column.dataField);
                                    if (document.getElementById(column.dataField).classList.contains('green')) {
                                        document.getElementById(column.dataField).classList.remove('green');
                                    }
                                    else {
                                        document.getElementById(column.dataField).classList.add('green');
                                    }
                                    //add change color also to state
                                    var columns = this.state.columns;
                                    for (var i = 0; i < columns.length; i++) {
                                        if (columns[i].dataField === column.dataField) {
                                            columns[i].hidden = columns[i].hidden ? false : true;
                                        }
                                    }
                                    this.setState({ columns: columns });
                                    //store new columns in browser storage
                                    var storedColumns = JSON.parse(window.localStorage.getItem("columns"));
                                    var dashboard = window.location.pathname.substring(1);

                                    if (!storedColumns) {
                                        storedColumns = { "version": "1.0" };
                                    }
                                    storedColumns[dashboard] = columns;
                                    window.localStorage.setItem("columns", JSON.stringify(storedColumns));
                                }
                                }>
                                {column.text}
                            </button>

                        ))
                }
            </div>
        );

        const pageButtonRenderer = ({
            page,
            active,
            disable,
            title,
            onPageChange
        }) => {
            const handleClick = async (e) => {
                e.preventDefault();
                //if allcheck button is active, check everything
                //if(this.state.checkall){
                // this.rowCheckAll(true);
                // }
                let actualpage = page;
                if (page === "<<") page = 1;
                if (page === ">>") page = Math.ceil(this.state.data.length / this.state.count);
                if (page === ">") page = this.state.page + 1;
                if (page === "<") page = this.state.page - 1;

                let profile = storePersistent.getState().profile;
                //if there is mode stored in local storage, use this
                let storedProfile = localStorage.getItem('profile');
                if (storedProfile) {
                    profile = JSON.parse(storedProfile);
                }

                if (profile && profile[0] && profile[0].userprefs.mode === "encrypt") {
                    //decrypt only not seen data
                    if (!this.state.seenPages.includes(page)) {
                        let parseData = await decryptTableHits(this.state.data, storePersistent.getState().profile, this.state.count, page, this.state.decryptAttrs);
                        this.setState({
                            data: parseData,
                            seenPages: [...this.state.seenPages, page]
                        });
                    }
                }

                this.setState({
                    page: page
                });
                onPageChange(actualpage);
            }
            const activeStyle = {};
            if (active) {
                activeStyle.backgroundColor = 'grey';
                activeStyle.color = 'white';
            } else {
                activeStyle.backgroundColor = 'white';
                activeStyle.color = 'black';
            }
            if (typeof page === 'string') {
                activeStyle.backgroundColor = 'white';
                activeStyle.color = 'black';
            }
            return (
                <li className="page-item" key={page}>
                    <button onClick={handleClick} className="noFormatButton page-link" style={activeStyle} >{page}</button>
                </li>
            );
        };

        const sizePerPageOptionRenderer = ({
            text,
            page,
            onSizePerPageChange
        }) => (
            <li
                key={text}
                role="presentation"
                className="dropdown-item"
                onMouseDown={async (e) => {
                    e.preventDefault();
                    onSizePerPageChange(page);
                    //decrypt new pages
                    let parseData = await decryptTableHits(JSON.parse(JSON.stringify(this.state.dataEncrypted)), storePersistent.getState().profile, page, this.state.page);
                    this.setState({
                        count: page,
                        data: parseData,
                        seenPages: [this.state.page],
                    });
                }}
            >
                <a
                    href="#"
                    tabIndex="-1"
                    role="menuitem"
                    data-page={page}
                    onMouseDown={async (e) => {
                        e.preventDefault();
                        onSizePerPageChange(page);
                        //decrypt new pages
                        let parseData = await decryptTableHits(JSON.parse(JSON.stringify(this.state.dataEncrypted)), storePersistent.getState().profile, page, this.state.page);
                        this.setState({
                            count: page,
                            data: parseData,
                            seenPages: [this.state.page],
                        });


                    }}
                    style={{ color: 'black' }}
                >
                    {text}
                </a>
            </li>
        );


        const options = {
            pageButtonRenderer,
            sizePerPage: parseInt(this.state.count),
            sizePerPageOptionRenderer
        };

        getSearchableAttributes();
        const data = Array.isArray(this.state.data) ? this.state.data : [];

        
        return (
            <div key={"table" + this.props.name} className="chart">
                {columnsList &&
                    data.map(
                        (props) => (
                                <div key={"tablechart"} ref={this.chartRef}>
                                    <h3 className="alignLeft title inline" style={{ "float": "inherit" }} >{this.props.id}</h3>
                                    {this.props.id === "API LOGS" && <span className="row" style={{ "float": "right", "paddingTop": "6px", "paddingRight": "6px" }}>
                                        <Datetime closeOnTab
                                            closeOnSelect
                                            timeFormat={storePersistent.getState().profile[0].userprefs.time_format}
                                            dateFormat={storePersistent.getState().profile[0].userprefs.date_format}
                                            className="timestamp_gteInput"
                                            input={true}
                                            onChange={this.focousOutGte}
                                            onBlur={this.focousSaveOutGte}
                                            defaultValue={new Date(this.state.timestamp_gte)}
                                            value={this.state.timestamp_gte} />
                                        <span style={{ "padding": "5px" }}>-</span>
                                        <Datetime closeOnTab
                                            closeOnSelect
                                            timeFormat={storePersistent.getState().profile[0].userprefs.time_format}
                                            dateFormat={storePersistent.getState().profile[0].userprefs.date_format}
                                            onChange={this.focousOutLte}
                                            onBlur={this.focousSaveOutLte}
                                            defaultValue={new Date(this.state.timestamp_lte)}
                                            value={this.state.timestamp_lte}
                                            className="timestamp_lteInput" />
                                    </span>}
                                    {!NOT_EXPAND_OR_COLUMNS_SELECTION.includes(this.props.id) && <div id="popupTag" className="popupTag" style={{ "display": "none" }}>
                                        <input type="text" id="tag" name="name" className="form-control" onKeyUp={(event) => this.onEnterKey(event)} style={{ "display": "inline-table", "height": "30px" }} />
                                        <button type="button" className="btn btn-small btn-primary" onClick={() => this.tags()}>OK</button><button type="button" className="btn btn-small btn-secondary" style={{ "margin": "0" }} onClick={() => this.closePopupTag()}>X</button>
                                    </div>}

                                    {(window.location.pathname === "/calls") && <span>
                                        <img className="icon" alt="viewIcon" onClick={() => displayPcaps()} src={viewIcon} title="view merge PCAPs" />
                                        <img className="icon" alt="downloadIcon" src={downloadPcapIcon} onClick={() => getPcaps()} title="download merge PCAP" />
                                    </span>
                                    }
                                    {!NOT_EXPAND_OR_COLUMNS_SELECTION.includes(this.props.id) && <button className="noFormatButton" onClick={() => downloadAllCheck()} >  <img className="icon" alt="downloadIcon" src={downloadIcon} title="download selected" /><span id="downloadAllTooltip" style={{ "display": "none" }}>Downloading a lot of data, it can take a while. Max. 500 events will be download. Use export button for more</span></button>}

                                    {!NOT_EXPAND_OR_COLUMNS_SELECTION.includes(this.props.id) && this.props.id !== "API LOGS" && <button className="noFormatButton" onClick={() => this.shareFilters()} >  <img className="icon" alt="shareIcon" src={shareIcon} title="share selected" /><span id="tooltipshareFilters" style={{ "display": "none", "position": "absolute", "backgroundColor": "white" }}>Copied to clipboard</span></button>}

                                    {<button className="noFormatButton" onClick={() => this.resetLayout()} >  <img className="icon" alt="resetLayoutIcon" src={resetIcon} title="reset table layout to default" style={{ "height": "15px" }} /></button>}
                                    <span className="smallText"> (total: {this.props.total > 500 ? "500/" + this.props.total.toLocaleString() : this.props.total.toLocaleString()})</span>
                                    <CustomToggleList {...props.columnToggleProps} />
                                    <BootstrapTable {...props.baseProps}
                                        pagination={
                                            paginationFactory(options)
                                        }
                                        bordered={false}
                                        bootstrap4
                                        selectRow={this.props.checkbox === false ? undefined : selectRowProp}
                                        hover
                                        printable
                                        expandRow={!NOT_EXPAND_OR_COLUMNS_SELECTION.includes(this.props.id) ?
                                            expandRow : ""
                                        }
                                    />

                                </div>
                            )
                    )
                }
                {this.state.redirect && <Navigate push to={this.state.redirectLink} />}
            </div>
        );
    }
}

