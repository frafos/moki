import React, {
    Component
} from 'react';
import store from "@/js/store";
import { getFilters } from '../../gui';
import querySrv from '../helpers/querySrv';

class SaveFilters extends Component {
    constructor(props) {
        super(props);
        this.save = this.save.bind(this);
        this.state = {
            filters: []
        }
    }

    async componentDidMount(){
        var filters = await getFilters();
        this.setState({filters: filters});
    }

    uid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async save(event) {

        const { types, timerange } = store.getState().filter;
        const { user, profile } = store.getState().persistent;
        
        var filterTitle = document.getElementById("filterTitle").value;
        if (filterTitle === "") {
            alert("You have to fill filter title.");
        } else {
            var dashboardName = document.getElementById("filterTitle").getAttribute("dashboard");
            document.getElementsByClassName("close")[0].click();
            var filters = await getFilters();
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
            data.push({ types });

            //save also time?
            if (isSetTimerange) {
                data.push({ timerange });
            }


            var tls = user["tls-cn"] !== "N/A" ? user["tls-cn"] : "";
            var checksum = profile[0] ? profile[0].userprefs.validation_code : "";
            var domainID = user.domainID !== "N/A" ? user.domainID : "";
            var Url = "api/filters/save";
            try {
                const response = await querySrv(Url, {
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
        var filters = this.state.filters;
        var dashboard = window.location.pathname;
        return (
            <span>
                <p className="modalText" > <b>Name: </b><input type="text" id="filterTitle" style={{ "width": "400px" }} dashboard={dashboard} /></p>
                <p><b>Timerange:</b><input type="checkbox" id="time" style={{"verticalAlign": "middle", "marginLeft": "5px"}}/> </p>
                <div className="modalText" >
                    <b>Active filters:</b>
                    {filters.length === 0 && <p className="tab" >No active filters</p>}
                    {filters.length > 0 && filters.map((item) => <p className="tab" key={item.id}>{item.title}</p>)}
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
