import React, {
    Component
} from 'react';
import querySrv from '../helpers/querySrv';
import SavingScreen from '../helpers/SavingScreen';


class Settings extends Component {
    constructor(props) {
        super(props);
        this.load = this.load.bind(this);
        this.save = this.save.bind(this);
        this.state = {
            data: [],
            checkboxIPall: true,
            checkboxURIall: true,
            checkboxALERTall: true,
            checkboxCAall: true,
            wait: false
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
                if (data.app === "m_sns")
                    result = data.attrs
            });
            this.setState({
                data: result
            });

            console.info("Got SNS settings data ");
            console.info(result);

            //set state of checkboxes and checkbox
            for (var i = 0; i < result.length; i++) {

                if (result[i].value === "true" || result[i].value === "false") {

                    var name = result[i].attribute + "checkbox";
                    this.setState({
                        [name]: result[i].value === "false" ? false : true
                    });
                }
            }

        } catch (error) {
            console.error(error);
            alert("Problem with receiving data. " + error);
        }

    }


    //save data
    async save() {
        if (this.state.wait !== true) {
            var jsonData = this.state.data;
            var result = [];
            for (var i = 0; i < jsonData.length; i++) {
                var attribute = document.getElementById(jsonData[i].attribute);
                //disable
                var checkbox = document.getElementById(jsonData[i].attribute + "checkbox");
                if (checkbox && !checkbox.checked) {
                    jsonData[i].value = "false";

                } else if (checkbox && checkbox.checked) {
                    jsonData[i].value = "true";
                } else {
                    jsonData[i].value = attribute.value;
                }
                result.push({
                    attribute: jsonData[i].attribute,
                    value: jsonData[i].value
                });
            };


            console.info("New settings data: " + JSON.stringify(result));

            this.setState({ wait: true });
            var thiss = this;
            await querySrv("api/save", {
                method: "POST",
                body: JSON.stringify({
                    "app": "m_sns",
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
                }
                return response.json();

            }).then(function (responseData) {
                alert(responseData.msg);
            }).catch(function (error) {
                console.error(error);
                alert("Problem with saving data. " + error);
            });
        }
    }


    //uncheck or check all types
    checkAll(type) {
        var checkboxes = document.getElementsByClassName(type);
        var isChecked = document.getElementById("checkbox" + type + "all").checked;
        for (var j = 0; j < checkboxes.length; j++) {
            var name = checkboxes[j].id;
            this.setState({
                [name]: isChecked
            });

        }

    }



    generateGeneralData(dataAlarm) {
        var data = dataAlarm;
        var alarms = [];
        if (data.length !== 0) {
            for (var i = 0; i < data.length; i++) {
                //checkbox
                if (data[i].value === "true" || data[i].value === "false") {
                    alarms.push(<div key={
                        data[i].attribute + "key"
                    }
                    > <span className="form-inline justify-content-start paddingBottom"> <input type="checkbox"
                        className={
                            data[i].type + " form-check-input"
                        }
                        id={
                            data[i].attribute + "checkbox"
                        }
                        defaultChecked={
                            this.state[data[i].attribute + "checkbox"]
                        }
                    /> <label className="tabSmall">{data[i].label}</label> </span></div>);
                } else {
                    //group of alarms
                    alarms.push(<div className="no-gutters" key={
                        data[i].attribute + "key"
                    }
                    > <span className="form-inline row justify-content-start paddingBottom"> <label className="col-2"> {
                        data[i].label
                    } </label><input className="text-left form-control" type={data[i].type} defaultValue={data[i].value ? data[i].value : data[i].default} id={data[i].attribute} /> </span></div>);
                }
            }
        }
        return alarms
    }


    render() {

        var data = this.state.data;
        var IPtype = [];
        var CAtype = [];
        var URItype = [];
        var Alerttype = [];
        var Generaltype = [];

        //separate type
        for (var i = 0; i < data.length; i++) {
            if (data[i].type === "SYSTEM") {
                Alerttype.push(data[i]);
            } else if (data[i].type === "URI") {
                URItype.push(data[i]);
            } else if (data[i].type === "IP") {
                IPtype.push(data[i]);
            } else if (data[i].type === "CA") {
                CAtype.push(data[i]);
            } else {
                Generaltype.push(data[i]);
            }
        }

        var Generaldata = this.generateGeneralData(Generaltype);
        var URIdata = this.generateGeneralData(URItype);
        var IPdata = this.generateGeneralData(IPtype);
      //  var Alertdata = this.generateGeneralData(Alerttype);
        var CAdata = this.generateGeneralData(CAtype);

        return (<div className="container-fluid">
            { this.state.wait && <SavingScreen />}
            {
                Generaldata
            }
            <div><p className="settingsSNS"> < input type="checkbox"
                defaultChecked={
                    this.state.checkboxURIall
                }
                className="form-check-input"
                id="checkboxURIall"
                onClick={
                    () => this.checkAll("URI")
                }
            /> URI TYPE</p>
                <div key="URI"
                    className="top" style={{ "marginLeft": "10px" }} > {
                        URIdata
                    } </div></div>
            <div> <p className="settingsSNS">
                <input type="checkbox"
                    defaultChecked={
                        this.state.checkboxIPall
                    }
                    className="form-check-input"
                    id="checkboxIPall"
                    onClick={
                        () => this.checkAll("IP")
                    }
                /> IP TYPE </p>
                <div key="IP"
                    className="top" style={{ "marginLeft": "10px" }}> {
                        IPdata
                    } </div></div><div>

                <p className="settingsSNS"> < input id="checkboxKEYall"
                    type="checkbox"
                    className="form-check-input"
                    defaultChecked={
                        this.state.checkboxALERTall
                    }
                    onClick={
                        () => this.checkAll("SYSTEM")
                    }
                /> SYSTEM TYPE </p>
                <div key="CA"
                    className="top" style={{ "marginLeft": "10px" }}> {
                        CAdata
                    } </div></div>
                     <div><p className="settingsSNS"> < input type="checkbox"
                defaultChecked={
                    this.state.checkboxCAall
                }
                className="form-check-input"
                id="checkboxCAall"
                onClick={
                    () => this.checkAll("CA")
                }
            /> CA TYPE</p>
                <div key="URI"
                    className="top" style={{ "marginLeft": "10px" }} > {
                        URIdata
                    } </div></div>

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
                    } > Save </button> <button type="button"
                        className="btn btn-secondary"
                        onClick={
                            () => this.load("api/defaults")
                        } > Reset </button> </div> </div>
        )
    }

}

export default Settings;
