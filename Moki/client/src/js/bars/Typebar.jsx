import { useState } from "react";
import Type from "./Type";
import { getLayoutSettings } from "../helpers/getLayout";
import {
  ColorType,
  getExceededColor,
  getExceededTypes,
  Types,
} from "../../gui";

import store from "@/js/store";
import { assignTypes } from "@/js/slices";
import { useDispatch, useSelector } from "react-redux";

import checkAllIcon from "/icons/checkAll.png";
import uncheckAllIcon from "/icons/uncheckAll.png";

const STORED_TYPES_VERSION = "1.0";

export async function loadTypes() {
  let loadedTypes = [];
  // change types if set in url
  // format: type=XXXXXXX&type=YYYYYYYY
  let parameters = window.location.search;
  let filters = parameters.indexOf("type=");
  let result = [];

  if (parameters && filters !== -1) {
    while (filters !== -1) {
      let last = parameters.indexOf("&", filters + 5);
      let type = parameters.substring(filters + 5, last);

      if (last === -1) {
        type = parameters.substring(filters + 5);
      }

      result.push(type);
      filters = parameters.indexOf("type=", filters + 1);
    }
  }

  let jsonData = await getLayoutSettings();
  let name = window.location.pathname.substring(1);

  if (name === "web") {
    return;
  }

  //check if stored types, remove old version
  let storedTypes = JSON.parse(window.localStorage.getItem("types"));
  if (
    window.localStorage.getItem("types") &&
    (!storedTypes.version || storedTypes.version !== STORED_TYPES_VERSION)
  ) {
    window.localStorage.removeItem("types");
  }

  if (storedTypes && storedTypes[name]) {
    //get types from template to keep it update it
    let allSelected = true;
    let allTypes = [];
    if (name === "exceeded" || name === "alerts") {
      allTypes = await getExceededTypes();
    } else if (jsonData.types[name]) {
      allTypes = jsonData.types[name];
    }

    for (let allType of allTypes) {
      let typeExists = false;
      let thisType = null;
      let id = allType.id ? allType.id : allType;
      for (let type of storedTypes[name]) {
        if (id === type.id) {
          typeExists = true;
          thisType = type;
        }
      }

      if (typeExists) {
        allSelected = allSelected && thisType.state === "enable";
        loadedTypes.push({
          id: thisType.id,
          name: Types[thisType.id] ? Types[thisType.id] : thisType.name,
          state: thisType.state,
        });
      } else {
        loadedTypes.push({
          id: allType.id ? allType.id : allType,
          name: Types[allType]
            ? Types[allType]
            : allType.name
            ? allType.name
            : allType.id,
          state: "enable",
        });
      }
    }
  } else if (name === "exceeded" || name === "alerts") {
    loadedTypes = await getExceededTypes();
  } else if (jsonData.types[name]) {
    for (var i = 0; i < jsonData.types[name].length; i++) {
      var dashboardTypes = jsonData.types[name];
      //is in url
      if (result.length > 0 && result.includes(dashboardTypes[i])) {
        loadedTypes.push({
          id: dashboardTypes[i],
          name: Types[dashboardTypes[i]],
          state: "enable",
        });
      } //not in url but url parameters exists
      else if (result.length > 0 && !result.includes(dashboardTypes[i])) {
        loadedTypes.push({
          id: dashboardTypes[i],
          name: Types[dashboardTypes[i]],
          state: "disable",
        });
      } //no url parametrs
      else {
        loadedTypes.push({
          id: dashboardTypes[i],
          name: Types[dashboardTypes[i]],
          state: "enable",
        });
      }
    }
  }

  store.dispatch(assignTypes(loadedTypes));
  return loadedTypes;
}

function Typebar() {
  const [isAllSelected, setIsAllSelected] = useState(true);
  const types = useSelector((state) => state.filter.types);
  const dispatch = useDispatch();

  //store types in localstorage
  const storeTypesInLocalStorage = (oldTypes) => {
    let storedTypes = JSON.parse(window.localStorage.getItem("types"));

    if (!storedTypes) {
      storedTypes = { "version": STORED_TYPES_VERSION };
    }
    let name = window.location.pathname.substring(1);
    storedTypes[name] = oldTypes;

    window.localStorage.setItem("types", JSON.stringify(storedTypes));
  };

  //check/uncheck all types
  const checkAll = (checkState) => {
    let state = "enable";
    if (checkState === "check") {
      setIsAllSelected(true);
    } else {
      state = "disable";
    }

    const newTypes = types.map((type) => (
      { ...type, state: state }
    ));

    storeTypesInLocalStorage(newTypes);
    dispatch(assignTypes(newTypes));
  };

  /*
    if all types selected - disable all types accept the selected one
    if one or more types selected - add new type or deselect
    */
  const disableType = (selectedType, state, color, click) => {
    let newTypes;

    if (click === "double") {
      //disable all except selected
      newTypes = types.map((type) => {
        let color = ColorType[type];
        if (type.id !== selectedType) {
          return { ...type, state, color };
        }
        if (
          window.location.pathname === "/exceeded" ||
          window.location.pathname === "/alerts"
        ) {
          color = getExceededColor(oldTypes[i].id);
        }
        return { ...type, state: "enable", color };
      });
      setIsAllSelected(false);
    } else {
      let allSelected = true;
      newTypes = types.map((type) => {
        if (type.state === "disable") {
          allSelected = false;
        }
        if (type.id === selectedType) {
          return { ...type, state };
        }
        return type;
      });
      setIsAllSelected(allSelected);
    }

    console.info("Type is " + state + ": " + JSON.stringify(newTypes));
    storeTypesInLocalStorage(newTypes);
    dispatch(assignTypes(newTypes));
  };

  if (types.length !== 0) {
    const renderedTypes = (
      <div style={{ "display": "contents" }}>
        {types.map((type) => {
          return (
            <Type
              key={type.id}
              name={type.name}
              id={type.id}
              state={type.state}
              description={type.description}
              isAllSelected={isAllSelected}
              disableType={disableType}
            />
          );
        })}
      </div>
    );
    return (
      <div className="typeBar">
        <div className="row align-items-center ">
          <img
            alt="checkAllIcon"
            onClick={() => checkAll("check")}
            className="tabletd checkAll"
            src={checkAllIcon}
          />
          <img
            alt="uncheckAllIcon"
            onClick={() => checkAll("uncheck")}
            className="tabletd checkAll"
            src={uncheckAllIcon}
          />
          {renderedTypes}
        </div>
      </div>
    );
  } else {
    return null;
  }
}

export default Typebar;
