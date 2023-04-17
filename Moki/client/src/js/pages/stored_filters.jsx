import React, {
    Component
} from 'react';
import { createFilter } from '../../gui';
import store from "../store/index";
import storePersistent from "../store/indexPersistent";
import { setTimerange } from "../actions/index";
import { assignType } from "../actions/index";
import { setFilters } from "../actions/index";
import querySrv from '../helpers/querySrv';

import disableIcon from "/icons/disable.png";
import enableIcon from "/icons/enable.png";

class StoredFilters extends Component {
    constructor(props) {
        super(props);
        this.load = this.load.bind(this);
        this.activateFilter = this.activateFilter.bind(this);
        this.deleteFilter = this.deleteFilter.bind(this);
        this.state = {
            filters: []
        }
    }

    componentWillMount() {
        this.load();
    }

    /*
       Load data
       */
    async load() {
        var checksum = storePersistent.getState().profile[0] ? storePersistent.getState().profile[0].userprefs.validation_code : "";
        var Url = "api/filters";
        var jsonData;
        try {
            const response = await querySrv(Url, {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                },
                body: JSON.stringify({
                    "validation_code": checksum
                }),
            });
            jsonData = await response.json();
            if (jsonData && jsonData.hits && jsonData.hits.hits) {
                //change format {id: XX, attribute: YY, title:ZZ}
                var newFormat = [];
                for(var i =0; i < jsonData.hits.hits.length; i++){
                    newFormat.push( {
                        id: jsonData.hits.hits[i]._source.id,
                        title: jsonData.hits.hits[i]._source.title,
                        attribute: eval(jsonData.hits.hits[i]._source.attribute)
                    });
                }

                this.setState({
                    filters: newFormat
                });
                console.info("Got stored filters " + JSON.stringify(jsonData));
            }
        } catch (error) {
            console.error(error);
            alert("Problem with receiving data. " + error);
        }

    }

    //redirect to dashboard stored in filters, active  stored types, filters and timerange
    async activateFilter(event) {
        var filterID = event.currentTarget.getAttribute("filterid");
        var storedFilters = this.state.filters;
        var filters = "";
        var newFilters = [];

        for (var i = 0; i < storedFilters.length; i++) {
            if (storedFilters[i].id === filterID)
                filters = storedFilters[i];
        }

        document.getElementsByClassName("close")[0].click();
        //redirect according to dashboard name
        var name = filters.attribute[1].name;
        document.getElementById(name).click();

        //filters
        if (filters.attribute[0] &&  filters.attribute[0].filters && filters.attribute[0].filters[0] && filters.attribute[0].filters[0].length > 0) {
            for (i = 0; i < filters.attribute[0].filters[0].length; i++) {
                newFilters.push(await createFilter(filters.attribute[0].filters[0][i].title, filters.attribute[0].filters[0][i].id, false, false));
            }
            store.dispatch(setFilters(newFilters));
        }

        //types
        if (filters.attribute[2].types) {
            store.dispatch(assignType(filters.attribute[2].types));
        }

        //timerange
        if (filters.attribute[3]) {
            var timestamp_readiable = new Date(filters.attribute[3].timerange[0]).toLocaleString() + " - " + new Date(filters.attribute[3].timerange[1]).toLocaleString();
            store.dispatch(setTimerange([filters.attribute[3].timerange[0], filters.attribute[3].timerange[1], timestamp_readiable]));
        }
        if(document.getElementById("storedFiltersClose")){
            document.getElementById("storedFiltersClose").click();
        }
    }


    async deleteFilter(event) {
        var filter = event.currentTarget.getAttribute("id");
        console.info("Delete filter " + filter)
        var Url = "api/filters/delete";
        try {
            const response = await querySrv(Url, {
                method: "POST",
                body: JSON.stringify({id: filter}),
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            });
            var jsonData = await response.json();

            console.info("Filter deleted " + JSON.stringify(jsonData));
        } catch (error) {
            console.error(error);
            alert("Problem with deleting filter " + error);
        }

        //load new filters at the end
        this.load();
    }


    render() {
        var filters = this.state.filters;
        if (filters.length !== 0) {
            return (
                <React.Fragment>
                    {filters.map((item, key) =>
                        <div className="rowFilter" key={item.id} >
                            <span className="iconsStoredFilter" onClick={this.activateFilter} filterid={item.id}>
                                <img style={{ "width": "10px" }} alt="activateIcon" src={enableIcon} title="activate filter" />
                            </span >
                            <span className="iconsStoredFilter iconsDelete" onClick={this.deleteFilter} id={item.id}>
                                <img style={{ "width": "10px" }} alt="deleteIcon" src={disableIcon} title="delete filter" />
                            </span >
                            <b style={{ "marginLeft": "20px" }}>{item.title}: </b>
                            {item.attribute.length > 0 && item.attribute[0].filters.length > 0 && item.attribute[0].filters[0].length > 0 &&
                                item.attribute[0].filters[0].map((subitem, i) => {
                                    if (i <= 3) {
                                        return (
                                            <span className="tab" key={i}>{subitem.title}</span>
                                        )
                                    }
                                    return "";
                                })}

                        </div>
                    )}
                </React.Fragment>

            );
        }
        else {
            return <span>No stored filters </span>
        }
    }
}

export default StoredFilters;
