import React, {
    Component
} from 'react';
import SavingScreen from '../helpers/SavingScreen';
import isIP from '../helpers/isIP';
import querySrv from '../helpers/querySrv';

import deleteIcon from "/icons/delete_grey.png";
import editIcon from "/icons/edit_grey.png";

class Settings extends Component {
    constructor(props) {
        super(props);
        this.load = this.load.bind(this);
        this.save = this.save.bind(this);
        this.saveExclude = this.saveExclude.bind(this);
        this.deleteExclude = this.deleteExclude.bind(this);
        this.saveToFile = this.saveToFile.bind(this);
        this.updateExclude = this.updateExclude.bind(this);
        this.searchExclude = this.searchExclude.bind(this);
        this.resetExclude = this.resetExclude.bind(this);
        this.checkAll = this.checkAll.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.state = {
            data: [],
            checkboxIPall: true,
            checkboxURIall: true,
            checkboxSYSTEMall: true,
            checkboxCAall: true,
            wait: false,
            excludesData: [],
            excludesDataOldFormat: [],
            excludesDataAll: []
        }
    }

    componentWillMount() {
        this.load("api/setting");
    }

    /*
       Load data
       */
    async load(url) {
        var jsonData;
        try {
            const response = await querySrv(url, {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            });
            jsonData = await response.json();
            var result = [];
            jsonData.forEach(data => {
                if (data.app === "m_alarms")
                    result = data.attrs
            });
            var excludes = [];
            //set state of checkboxes
            for (var i = 0; i < result.length; i++) {
                if (!result[i].attribute.includes("exclude")) {
                    var name = result[i].name + "checkbox";
                    this.setState({
                        [name]: result[i].value === -1 ? false : true
                    });
                }
            }

            for (i = 0; i < result.length; i++) {
                if (result[i].attribute.includes("exclude")) {
                    excludes.push(result[i]);
                    result.splice(i, 1);
                }

            }

            /*translate exludes data to different format:
            id: id,
            value: IP/URI,
            comment: [comments],
            alarms: [alarms]
            */

            var dataChangeFormat = [];
            for (i = 0; i < excludes.length; i++) {
                for (var j = 0; j < excludes[i].value.length; j++) {
                    //record with this IP/URI already exists
                    var exists = false;
                    for (var k = 0; k < dataChangeFormat.length; k++) {
                        if (dataChangeFormat[k].value === excludes[i].value[j]) {
                            exists = true;
                            dataChangeFormat[k].alarms.push(excludes[i].name);
                        }
                    }
                    if (!exists) {
                        dataChangeFormat.push({
                            value: excludes[i].value[j],
                            comment: excludes[i].comments[j],
                            alarms: [excludes[i].name]
                        });
                    }
                }

            }

            this.setState({
                data: result,
                excludesData: dataChangeFormat,
                excludesDataAll: dataChangeFormat,
                excludesDataOldFormat: excludes
            });

            console.info("Got alarms data " + JSON.stringify(result));

        } catch (error) {
            console.error(error);
            alert("Problem with receiving alarms data. " + error);
        }

    }




    //save data
    save() {
        if (this.state.wait !== true) {
            var jsonData = this.state.data;
            var result = [];
            for (var i = 0; i < jsonData.length; i++) {
                var data = document.getElementById(jsonData[i].attribute);
                var checkbox = document.getElementById(jsonData[i].name + "checkbox");

                if (checkbox && !checkbox.checked) {
                    jsonData[i].value = -1;
                } else {
                    if (data) {
                        jsonData[i].value = data.value;
                    }
                }

                result.push({
                    attribute: jsonData[i].attribute,
                    value: jsonData[i].value
                });

            };

            this.saveToFile();
        }
    }


