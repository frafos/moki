import React, { Component } from "react";
import { Navbar } from 'react-bootstrap';
import Autocomplete from "./Autocomplete";
import { getSearchableAttributes } from '../../gui';
import store from "../store/index";
import { setFilters } from "../actions/index";
import { createFilter } from '../../gui';
import { renderFilters } from '../helpers/renderFilters.jsx';
import StoredFilters from "../pages/stored_filters";
import SaveFilters from "../pages/save_filters";
import Popup from "reactjs-popup";

import saveIcon from "/icons/save_filters.png";
import loadIcon from "/icons/load_filters.png";
import search from "/icons/search.png";

class FilterBar extends Component {
    constructor(props) {
        super(props);
        var oldFilters = store.getState().filters;
        var newFilters = [];
        for (var i = 0; i < oldFilters.length; i++) {
            if (oldFilters[i].pinned !== 'false') {
                newFilters.push(oldFilters[i]);
            }
        }
        store.dispatch(setFilters(newFilters));
        //remove unpinned filters
        this.state = {
            filterbar: "",
            filters: newFilters,
            dstRealms: this.props.dstRealms ? this.props.dstRealms : [],
            srcRealms: this.props.srcRealms ? this.props.srcRealms : []
        }
        this.addFilter = this.addFilter.bind(this);
        this.addAttrs = this.addAttrs.bind(this);
        this.deleteFilter = this.deleteFilter.bind(this);
        this.disableFilter = this.disableFilter.bind(this);
        this.enableFilter = this.enableFilter.bind(this);
        this.pinFilter = this.pinFilter.bind(this);
        this.editFilter = this.editFilter.bind(this);
        this.unpinFilter = this.unpinFilter.bind(this);
        this.rerenderFilters = this.rerenderFilters.bind(this);
        this.negationFilter = this.negationFilter.bind(this);
        store.subscribe(() => this.rerenderFilters());

    }


    //after redirect delete unpinned filters
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (this.props.redirect !== nextProps.redirect) {
            this.pinnedFilters();
        }

        if (nextProps.dstRealms !== this.props.dstRealms) {
            this.setState({ dstRealms: nextProps.dstRealms });
        }

