import React, {
    Component
} from 'react';

import Type from './Type';
import checkAll from "/icons/checkAll.png";
import uncheckAll from "/icons/uncheckAll.png";
import store from "../store/index";
import { assignType } from "../actions/index";
import { getLayoutSettings } from '../helpers/getLayout';
import { ColorType, getExceededColor, Types, getExceededTypes } from '../../gui';
const STORED_TYPES_VERSION = "1.0";

class Typebar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            types: [],
            isAllSelected: true,
            isFetching: true
        }
        this.disableType = this.disableType.bind(this);
        this.checkAll = this.checkAll.bind(this);
        this.loadTypes = this.loadTypes.bind(this);
        store.subscribe(() => this.rerenderTypes());
        window.types = this;
    }

    async loadTypes() {
        var types = [];
        //change types if set in url
        //format: type=XXXXXXX&type=YYYYYYYY
        var parameters = window.location.search;
        var filters = parameters.indexOf("type=");
        var result = [];
        if (parameters && filters !== -1) {
            while (filters !== -1) {
                var last = parameters.indexOf("&", filters + 5);
                var type = parameters.substring(filters + 5, last);

                if (last === -1) {
                    type = parameters.substring(filters + 5);
                }

                result.push(type);
                filters = parameters.indexOf("type=", (filters + 1));
            }
        }
        var jsonData = await getLayoutSettings();
        let name = window.location.pathname.substring(1);

        if (name === "web") {
            return;
        }

        //check if stored types, remove old version
        let storedTypes = JSON.parse(window.localStorage.getItem("types"));
        if (window.localStorage.getItem("types") && (!storedTypes.version || storedTypes.version !== STORED_TYPES_VERSION)) {
            window.localStorage.removeItem("types");
        }

        if (storedTypes && storedTypes[name]) {
            //get types from template to keep it update it
            let isAllSelected = true;
            var allTypes = [];
            if (name === "exceeded" || name === "alerts") {
                allTypes = await getExceededTypes();
            }
            else if (jsonData.types[name]) {
                allTypes = jsonData.types[name]
            }

            for (let allType of allTypes) {
                var typeExists = false;
                var thisType = null;
                var id = allType.id ? allType.id : allType;
                for (let type of storedTypes[name]) {
                    if (id === type.id) {
                        typeExists = true;
                        thisType = type;
                    }
                }

                if (typeExists) {
                    isAllSelected = isAllSelected && thisType.state === "enable";
                    types.push({
                        id: thisType.id,
                        name: Types[thisType.id] ? Types[thisType.id] : thisType.name,
                        state: thisType.state
                    });
                }
                else {
                    types.push({
                        id: allType.id ? allType.id : allType,
                        name: Types[allType] ? Types[allType] : allType.name ? allType.name : allType.id,
                        state: "enable"
                    });
                }

                this.setState({ isAllSelected: isAllSelected });

            }
        }
        else if (name === "exceeded" || name === "alerts") {
            types = await getExceededTypes();
        }
        else if (jsonData.types[name]) {
            for (var i = 0; i < jsonData.types[name].length; i++) {
                var dashboardTypes = jsonData.types[name];
                //is in url
                if (result.length > 0 && result.includes(dashboardTypes[i])) {
                    types.push({
                        id: dashboardTypes[i],
                        name: Types[dashboardTypes[i]],
                        state: "enable"
                    });
                }
                //not in url but url parameters exists
                else if (result.length > 0 && !result.includes(dashboardTypes[i])) {
                    types.push({
                        id: dashboardTypes[i],
                        name: Types[dashboardTypes[i]],
                        state: "disable"
                    });
                }
                //no url parametrs
                else {
                    types.push({
                        id: dashboardTypes[i],
                        name: Types[dashboardTypes[i]],
                        state: "enable"
                    });
                }
            }
        }

        store.dispatch(assignType(types));
        return types;
    }

    componentWillUnmount() {
        // fix Warning: Can't perform a React state update on an unmounted component
        this.setState = (state, callback) => {
            return;
        };
    }

    //store types in localstorage
    storeTypesInLocalStorage(types) {
        let storedTypes = JSON.parse(window.localStorage.getItem("types"));

        if (!storedTypes) {
            storedTypes = { "version": STORED_TYPES_VERSION };
        }
        let name = window.location.pathname.substring(1);
        storedTypes[name] = types;

        window.localStorage.setItem("types", JSON.stringify(storedTypes));
    }

    //when you load stored filters and types, you need to rerender GUI
    rerenderTypes() {
        if ((store.getState().types !== this.state.types) && store.getState().types.length !== 0) {
            console.info("Types is changed to " + JSON.stringify(store.getState().types));
            this.setState({ types: store.getState().types });
        }
    }

    //check/uncheck all types
    checkAll(checkState) {
        let state = "enable";
        if (checkState === "check") {
            this.setState({
                isAllSelected: true
            });
        }
        else {
            state = "disable";
        }

        let oldTypes = this.state.types;
        for (let i = 0; i < oldTypes.length; i++) {
            oldTypes[i].state = state
        }
        this.setState({ types: oldTypes });
        this.storeTypesInLocalStorage(oldTypes);
        store.dispatch(assignType(oldTypes));
    }

    /*
    if all types selected - disable all types accept the selected one
    if one or more types selected - add new type or deselect
    */
    disableType(type, state, color, click) {
        var isAllSelected = true;
        var oldTypes = this.state.types;
        if (click === "double") {
            //disable all except selected
          
            for (var i = 0; i < oldTypes.length; i++) {
                if (oldTypes[i].id !== type) {
                    oldTypes[i].state = state;
                    oldTypes[i].color = color;
                }
                else {
                    oldTypes[i].state = "enable";
                    let color = ColorType[type];
                    if (window.location.pathname === "/exceeded" || window.location.pathname === "/alerts") {
                        color = getExceededColor(oldTypes[i].id);
                    }
                    oldTypes[i].color = color;
                }
            }
            isAllSelected = false;
        }
        else {
            for (i = 0; i < oldTypes.length; i++) {
                if (oldTypes[i].id === type) {
                    oldTypes[i].state = state;
                }

                if (oldTypes[i].state === "disable") {
                    isAllSelected = isAllSelected && false;
                }
            }
        }

        this.setState({
            types: oldTypes,
            isAllSelected: isAllSelected
        });

        console.info("Type is "+state+": " + JSON.stringify(oldTypes));
        this.storeTypesInLocalStorage(oldTypes);
        store.dispatch(assignType(oldTypes));
    }


    render() {
        if (this.state.types.length !== 0) {
            var types = (
                <div style={{ "display": "contents" }}>
                    {this.state.types.map((type, index) => {
                        return <Type key={type.id}
                            name={type.name} id={type.id} state={type.state} description={type.description} isAllSelected={this.state.isAllSelected} disableType={this.disableType} />
                    })}
                </div>
            )
            return (
                <div className="typeBar">
                    <div className="row align-items-center ">
                        <img alt="checkAllIcon" onClick={() => this.checkAll("check")} className="tabletd checkAll" src={checkAll} />
                        <img alt="uncheckAllIcon" onClick={() => this.checkAll("uncheck")} className="tabletd checkAll" src={uncheckAll} />
                        {types}
                    </div>

                </div>

            );
        } else {
            return null;
        }

    }
}

export default Typebar;