    //save exclude data
    async saveExclude(type) {
        if (type === "IP") {
            var label = document.getElementById("labelExcludeIP").value;
            var comments = document.getElementById("commentExcludeIP").value;
            var oldValue = document.getElementById("labelExcludeIP").getAttribute("oldValue");
            var checkboxes = document.getElementsByClassName("excludeIP");
        }
        else {
            label = document.getElementById("labelExcludeURI").value;
            comments = document.getElementById("commentExcludeURI").value;
            oldValue = document.getElementById("labelExcludeURI").getAttribute("oldValue");
            checkboxes = document.getElementsByClassName("excludeURI");

        }

        if (this.state.wait !== true) {
            if (type === "IP" && !isIP(label)) {
                alert("Error: " + label + " must have format IP format");
            }
            else if (label === "") {
                alert("Error: write also label");
            }
            else if (comments === "") {
                alert("Error: write also comment");
            }
            else {
                var jsonData = this.state.excludesData;
                var backupData = this.state.excludesData;
                var isUpdate = -1;
                for (var j = 0; j < jsonData.length; j++) {
                    if (jsonData[j].value === oldValue) {
                        isUpdate = j;
                    }
                }

                var alarms = [];
                for (var i = 0; i < checkboxes.length; i++) {
                    if (checkboxes[i].checked) {
                        alarms.push(checkboxes[i].getAttribute("name"));
                    }
                }

                //create new
                if (isUpdate === -1) {
                    jsonData.push({
                        value: label,
                        comment: comments,
                        alarms: alarms
                    });
                }
                //update
                else {
                    jsonData[isUpdate].value = label;
                    jsonData[isUpdate].comment = comments;
                    jsonData[isUpdate].alarms = alarms;

                }

                this.setState({
                    excludesData: jsonData,
                    excludesDataAll: jsonData
                });


                var result = await this.saveToFile();
                //ok saving
                if (result) {
                    document.getElementById("popupExcludeIP").style.display = "none";
                    document.getElementById("popupExcludeURI").style.display = "none";


                    //delete values from form
                    document.getElementById("labelExcludeIP").value = "";
                    document.getElementById("commentExcludeIP").value = "";
                    checkboxes = document.getElementsByClassName("excludeIP");
                    for (j = 0; j < checkboxes.length; j++) {
                        if (checkboxes[j].checked) {
                            checkboxes[j].checked = false;
                        }
                    }

                }
                //problem with saving, retrieve old data
                else {
                    this.setState({
                        excludesData: backupData,
                        excludesDataAll: backupData
                    });

                }
            }

        }
    }

    //write all data to file
    async saveToFile() {
        //change data format for exclude back
        var excludeDataOld = this.state.excludesDataOldFormat;
        var excludeData = this.state.excludesData;
        //delete old records
        for (var i = 0; i < excludeDataOld.length; i++) {
            excludeDataOld[i].value = [];
            excludeDataOld[i].comments = [];
        }

        for (i = 0; i < excludeDataOld.length; i++) {
            for (var j = 0; j < excludeData.length; j++) {
                for (var k = 0; k < excludeData[j].alarms.length; k++) {
                    if (excludeDataOld[i].name === excludeData[j].alarms[k]) {
                        if (!excludeDataOld[i].value.includes(excludeData[j].value)) {
                            excludeDataOld[i].value.push(excludeData[j].value);
                            excludeDataOld[i].comments.push(excludeData[j].comment);

                        }

                    }
                }
            }

        }

        //concat alarm data with exclude data
        var result = this.state.data.concat(excludeDataOld);
        this.setState({ wait: true });
        var thiss = this;
        await querySrv("api/save", {
            method: "POST",
            body: JSON.stringify({
                "app": "m_alarms",
                "attrs": result

            }),
            credentials: 'include',
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": "include"
            }
        }).then(function (response) {
            thiss.setState({ wait: false });
            if (!response.ok) {
                console.error(response.statusText);
                return false;
            }
            return response.json();

        }).then(function (responseData) {
            if (responseData === false || responseData.msg.includes("error")) {
                alert(responseData.msg);
                return false;
            }
            //alert(responseData.msg);
            return true;
        }).catch(function (error) {
            console.error(error);
            alert("Problem with saving data. " + error);
            return false;
        });