        if (nextProps.srcRealms !== this.props.srcRealms) {
            this.setState({ srcRealms: nextProps.srcRealms });
        }
    }

    
    componentWillUnmount() {
        // fix Warning: Can't perform a React state update on an unmounted component
        this.setState = (state, callback) => {
           return;
       };
   }

    //if store filters changes, render new state
    rerenderFilters() {
        //if (store.getState().filters !== this.state.filters) {
        console.info("Filters are changed: " + JSON.stringify(store.getState().filters));
        this.setState({ filters: store.getState().filters });
        // }
    }

    //check if attribute prefix is correct
    addAttrs(value) {
        if (value.indexOf(".") === -1) {
            var searchable = getSearchableAttributes();
            value = value.substring(0, value.indexOf(":"));
            //remove spaces
            value.replace(/\s+/g, '');
            for (var i = 0; i < searchable.length; i++) {
                if (searchable[i].substring(searchable[i].indexOf(".") + 1) === value) {
                    return searchable[i].substring(0, searchable[i].indexOf(".") + 1);
                }
            }
            return "attrs.";
        }
        else {
            return "";
        }
    }

    //check input
    check(input) {
        // check for <script>
        if (input.includes("<script>")) {
            alert("Filter can't contain <script>");
            return false;
        }
        //or special characters {}
        else if (input.includes("{") || input.includes("}")) {
            alert("Filter can't contain { or }");
            return false;
        }
        return input;
    }

    //add new filrer, generate id, status enable, pinned
    addFilter() {
        var searchBar = document.getElementById("searchBar");
        var searchValue = searchBar.value;

        let check = this.check(searchValue);
        if (check !== false) {
            searchValue = check;

            //with attribute name or "sip:"
            if (searchValue.includes(":")) {
                var operators = searchValue.indexOf(":");
                //if it include \: don't put attrs 
                if (searchValue.substring(operators - 1, operators) !== "\\") {
                    var includeChar = this.addAttrs(searchValue);
                    searchValue = includeChar + searchValue;
                }

                //it can contains OR so put attrs also there type:reg-del OR type:reg-new
                operators = searchValue.indexOf("OR ");
                while (operators !== -1) {
                    operators = operators + 3;
                    includeChar = this.addAttrs(searchValue.slice(operators));
                    searchValue = [searchValue.slice(0, operators), includeChar, searchValue.slice(operators)].join('');
                    operators = searchValue.indexOf("OR ", operators);
                }

                //the same for AND
                operators = searchValue.indexOf("AND ");
                while (operators !== -1) {
                    operators = operators + 4;
                    includeChar = this.addAttrs(searchValue.slice(operators));
                    searchValue = [searchValue.slice(0, operators), includeChar, searchValue.slice(operators)].join('');
                    operators = searchValue.indexOf("AND ", operators);
                }
            }
            if (searchBar.value !== "") {
                var filters = createFilter(searchValue);
                searchBar.setAttribute("value", "");

                console.info("Filters are changed: " + JSON.stringify(filters));
                this.setState({
                    filterbar: ""
                });
            }
            if (document.getElementById("filterRoom")) {
                var room = document.getElementById("filterRoom").value;
                if (room && room !== "") {
                    createFilter("attrs.conf_id: " + room);
                    document.getElementById("filterRoom").value = "";
                }
            }
        }
    }
    //negation filter 
    negationFilter(filter) {
        var oldFilters = store.getState().filters;
        for (var i = 0; i < oldFilters.length; i++) {
            if ('filter' + oldFilters[i].id === filter) {
                if (oldFilters[i].title.substring(0, 3) === "NOT") {
                    oldFilters[i].title = oldFilters[i].title.substring(4);
                }
                else {
                    oldFilters[i].title = "NOT " + oldFilters[i].title;
                }
            }
        }
        this.setState({ filters: oldFilters });
        store.dispatch(setFilters(oldFilters));

    }

    //delete filter according filter id
    deleteFilter(filter) {
        var oldFilters = store.getState().filters;
        var newFilters = [];
        for (var i = 0; i < oldFilters.length; i++) {
            if ('filter' + oldFilters[i].id !== filter) {
                newFilters.push(oldFilters[i]);
            }
        }
        this.setState({ filters: newFilters });
        store.dispatch(setFilters(newFilters));
    }

    //disable filter according filter id
    disableFilter(filter) {
        var oldFilters = JSON.parse(JSON.stringify(store.getState().filters));
        for (var i = 0; i < oldFilters.length; i++) {
            if ('filter' + oldFilters[i].id === filter) {
                oldFilters[i].state = 'disable';
                oldFilters[i].previousState = 'enable';
            }
        }
        console.info("Filter is disabled: " + JSON.stringify(oldFilters));
        store.dispatch(setFilters(oldFilters));
    }

    //change state of filter to enable
    enableFilter(filter) {
        var oldFilters = store.getState().filters;
        for (var i = 0; i < oldFilters.length; i++) {
            if ('filter' + oldFilters[i].id === filter) {
                oldFilters[i].state = 'enable';
                oldFilters[i].previousState = 'disable';
            }
        }
        console.info("Filter is enabled: " + JSON.stringify(oldFilters));
        store.dispatch(setFilters(oldFilters));
    }

    //change state of filter to unpinned
    unpinFilter(filter) {
        var oldFilters = store.getState().filters;
        for (var i = 0; i < oldFilters.length; i++) {
            if ('filter' + oldFilters[i].id === filter) {
                oldFilters[i].pinned = 'false';
            }
        }
        console.info("Filter is unpinned " + oldFilters);
        store.dispatch(setFilters(oldFilters));

    }

    //edit filter
    editFilter(filter, value) {
        var oldFilters = store.getState().filters;
        for (var i = 0; i < oldFilters.length; i++) {
            if ('filter' + oldFilters[i].id === filter) {
                var check = this.check(value);
                if (check !== false) {
                    oldFilters[i].title = value;
                }
                else {
                    continue;
                }
            }
        }
        if (check) {
            console.info("Filter was edited: " + value);
            store.dispatch(setFilters(oldFilters));
            this.setState({ filters: store.getState().filters });
        }
    }

    //change state of filter to pinned
    pinFilter(filter) {
        var oldFilters = store.getState().filters;
        for (var i = 0; i < oldFilters.length; i++) {
            if ('filter' + oldFilters[i].id === filter) {
                oldFilters[i].pinned = 'true';
            }
        }
        console.info("Filter is pinned " + oldFilters);
        store.dispatch(setFilters(oldFilters));
    }

    //redirection - show only pinned filters
    pinnedFilters() {
        var filters = store.getState().filters;
        var filtersResult = [];
        for (var i = 0; i < filters.length; i++) {
            if (filters[i].pinned === 'true') {
                filtersResult.push(filters[i]);
            }
        }

        store.dispatch(setFilters(filtersResult));
    }

    specFilter(e) {
        if (e.key === "Enter") {
            if (window.location.pathname === "/conference") {
                var room = document.getElementById("filterRoom").value;
                if (room && room !== "") {
                    createFilter("attrs.conf_id: " + room);
                    document.getElementById("filterRoom").value = "";
                }
            }
        }
        if (window.location.pathname === "/connectivityCA") {
            if (e.currentTarget.getAttribute("id") === "dstRealms") {
                createFilter("attrs.dst_rlm_name: " + e.currentTarget.value);
                e.currentTarget.value = "";
            }

            if (e.currentTarget.getAttribute("id") === "srcRealms") {
                createFilter("attrs.src_rlm_name: " + e.currentTarget.value);
                e.currentTarget.value = "";
            }
        }
    }


    render() {
        let filters = null;
        var url = window.location.pathname;
        filters = renderFilters(this.state.filters, this.deleteFilter, this.disableFilter, this.enableFilter, this.pinFilter, this.editFilter, this.negationFilter, this.unpinFilter);
        var srcRealms = (<select className="text-left form-control form-check-input filter-right" id="srcRealms" placeholder="SRC REALMS" onChange={this.specFilter}> <option value="" disabled selected>SRC REALM</option>
            {this.state.srcRealms.map((realm) => {
                return <option value={realm.key} key={realm.key + "src"}>{realm.key}</option>
            })} </select>
        )
        var dstRealms = (<select className="text-left form-control form-check-input filter-right" id="dstRealms" placeholder="DST REALMS" onChange={this.specFilter}> <option value="" disabled selected>DST REALM</option>
            {this.state.dstRealms.map((realm) => {
                return <option value={realm.key} key={realm.key + "dst"}>{realm.key}</option>
            })} </select>
        )

        return (
            <div className="row" style={{ "marginLeft": "0px", "marginTop": "35px" }}>
                <div className="FilterSearchBar">
                    <div className="text-nowrap row">
                        <Navbar variant="light">
                            <div className="row" style={{ "width": "100%", "display": "inline-flex" }}>
                                <Autocomplete
                                    suggestions={getSearchableAttributes()} enter={this.state.filterbar} tags={this.props.tags} type="main" />
                                <div className="row" style={{ "marginLeft": "5px", "marginTop": "6px", "display": "table-cell", "width": "1px", "verticalAlign": "bottom" }}>
                                    <div className="row" style={{ "width": "max-content" }}>
                                        {url === "/conference" && <input className="text-left form-control form-check-input filter-right" type="text" id="filterRoom" placeholder="CONF ID" onKeyUp={this.specFilter} />}
                                        {url === "/connectivityCA" && srcRealms}
                                        {url === "/connectivityCA" && dstRealms}
                                        <img className="icon iconMain" alt="search" src={search} title="search" onClick={this.addFilter} id="filterButton" />
                                        {<Popup trigger={<img className="icon iconMain" alt="storeIcon" src={loadIcon} title="stored filters" />} modal>
                                            {close => (
                                                <div className="Advanced">
                                                    <button className="close" id="storedFiltersClose" onClick={close}> &times; </button>
                                                    <div className="contentAdvanced">
                                                        <StoredFilters />
                                                    </div>
                                                </div>
                                            )}
                                        </Popup>}
                                        {<Popup trigger={<img className="icon iconMain" alt="storeIcon" src={saveIcon} title="save filters" />} modal>
                                            {close => (
                                                <div className="Advanced">
                                                    <button className="close" id="saveFiltersClose" onClick={close}> &times; </button>
                                                    <div className="contentAdvanced">
                                                        <SaveFilters />
                                                    </div>
                                                </div>
                                            )}
                                        </Popup>}
                                    </div>
                                </div>
                            </div>
                        </Navbar>
                    </div>
                </div>
                <div className="row" style={{ "marginLeft": "0" }}>
                    <div className="filterBar" id="filterBar">
                        {filters}
                    </div>
                </div>
            </div>
        );
    }
}

export default FilterBar;
