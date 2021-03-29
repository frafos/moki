import React, {
    Component
} from 'react';
import store from "../store/index";
import { getFilters } from '@moki-client/gui';

class SaveFilters extends Component {
    constructor(props) {
        super(props);
        this.save = this.save.bind(this);
    }

    uid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async save(event) {
        var filterTitle = document.getElementById("filterTitle").value;
        if (filterTitle === "") {
            alert("You have to fill filter title.");
        } else {
            var dashboardName = document.getElementById("filterTitle").getAttribute("dashboard");
            document.getElementsByClassName("close")[0].click();
            var filters = getFilters();
            var isSetTimerange = document.getElementById("time").checked;

            var data = [];
            if (filters.length === 0) {
                data.push({ filters: [] });
            } else {
                data.push({ filters: [filters] });
            }

            //save dashboard name
            data.push({ name: dashboardName });

            //save types
            data.push({ types: store.getState().types });

            //save also time?
            if (isSetTimerange) {
                data.push({ timerange: store.getState().timerange });
            }


            var tls = store.getState().user["tls-cn"] !== "N/A" ? store.getState().user["tls-cn"] : "";
            var checksum = store.getState().profile[0] ? store.getState().profile[0].userprefs.validation_code : "";
            var domainID = store.getState().user.domainID !== "N/A" ? store.getState().user.domainID : "";
            var Url = "api/filters/save";
            try {
                const response = await fetch(Url, {
                    method: "POST",
                    body: JSON.stringify({
                        id: this.uid(),
                        title: filterTitle,
                        domain: domainID,
                        "tls-cn": tls,
                        "validation_code": checksum,
                        attribute: data
                    }),
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": "include"
                    }
                });
                var result = await response.json();
                if (response.status !== 200) {
                    console.info("Problem with storing filter: " + result.msg);
                    alert("Problem with storing filter: " + result.msg);
                }
                else {
                    console.info("Storing filter: " + JSON.stringify(result));
                    document.getElementById("saveFiltersClose").click();
                }
            } catch (error) {
                console.error(error);
                alert("Problem with saving filter. " + error);
            }
        }
    }

    render() {
        var filters = getFilters();
        var dashboard = window.location.pathname;
        return (
            <span>
                <p className="modalText" > <b>Title: </b><input type="text" id="filterTitle" style={{ "width": "400px" }} dashboard={dashboard} /></p>
                <p>include timerange?  <input type="checkbox" id="time" /></p>
                <div className="modalText" >
                    <b>Active filters:</b>
                    {filters.length === 0 && <p className="tab" >No active filters</p>}
                    {filters.map((item) => <p className="tab" key={item.id}>{item.title}</p>)}
                </div>
                <button type="button"
                    className="btn btn-primary filterButtonClose"
                    filter={this.props.title}
                    onClick={this.save}
                    style={{ "float": "right" }}> Save
                </button>
            </span>
        );
    }
}

export default SaveFilters;