        return true;

    }


    //uncheck or check all types
    checkAll(type) {
        var checkboxes = document.getElementsByClassName(type);
        var isChecked = document.getElementById("checkbox" + type + "all").checked;
        //this.state[data[i].name + "checkbox"]
        for (var j = 0; j < checkboxes.length; j++) {
            var name = checkboxes[j].id;
            this.setState({
                [name]: isChecked
            });
        }

    }

    showPopupIP() {
        document.getElementById("popupExcludeIP").style.display = "block";
    }

    closePopupIP() {
        document.getElementById("popupExcludeIP").style.display = "none";
    }

    showPopupURI() {
        document.getElementById("popupExcludeURI").style.display = "block";
    }

    closePopupURI() {
        document.getElementById("popupExcludeURI").style.display = "none";
    }

    /*showAllPopup(){
        document.getElementById("excludeAllPopup").style.display = "block";
    }

    closeAllPopup(){
    document.getElementById("excludeAllPopup").style.display = "none";
    }
    */

    //delete exclude record
    deleteExclude(e) {
        var deleteAttribute = e.currentTarget.id;
        var data = this.state.excludesData;

        for (var j = 0; j < data.length; j++) {
            if (data[j].value === deleteAttribute) {
                data.splice(j, 1);
            }
        }
        if (this.saveToFile()) {
            this.setState({
                excludesData: data,
                excludesDataAll: data
            });
        }
    }

    //reset search
    resetExclude() {
        this.setState({ excludesData: this.state.excludesDataAll });
    }
    //update exclude record
    updateExclude(e) {
        var id = e.currentTarget.getAttribute("id");
        var data = this.state.excludesData;
        //get to know if it's URI or IP type
        if (isIP(id)) {
            for (var j = 0; j < data.length; j++) {
                if (data[j].value === id) {
                    document.getElementById("labelExcludeIP").value = data[j].value;
                    document.getElementById("labelExcludeIP").setAttribute("oldValue", data[j].value);

                    document.getElementById("commentExcludeIP").value = data[j].comment;

                    for (var i = 0; i < data[j].alarms.length; i++) {
                        document.getElementById(data[j].alarms[i] + "checkboxIP").checked = true;
                    }
                    break;
                }
            }
            document.getElementById("popupExcludeIP").style.display = "block";
        }
        else {
            for (j = 0; j < data.length; j++) {
                if (data[j].value === id) {
                    document.getElementById("labelExcludeURI").value = data[j].value;
                    document.getElementById("labelExcludeURI").setAttribute("oldValue", data[j].value);

                    document.getElementById("commentExcludeURI").value = data[j].comment;

                    for (i = 0; i < data[j].alarms.length; i++) {
                        document.getElementById(data[j].alarms[i] + "checkboxURI").checked = true;
                    }
                    break;
                }
            }
            document.getElementById("popupExcludeURI").style.display = "block";
        }

    }

    //search with wildcard
    matchRuleShort(str, rule) {
        var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|[]\/\\])/g, "\\$1");
        return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
    }

    searchExclude() {
        var data = this.state.excludesData;
        var searchValue = document.getElementById("searchExclude").value;
        document.getElementById("searchExclude").value = "";
        var dataFilter = [];
        for (var i = 0; i < data.length; i++) {
            if (this.matchRuleShort(data[i].value, searchValue)) {
                data[i].value = [data[i].value];
                dataFilter.push(data[i]);
            }
        }
        this.setState({ excludesData: dataFilter });
        this.generateExclude(dataFilter, 10);

    }

    //generate div with exclude records, set length limit
    generateExclude(data, limit) {
        //change format to IP/URI
        var div = [];
        data = this.state.excludesData;

        div.push(<div className="btn-group" key="buttons">
            <input className="form-control" type="text" id="searchExclude" />
            <button type="button"
                className="btn btn-primary"
                onClick={this.searchExclude}>Search IP/URI</button>
            <button type="button"
                className="btn btn-secondary"
                onClick={this.resetExclude}>Reset</button>
        </div>);

        if (data.length === 0) {
            div.push(<div key="nodata" style={{
                "marginTop": "50px", "textAlign": "center"
            }}>No exclude IP/URI</div>);
            return div;
        }


        limit = data.length < limit ? data.length : limit;
        for (var i = 0; i < limit; i++) {
            div.push(<div className="row tab"
                key={
                    data[i].value + "checkbox"
                } style={{ "marginBottom": "5px" }}>
                <td style={{ "width": "70px", "textAlign": "start", "overflowWrap": "break-word" }}>
                    <img onClick={this.deleteExclude} className="tabletd iconDelete" id={data[i].value} alt="deleteIcon" src={deleteIcon} title="delete" />

                    <img className="iconEdit tabletd" alt="editIcon" src={editIcon} title="edit" onClick={this.updateExclude} id={data[i].value} style={{ "marginLeft": "5px" }} />
                </td><td style={{ "width": "15%", "textAlign": "start", "overflowWrap": "break-word" }}>
                    <h3 className="tabSmall">{data[i].value}</h3></td>  <td className="tab" style={{ "width": "35%", "textAlign": "start", "overflowWrap": "break-word" }}>{data[i].comment}</td>  <td className="tab" style={{ "width": "40%", "textAlign": "start", "overflowWrap": "break-word" }}>{data[i].alarms.join()}</td></div>);
        }
        return div;

    }



    handleInputChange(event) {
        const target = event.target;
        const value = target.checked;
        const name = target.id;
        this.setState({
            [name]: value
        });
    }

    //generate div with alarms records
    generate(dataAlarm) {
        var alarms = [];
        var data = dataAlarm;
        if (data.length !== 0) {
            var children = [];
            // Outer loop to create parent
            for (var i = 0; i < data.length; i++) {
                var nextName = data[i + 1] ? data[i + 1].name : "";

                //Inner loop to create children
                if (data[i].name === nextName) {
                    children.push(<div className="row tab"
                        key={
                            data[i].attribute + "key"
                        } > <label className="col-sm-2 control-label" > {
                            data[i].label
                        } </label><input className="form-control" type={data[i].type} defaultValue={data[i].value} id={data[i].attribute} /> </div>);
                }
                else {
                    //Create the parent and add the children
                    children.push(<div key={
                        data[i].attribute + "key"
                    }
                        className="row tab"> <label className="col-sm-2 control-label" > {
                            data[i].label
                        } </label><input className="form-control" type={data[i].type} defaultValue={data[i].value} id={data[i].attribute} /> </div>);
                    alarms.push(<div key={
                        data[i].attribute + "key"
                    }
                        className="tab pb-2" > < span className="form-inline" >
                            < input className={
                                data[i].category
                            }
                                type="checkbox"
                                id={
                                    data[i].name + "checkbox"
                                }
                                value={
                                    this.state[data[i].name + "checkbox"]
                                }
                                checked={
                                    this.state[data[i].name + "checkbox"]
                                }
                                onChange={this.handleInputChange}
                            /> <h3 className="tabSmall">{data[i].name}</h3 > </span>{children}</div>); children = [];
                }

            }
            return alarms
        }
    }


    render() {

        var data = this.state.data;
        var IPtype = [];
        var URItype = [];
        var Systemtype = [];
        var CAtype = [];

        //separate type
        for (var i = 0; i < data.length; i++) {
            if (data[i].category === "SYSTEM") {
                Systemtype.push(data[i]);
            } else if (data[i].category === "URI") {
                URItype.push(data[i]);
            } else if (data[i].category === "IP") {
                IPtype.push(data[i]);
            }
            else if (data[i].category === "CA") {
                CAtype.push(data[i]);
            }
        }

        var excludeData = this.generateExclude(this.state.excludesData, 10);
        var URIdata = this.generate(URItype);
        var IPdata = this.generate(IPtype);
        var Systemdata = this.generate(Systemtype);
        var CAdata = this.generate(CAtype);

        return (<div className="container-fluid" >
            {this.state.wait && <SavingScreen />}
            <span className="form-inline settingsH form-horizontal" > <div>Exclude IP/URI</div></span>
            <div className="Advanced popupExclude" id="popupExcludeIP">
                <button className="close" onClick={this.closePopupIP}>
                    &times;
                </button>
                <div >
                    <span className="form-inline form-horizontal" key="ip" >
                        <label className="col-sm-2 control-label"> IP</label>
                        <input className="form-control" type="text" id="labelExcludeIP" />
                    </span>
                    <span className="form-inline form-horizontal" key="uri">
                        <label className="col-sm-2 control-label" > Comment </label>
                        <input className="form-control" type="text" id="commentExcludeIP" />
                    </span>

                    {this.state.excludesDataOldFormat.filter(c => c.label.includes("IP")).map(category =>
                        <span className="form-inline form-horizontal" key={category.name}>
                            <input className="form-check-input excludeIP" type="checkbox" name={category.name} id={category.name + "checkboxIP"} />       < label className="col-sm-7 control-label" >
                                {category.name} </label>
                        </span>

                    )}

                    <div className="btn-group rightButton" >
                        <button type="button"
                            className="btn btn-primary "
                            onClick={() => this.saveExclude("IP")}
                            style={
                                {
                                    "marginRight": "5px"
                                }
                            } > Save </button>
                    </div>
                </div>
            </div>
            <div className="Advanced popupExclude" id="popupExcludeURI">
                <button className="close" onClick={this.closePopupURI}>
                    &times;
                </button>
                <div >
                    <span className="form-inline form-horizontal" >
                        <label className="col-sm-2 control-label"> URI</label>
                        <input className="form-control" type="text" id="labelExcludeURI" />
                    </span>
                    <span className="form-inline form-horizontal" >
                        <label className="col-sm-2 control-label" > Comment </label>
                        <input className="form-control" type="text" id="commentExcludeURI" />
                    </span>

                    {this.state.excludesDataOldFormat.filter(c => c.label.includes("URI")).map(category =>
                        <span className="form-inline form-horizontal" key={category.name}>
                            <input className="form-check-input excludeURI" type="checkbox" name={category.name} id={category.name + "checkboxURI"} />       < label className="col-sm-7 control-label" >
                                {category.name} </label>
                        </span>
                    )}

                    <div className="btn-group rightButton" >
                        <button type="button"
                            className="btn btn-primary "
                            onClick={() => this.saveExclude("URI")}
                            style={
                                {
                                    "marginRight": "5px"
                                }
                            } > Save </button>
                    </div>
                </div>
            </div>


            <div style={{ "textAlign": "end", "marginTop": "15px" }}>
                {excludeData}
            </div>

            <button className="btn  btn-primary" alt="ipexclude" title="add IP exclude" id="addExcludeIP" onClick={this.showPopupIP} >Add IP</button>
            <button className="btn  btn-primary" alt="uriexclude" title="add URI exclude" id="addExcludeURI" onClick={this.showPopupURI} >Add URI</button>


            <div key="URI"
                 className="top chart" >

                <span className="form-inline settingsH form-horizontal mb-2" >
                    <input type="checkbox"
                        id="checkboxURIall"
                        className="form-check-input mb-0"
                        defaultChecked={
                            this.state.checkboxURIall
                        }
                        onClick={
                            () => this.checkAll("URI")
                        }
                    /> <div> URI TYPE ALARMS</div>
                </span>

                { URIdata }
            </div>


            <div key="IP"
                 className="top chart" >

                <span className="form-inline settingsH form-horizontal mb-2" > < input type="checkbox"
                        id="checkboxIPall"
                        className="form-check-input mb-0"
                        defaultChecked={
                            this.state.checkboxIPall
                        }
                        onClick={
                            () => this.checkAll("IP")
                        }
                    /><div>IP TYPE ALARMS</div>
                </span>

                { IPdata }
            </div>


            <div key="System"
                 className="top chart" >

                <span className="form-inline settingsH form-horizontal mb-2" > <input type="checkbox"
                    id="checkboxSYSTEMall"
                    className="form-check-input mb-0"
                    defaultChecked={
                        this.state.checkboxSYSTEMall
                    }
                    onClick={
                        () => this.checkAll("SYSTEM")
                    } /><div>  SYSTEM TYPE ALARMS</div>
                </span>

                { Systemdata }
            </div>

            <div key="CA"
                 className="top chart" >

                <span className="form-inline settingsH form-horizontal mb-2" > <input type="checkbox"
                    id="checkboxCAall"
                    className="form-check-input mb-0"
                    defaultChecked={
                        this.state.checkboxCAall
                    }
                    onClick={
                        () => this.checkAll("CA")
                    }
                    /><div>  CA TYPE ALARMS</div>
                </span>

                { CAdata }
            </div>



            <div className="btn-group rightButton" >
                <button type="button"
                    className="btn btn-primary "
                    onClick={
                        this.save
                    }
                    style={
                        {
                            "marginRight": "5px"
                        }
                    } > Save </button> <
                        button type="button"
                        className="btn btn-secondary"
                        onClick={
                            () => this.load("api/defaults")
                        } > Reset </button> </div> </div>
        )
    }

}

export default Settings;
