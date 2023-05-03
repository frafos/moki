import { useEffect, useState } from "react";
import { Navbar } from "react-bootstrap";
import Autocomplete from "./Autocomplete";
import { getSearchableAttributes } from "../../gui";
import { createFilter } from "../../gui";
import { renderFilters } from "../helpers/renderFilters.jsx";
import StoredFilters from "../pages/stored_filters";
import SaveFilters from "../pages/save_filters";
import Popup from "reactjs-popup";

import store from "@/js/store";
import { setFilters } from "@/js/slices";

import saveIcon from "/icons/save_filters.png";
import loadIcon from "/icons/load_filters.png";
import search from "/icons/search.png";
import { useSelector } from "react-redux";

function FilterBar(props) {

  //remove unpinned filters
  const [filterbar, setFilterbar] = useState("");
  const [dstRealms, setDstRealms] = useState(props.dstRealms ?? []);
  const [srcRealms, setSrcRealms] = useState(props.srcRealms ?? []);

  // if store filters changes, render new state
  let filters = useSelector((state) => state.filter.filters);

  useEffect(() => {
    pinnedFilters();
  }, [props.redirect]);

  useEffect(() => {
    if (!props.dstRealms) return;
    setDstRealms(props.dstRealms);
  }, [props.dstRealms]);

  useEffect(() => {
    if (!props.srcRealms) return;
    setSrcRealms(props.srcRealms);
  }, [props.srcRealms]);

  // check if attribute prefix is correct
  const addAttrs = (value) => {
    if (value.indexOf("." !== -1)) return "";
    const searchable = getSearchableAttributes();
    value = value.substring(0, value.indexOf(":"));
    // remove spaces
    value.replace(/\s+/g, "");
    for (const attr of searchable) {
      if (attr.substring(attr.indexOf(".") + 1) === value) {
        return attr.substring(0, attr.indexOf(".") + 1);
      }
    }
    return "attrs.";
  };

  //check input
  const check = (input) => {
    // check for <script>
    if (input.includes("<script>")) {
      alert("Filter can't contain <script>");
      return false;
    } //or special characters {}
    else if (input.includes("{") || input.includes("}")) {
      alert("Filter can't contain { or }");
      return false;
    }
    return input;
  };

  //add new filrer, generate id, status enable, pinned
  const addFilter = () => {
    let searchBar = document.getElementById("searchBar");
    let searchValue = searchBar.value;

    let checked = check(searchValue);
    if (checked) {
      searchValue = checked;
      let includeChar;
      let operators;

      //with attribute name or "sip:"
      if (searchValue.includes(":")) {
        operators = searchValue.indexOf(":");
        //if it include \: don't put attrs
        if (searchValue.substring(operators - 1, operators) !== "\\") {
          includeChar = addAttrs(searchValue);
          searchValue = includeChar + searchValue;
        }

        //it can contains OR so put attrs also there type:reg-del OR type:reg-new
        operators = searchValue.indexOf("OR ");
        while (operators !== -1) {
          operators = operators + 3;
          includeChar = addAttrs(searchValue.slice(operators));
          searchValue = [
            searchValue.slice(0, operators),
            includeChar,
            searchValue.slice(operators),
          ].join("");
          operators = searchValue.indexOf("OR ", operators);
        }

        //the same for AND
        operators = searchValue.indexOf("AND ");
        while (operators !== -1) {
          operators = operators + 4;
          includeChar = addAttrs(searchValue.slice(operators));
          searchValue = [
            searchValue.slice(0, operators),
            includeChar,
            searchValue.slice(operators),
          ].join("");
          operators = searchValue.indexOf("AND ", operators);
        }
      }
      if (searchBar.value !== "") {
        let filters = createFilter(searchValue);
        searchBar.setAttribute("value", "");

        console.info("Filters are changed: " + JSON.stringify(filters));
        setFilterbar("");
      }
      if (document.getElementById("filterRoom")) {
        var room = document.getElementById("filterRoom").value;
        if (room && room !== "") {
          createFilter("attrs.conf_id: " + room);
          document.getElementById("filterRoom").value = "";
        }
      }
    }
  };

  //negation filter
  const negationFilter = (selectedFilter) => {
    const newFilters = filters.map((filter) => {
      if ("filter" + filter.id === selectedFilter) {
        if (filter.title.substring(0, 3) === "NOT") {
          return { ...filter, title: filter.title.substring(4) };
        } else {
          return { ...filter, title: "NOT " + filter.title };
        }
      }
      return filter;
    });
    store.dispatch(setFilters(newFilters));
  };

  //delete filter according filter id
  const deleteFilter = (selectedFilter) => {
    const newFilters = filters.filter((
      filter,
    ) => ("filter" + filter.id !== selectedFilter));
    store.dispatch(setFilters(newFilters));
  };

  //disable filter according filter id
  const disableFilter = (selectedFilter) => {
    const newFilters = filters.map((filter) => {
      if ("filter" + filter.id === selectedFilter) {
        return {
          ...filter,
          state: "disable",
          previousState: "enable",
        };
      }
      return filter;
    });
    console.info("Filter is disabled: " + JSON.stringify(newFilters));
    store.dispatch(setFilters(newFilters));
  };

  //change state of filter to enable
  const enableFilter = (selectedFilter) => {
    const newFilters = filters.map((filter) => {
      if ("filter" + filter.id === selectedFilter) {
        return {
          ...filter,
          state: "enable",
          previousState: "disable",
        };
      }
      return filter;
    });
    console.info("Filter is enabled: " + JSON.stringify(newFilters));
    store.dispatch(setFilters(newFilters));
  };

  //change state of filter to unpinned
  const unpinFilter = (selectedFilter) => {
    const newFilters = filters.map((filter) => {
      if ("filter" + filter.id === selectedFilter) {
        return {
          ...filter,
          pinned: "false",
        };
      }
      return filter;
    });
    console.info("Filter is unpinned " + JSON.stringify(newFilters));
    store.dispatch(setFilters(newFilters));
  };

  //change state of filter to pinned
  const pinFilter = (selectedFilter) => {
    const newFilters = filters.map((filter) => {
      if ("filter" + filter.id === selectedFilter) {
        return {
          ...filter,
          pinned: "true",
        };
      }
      return filter;
    });
    console.info("Filter is pinned " + JSON.stringify(newFilters));
    store.dispatch(setFilters(newFilters));
  };

  //edit filter
  const editFilter = (selectedFilter, value) => {
    let checked = false;
    const newFilters = filters.map((filter) => {
      if ("filter" + filter.id === selectedFilter) {
        checked = check(value);
        if (checked) {
          return { ...filter, title: value }
        } 
      }
      return filter;
    });
    if (checked) {
      console.info("Filter was edited: " + value);
      store.dispatch(setFilters(newFilters));
    }
  };

  // redirection - show only pinned filters
  const pinnedFilters = () => {
    const newFilters = filters.filter((filter) => (
      (filter.pinned === "true")
    ));
    store.dispatch(setFilters(newFilters));
  };

  const specFilter = (e) => {
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
  };

  let url = window.location.pathname;
  const renderedFilters = renderFilters(
    filters,
    deleteFilter,
    disableFilter,
    enableFilter,
    pinFilter,
    editFilter,
    negationFilter,
    unpinFilter,
  );
  const renderedSrcRealms = (
    <select
      className="text-left form-control form-check-input filter-right"
      id="srcRealms"
      placeholder="SRC REALMS"
      onChange={specFilter}
    >
      <option value="" disabled selected>SRC REALM</option>
      {srcRealms.map((realm) => {
        return (
          <option value={realm.key} key={realm.key + "src"}>{realm.key}</option>
        );
      })}
    </select>
  );
  const renderedDstRealms = (
    <select
      className="text-left form-control form-check-input filter-right"
      id="dstRealms"
      placeholder="DST REALMS"
      onChange={specFilter}
    >
      <option value="" disabled selected>DST REALM</option>
      {dstRealms.map((realm) => {
        return (
          <option value={realm.key} key={realm.key + "dst"}>{realm.key}</option>
        );
      })}
    </select>
  );

  return (
    <div className="row" style={{ "marginLeft": "0px", "marginTop": "35px" }}>
      <div className="FilterSearchBar">
        <div className="text-nowrap row">
          <Navbar variant="light">
            <div
              className="row"
              style={{ "width": "100%", "display": "inline-flex" }}
            >
              <Autocomplete
                suggestions={getSearchableAttributes()}
                enter={filterbar}
                tags={props.tags}
                type="main"
              />
              <div
                className="row"
                style={{
                  "marginLeft": "5px",
                  "marginTop": "6px",
                  "display": "table-cell",
                  "width": "1px",
                  "verticalAlign": "bottom",
                }}
              >
                <div className="row" style={{ "width": "max-content" }}>
                  {url === "/conference" && (
                    <input
                      className="text-left form-control form-check-input filter-right"
                      type="text"
                      id="filterRoom"
                      placeholder="CONF ID"
                      onKeyUp={specFilter}
                    />
                  )}
                  {url === "/connectivityCA" && renderedSrcRealms}
                  {url === "/connectivityCA" && renderedDstRealms}
                  <img
                    className="icon iconMain"
                    alt="search"
                    src={search}
                    title="search"
                    onClick={addFilter}
                    id="filterButton"
                  />
                  {
                    <Popup
                      trigger={
                        <img
                          className="icon iconMain"
                          alt="storeIcon"
                          src={loadIcon}
                          title="stored filters"
                        />
                      }
                      modal
                    >
                      {(close) => (
                        <div className="Advanced">
                          <button
                            className="close"
                            id="storedFiltersClose"
                            onClick={close}
                          >
                            &times;
                          </button>
                          <div className="contentAdvanced">
                            <StoredFilters />
                          </div>
                        </div>
                      )}
                    </Popup>
                  }
                  {
                    <Popup
                      trigger={
                        <img
                          className="icon iconMain"
                          alt="storeIcon"
                          src={saveIcon}
                          title="save filters"
                        />
                      }
                      modal
                    >
                      {(close) => (
                        <div className="Advanced">
                          <button
                            className="close"
                            id="saveFiltersClose"
                            onClick={close}
                          >
                            &times;
                          </button>
                          <div className="contentAdvanced">
                            <SaveFilters />
                          </div>
                        </div>
                      )}
                    </Popup>
                  }
                </div>
              </div>
            </div>
          </Navbar>
        </div>
      </div>
      <div className="row" style={{ "marginLeft": "0" }}>
        <div className="filterBar" id="filterBar">
          {renderedFilters}
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
