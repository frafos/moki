import React, {
    Component
} from 'react';
import SavingScreen from '../helpers/SavingScreen';
import isNumber from '../helpers/isNumber';
import isIP from '../helpers/isIP';
import { isHostnameOrIp }  from '../helpers/isHostnameOrIp';
import isEmail from '../helpers/isEmail';
import deleteIcon from "../../styles/icons/delete_grey.png";
import { elasticsearchConnection } from '@moki-client/gui';
import storePersistent from "../store/indexPersistent";
import Popup from "reactjs-popup";
import detailsIcon from "../../styles/icons/details.png";
import { setSettings } from "../actions/index";
import querySrv from '../helpers/querySrv';

class Certificate extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cert: null
        }
        this.getCertificate = this.getCertificate.bind(this);
    }

    async componentDidMount() {
        await this.getCertificate(this.props.cert);
    }

    async getCertificate(cert) {
        //parse cert with OpenSSL
        try {
            const response = await querySrv("/api/parse/certificate", {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                },
                body: JSON.stringify({
                    cert: cert,
                    type: this.props.type
                })
            });
            var jsonData = await response.json();
        }
        catch (error) {
            this.setState({ cert: { error: error } });
        }

        this.setState({ cert: jsonData.msg });
    }


    render() {
        return (
            <span>
                {!this.state.cert && <span>Parsing certificate</span>}
                {this.state.cert && this.state.cert.error && <span>{this.state.cert.error}</span>}
                {this.state.cert && !this.state.cert.error && <span>{this.state.cert}</span>}
            </span>
        )
    }
}

class Settings extends Component {
    constructor(props) {
        super(props);
        this.load = this.load.bind(this);
        this.save = this.save.bind(this);
        this.check = this.check.bind(this);
        this.generate = this.generate.bind(this);
        this.removeFile = this.removeFile.bind(this);
        this.checkboxClick = this.checkboxClick.bind(this);
        this.state = {
            data: [],
            wait: false,
            tags: this.props.tags,
            shouldDisplayCAcert: false,
        }
    }

    UNSAFE_componentWillMount() {
        this.load("/api/setting");
    }


    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.tags !== this.props.tags) {
            this.setState({
                tags: nextProps.tags
            });
        }

    }

    checkboxClick(_attribute) {
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
                if (data.app === "m_config")
                    result = data.attrs
            });

            //check if ldap is enabled to show ldap option settings
            for (let hit of result) {
                //special case: check for event_tls_verify_peer bool
                if (hit.attribute === "tls_cert_verify_level" && hit.value > 0) {
                    this.setState({
                        shouldDisplayCAcert: true,
                    });
                }
            }
            this.setState({
                data: result
            });
            console.info("Got general settings data " + JSON.stringify(result));

        } catch (error) {
            console.error(error);
            alert("Problem with receiving settings data. " + error);
        }

    }

    //remove loaded file from state
    removeFile(attr) {
        var jsonData = this.state.data;
        for (let hit of jsonData) {
            if (hit.attribute === attr) {
                hit.value = "";
                continue
            }
        }

        this.setState({ data: jsonData })
    }


    clickHandlerHTML(e) {
        let el = e.target;
        if (el.className === "expandJson") {
            if (el.innerText === '-') {
                el.setAttribute("expand", 'false');
                el.innerText = "+";
                el.nextSibling.style.display = "none";
            }
            else {
                el.setAttribute("expand", 'true');
                el.innerText = "-";
                el.nextSibling.style.display = "inline";
            }
        }
    }


    async validate(attribute, value, label, restriction, required = false) {
        if (required && value === "") {
            return "Error: field '" + label + "' must be filled.";
        }

        if (restriction) {
            restriction = JSON.parse(restriction);

            if (restriction.max) {
                value = parseInt(value);
                if (value > restriction.max) return "Error: field '" + label + "' must be lower than " + restriction.max;
            }

            if (restriction.min) {
                value = parseInt(value);

                if (value < restriction.min) return "Error: field '" + label + "' must be higher than " + restriction.min;
            }

            if (restriction.type === "ip") {
                if (value.length === 0) {
                    return true;
                }
                var checkValue = value.split(' ');
                var i = checkValue.map(x => isIP(x));
                if (i.includes(false)) {
                    return "Error: field '" + label + "' must have format IP or subnet format.";
                }
            }

            if (restriction.type === "email") {
                if (value.length === 0) {
                    return true;
                }

                if (isEmail(value)) {
                    return true;
                }
                return "Error: field '" + label + "' must have email format.";
            }

            if (restriction.type === "number") {
                if (isNumber(value)) {
                    return true;
                }
                return "Error: field '" + label + "' must be integer.";
            }


            if (restriction.type === "hostnameOrIp") {
                if (value === "") return true;
                else if (isHostnameOrIp(value)) {
                    return true;
                }
                return "Error: field '" + label + "' must contain hostname or IP address";
            }

            return true;
        }

        if (attribute === "slowlog_query_warn" || attribute === "slowlog_query_info" || attribute === "slowlog_fetch_warn" || attribute === "slowlog_fetch_info" || attribute === "slowlog_indexing_info" || attribute === "slowlog_indexing_warn" || attribute === "refresh_interval_logstash" || attribute === "refresh_interval_collectd" || attribute === "refresh_interval_exceeded") {
            if (value.slice(-1) === "s" && isNumber(value.slice(0, value.length - 1)) && value.slice(0, value.length - 1) % 1 === 0) {
                return true;
            }
            return "Error:  field '" + label + "' must have format integer and s suffix.";
        }

        return true;
    }

    async check(attribute, value, label, restriction, required) {
        var error = await this.validate(attribute, value, label, restriction, required);
        if (error !== true) {
            this.setState({
                [attribute]: error
            })
        }
        else {
            if (attribute === "tls_cert_verify_level") {
              this.setState({ shouldDisplayCAcert: value > 0 });
            }
            this.setState({ [attribute]: "", })
        }
    }


    //save data
    async save() {
        if (this.state.wait !== true) {
            var jsonData = this.state.data;
            var result = [];

            for (let i = 0; i < jsonData.length; i++) {
                let data = document.getElementById(jsonData[i].attribute);

                if (jsonData[i].type === "file" && !data) {
                    result.push({
                        attribute: jsonData[i].attribute,
                        value: jsonData[i].value
                    });
                }

                if (data) {
                    //for event_tls_verify_peer you need to load also cert file  && data.checked
                    if (data.id === "tls_cert_verify_level" && data.value > 0) {
                        let cert = document.getElementById("event_tls_cacert");
                        if (cert?.value === "") {
                            alert("You must load also 'CA cert to check for TLS events input' when 'Peer certificate verification level' is not 'ignore peer certificate'");
                            return;
                        }
                    };

                    if (data.type === "checkbox") {
                        jsonData[i].value = data.checked;
                    }
                    else if (data.type === "file" && data.files[0]) {
                        async function parseJsonFile(file) {
                            return new Promise((resolve, reject) => {
                                const fileReader = new FileReader()
                                fileReader.onload = event => resolve(JSON.parse(JSON.stringify(event.target.result)))
                                fileReader.onerror = error => reject(error)
                                fileReader.readAsText(file)
                            })
                        }
                        //if cert needs to key check, only if new file was loaded
                        if (jsonData[i].restriction && jsonData[i].restriction.key) {
                            let key = document.getElementById(jsonData[i].restriction.key);
                            if (!key || !key.files[0]) {
                                this.setState({
                                    [jsonData[i].restriction.key]: "Error:  field '" + jsonData[i].restriction.key + "' must have also key to certificate."
                                })
                                data.scrollIntoView();
                                return;
                            }
                        }
                        const object = await parseJsonFile(data.files[0]);
                        jsonData[i].value = object;//JSON.stringify(object);

                    }
                    else if (jsonData[i].attribute === "jwtAdmins" && !Array.isArray(jsonData[i].value)) {
                        jsonData[i].value = jsonData[i].value.split(",");

                    } else {
                        jsonData[i].value = data.value;
                    }

                    let required = jsonData[i].required;


                    var validateResult = await this.validate(jsonData[i].attribute, jsonData[i].value, jsonData[i].label, JSON.stringify(jsonData[i].restriction), required)
                    if (validateResult !== true) {
                        data.scrollIntoView();
                        alert(validateResult);
                        return;
                    }

                    result.push({
                        attribute: jsonData[i].attribute,
                        value: jsonData[i].value
                    });
                }

            };
            this.setState({
                wait: true
            });
            var thiss = this;
            await querySrv("api/save", {
                method: "POST",
                body: JSON.stringify({
                    "app": "m_config",
                    "attrs": result
                }),
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            }).then(function (response) {
                thiss.setState({
                    wait: false
                });
                if (!response.ok) {
                    console.error(response.statusText);
                }
                else {
                    //store new settings in storage
                    result.forEach(res => {
                        jsonData.forEach(data => {
                            if (data.attributes === res.attribute) {
                                data.value = res.value;
                            }
                        })
                    });
                    let settings = JSON.parse(JSON.stringify(storePersistent.getState().settings));
                    settings[0] = { app: "m_config", attrs: jsonData };
                    storePersistent.dispatch(setSettings(settings));
                }
                return response.json();
            }).then(function (responseData) {
                if (responseData.msg && responseData.msg !== "Data has been saved.") {
                    alert(JSON.stringify(responseData.msg));
                }

            }).catch(function (error) {
                console.error(error);
                alert("Problem with saving data. " + error);
            });
        }

    }



    generate(dataAlarm) {
        var data = dataAlarm;
        var alarms = [];
        if (data.length !== 0) {
            // Outer loop to create parent
            for (var i = 0; i < data.length; i++) {
                //special case: time format
                if (data[i].attribute === "dateFormat") {
                    alarms.push(
                        <div key={data[i].attribute + "key"} className="tab ">
                            <span className="form-inline row justify-content-start paddingBottom">
                                <span className="col-6" >
                                    <label> {data[i].label} </label>
                                    {data[i].details ? <div className="smallText">{data[i].details}</div> : ""}
                                </span>
                                {<select className="text-left form-control form-check-input" defaultValue={data[i].value} id={data[i].attribute} restriction={JSON.stringify(data[i].restriction)} label={data[i].label} isrequired={data[i].required  ? "true" : "false"} onChange={(e) => { this.check(e.target.getAttribute("id"), e.target.value, e.target.getAttribute("label"), e.target.getAttribute("restriction"), e.target.getAttribute("isrequired")) }} >
                                    <option value={"DD/MM/YYYY"} key={"20/12/2020"}>20/12/2020</option>
                                    <option value={"MM/DD/YYYY"} key={"12/20/2020"}>12/20/2020</option>
                                    <option value={"YYYY-MM-DD"} key={"2020-20-12"}>2020-20-12</option>
                                    <option value={"DD-MMM-YYYY"} key={"20-Dec-2020"}>20-Dec-2020</option>
                                    <option value={"DD MMM, YYYY"} key={"20 Dec, 2020"}>20 Dec, 2020</option>
                                    <option value={"MMM DD, YYYY"} key={"Dec 20, 2020"}>Dec 20, 2020</option>
                                </select>}
                            </span></div>);
                }
                //special case:  date format
                else if (data[i].attribute === "timeFormat") {
                    alarms.push(
                        <div key={data[i].attribute + "key"} className="tab ">
                            <span className="form-inline row justify-content-start paddingBottom">
                                <span className="col-6" >
                                    <label> {data[i].label} </label>
                                    {data[i].details ? <div className="smallText">{data[i].details}</div> : ""}
                                </span>
                                {<select className="text-left form-control form-check-input" defaultValue={data[i].value} id={data[i].attribute} restriction={JSON.stringify(data[i].restriction)} label={data[i].attribute} isrequired={data[i].required ?  "true" : "false"} onChange={(e) => { this.check(e.target.getAttribute("label"), e.target.value, e.target.getAttribute("restriction"), e.target.getAttribute("isrequired")) }} >
                                    <option value={"hh:mm:ss A"} key={"9:40 AM"}>7:40:20 AM</option>
                                    <option value={"HH:mm:ss"} key={"9:40:20"}>19:40:20</option>
                                </select>}
                            </span></div>);
                }
                //special case: number restriction
                else if (data[i].restriction && (data[i].restriction.min || data[i].restriction.max)) {
                    alarms.push(
                        <div key={data[i].attribute + "key"} className={data[i].attribute.includes("ldap") && !this.state.isLdap ? "tab hidden" : "tab"}>
                            <span className="form-inline row justify-content-start paddingBottom">
                                <span className="col-6" >
                                    <label> {data[i].label} </label>
                                    {data[i].details ? <div className="smallText">{data[i].details}</div> : ""}
                                </span>
                                {<input className="text-left form-control form-check-input" type="number" min={data[i].restriction.min} max={data[i].restriction.max ? data[i].restriction.max : ""} defaultValue={data[i].value} id={data[i].attribute} isrequired={data[i].required  ?  "true" : "false"} restriction={JSON.stringify(data[i].restriction)} label={data[i].label} onChange={(e) => { this.check(e.target.getAttribute("id"), e.target.value, e.target.getAttribute("label"), e.target.getAttribute("restriction"), e.target.getAttribute("isrequired")) }} />}
                                {this.state[data[i].attribute] ? <span className="col-3 errorStay" >{this.state[data[i].attribute]}</span> : ""}
                            </span></div>);
                }
                //special case: select input for enum type
                else if (data[i].restriction && data[i].restriction.type && data[i].restriction.type.enum) {
                    alarms.push(
                        <div key={data[i].attribute + "key"} className={data[i].attribute.includes("ldap") && !this.state.isLdap ? "tab hidden" : "tab"}>
                            <span className="form-inline row justify-content-start paddingBottom">
                                <span className="col-6" >
                                    <label> {data[i].label} </label>
                                    {data[i].details ? <div className="smallText">{data[i].details}</div> : ""}
                                </span>
                                {<select className="text-left form-control form-check-input" defaultValue={data[i].value} id={data[i].attribute} restriction={JSON.stringify(data[i].restriction)} label={data[i].label} isrequired={data[i].required  ?  "true" : "false"} onChange={(e) => { this.check(e.target.getAttribute("id"), e.target.value, e.target.getAttribute("label"), e.target.getAttribute("restriction"), e.target.getAttribute("isrequired")) }} >
                                    {data[i].restriction.type.enum.map((e, i) => {
                                        return (<option value={e.key} key={e.key}>{e.value}</option>)
                                    })}
                                </select>
                                }

                                {this.state[data[i].attribute] ? <span className="col-3 errorStay" >{this.state[data[i].attribute]}</span> : ""}
                            </span></div>);

                }
                else {
                    let cert = data[i].value;
                    let type = data[i].restriction && data[i].restriction.type ? data[i].restriction.type : "certificate";
                    alarms.push(
                        <div key={data[i].attribute + "key"} className={(!this.state.shouldDisplayCAcert && data[i].attribute === "event_tls_cacert") || (data[i].attribute.includes("ldap") && !this.state.isLdap && data[i].attribute !== "ldap_enable") ? "tab hidden" : "tab"}>
                            <span className="form-inline row justify-content-start paddingBottom">
                                <span className="col-6" >
                                    <label> {data[i].label} </label>
                                    {data[i].details ? <div className="smallText">{data[i].details}</div> : ""}
                                </span>
                                {data[i].type === "boolean" ? data[i].value ? <input className="text-left form-check-input" type="checkbox" defaultChecked="true" id={data[i].attribute} onClick={(e) => this.checkboxClick(e.target.getAttribute("id"))} /> :
                                    <input className="text-left form-check-input" type="checkbox" id={data[i].attribute} onClick={(e) => this.checkboxClick(e.target.getAttribute("id"))} />
                                    : data[i].type === "file" && data[i].value !== "" ? ""
                                        :
                                        <input className="text-left form-control form-check-input" type={data[i].type} autoComplete="off" accept={data[i].restriction && data[i].restriction.extensions ? data[i].restriction.extensions : null} defaultValue={data[i].type !== "file" ? data[i].value : ""}
                                            id={data[i].attribute} label={data[i].label} isrequired={data[i].required ?  "true" : "false"} restriction={JSON.stringify(data[i].restriction)} onChange={(e) => { this.check(e.target.getAttribute("id"), e.target.value, e.target.getAttribute("label"), e.target.getAttribute("restriction"), e.target.getAttribute("isrequired")) }} />

                                }
                                {data[i].type === "file" && data[i].value !== "" && cert ? <span style={{ "fontSize": "0.8rem" }}>{data[i].label}
                                    {type === "certificate" && <Popup trigger={<img className="icon" alt="detailsIcon" src={detailsIcon} title="details" />} modal>
                                        {close => (
                                            <div className="Advanced">
                                                <button className="close" onClick={close}>
                                                    &times;
                                                </button>
                                                <div className="contentAdvanced">
                                                    <pre><Certificate cert={cert}></Certificate> </pre>
                                                </div>
                                            </div>
                                        )}
                                    </Popup>}

                                    <img className="icon"
                                        alt="deleteIcon" src={deleteIcon}
                                        title="remove file"
                                        attr={data[i].attribute}
                                        onClick={(e) => this.removeFile(e.target.getAttribute("attr"))}
                                        id={data[i].key}
                                    /></span> : ""}

                                {this.state[data[i].attribute] ? <span className="col-3 errorStay" >{this.state[data[i].attribute]}</span> : ""}

                            </span></div>);
                }
            }
        }
        return alarms
    }

    generateTags() {
        var data = this.state.tags;

        var tags = [];
        if (data.length !== 0) {
            for (var i = 0; i < data.length; i++) {
                tags.push(<div key={data[i].key} className="tab">
                    <span className="form-inline row justify-content-start paddingBottom" >
                        <img className="icon"
                            alt="deleteIcon"
                            src={deleteIcon}
                            title="delete tag"
                            onClick={this.deleteTag.bind(this)}
                            id={data[i].key}
                        />
                        <label className="col-4" > {
                            data[i].key + " (" + data[i].doc_count + ")"
                        } </label>
                    </span>
                </div>);
            }
        } else {
            tags.push(< div className="tab" key="notags"> No tags. Create them directly in event's table.</div>);
        }
        return tags
    }

    async deleteTag(e) {
        var tag = e.currentTarget.id;
        var data = await elasticsearchConnection("/api/tag/delete", { id: "", index: "", tags: tag });
        if (data.deleted >= 0) {
            var tags = this.state.tags;
            for (var i = 0; i < tags.length; i++) {
                if (tags[i].key === tag) {
                    tags.splice(i, 1);
                }
            }
            //this.props.getTags();
            this.setState({
                tags: tags
            });
        } else {
            alert(JSON.stringify(data));
        }

    }


    render() {

        var data = this.state.data;
        var General = [];
        var Slowlog = [];
        var LE = [];
        var Events = [];
        var Auth = [];
        var Alarms = [];
        var SMTP = [];
        var TLS = [];

        //separate type
        for (var i = 0; i < data.length; i++) {
            if (data[i].category === "General") {
                General.push(data[i]);
            } else if (data[i].category === "Slowlog") {
                Slowlog.push(data[i]);
            } else if (data[i].category === "Logstash and elasticsearch") {
                LE.push(data[i]);
            } else if (data[i].category === "Events") {
                Events.push(data[i]);
            }
            else if (data[i].category === "Alarms") {
                Alarms.push(data[i]);
            }
            else if (data[i].category === "Authentication") {
                Auth.push(data[i]);
            }
            else if (data[i].category === "SMTP") {
                SMTP.push(data[i]);
            }
            else if (data[i].category === "TLS") {
                TLS.push(data[i]);
            }
        }

        var Generaldata = this.generate(General);
        var Slowlogdata = this.generate(Slowlog);
        var LEdata = this.generate(LE);
        var Eventsdata = this.generate(Events);
        var Authdata = this.generate(Auth);
        var SMTPdata = this.generate(SMTP);
        var Alarmsdata = this.generate(Alarms);
        var TLSsdata = this.generate(TLS);
        //        var Tagdata = this.generateTags();


        return (<div className="container-fluid" > {this.state.wait && < SavingScreen />}
            <div className="chart"><p className="settingsH" style={{ "marginTop": "30px" }}> General </p> {Generaldata} </div>
            <div className="chart"><p className="settingsH" > Authentication </p> {Authdata}</div>
            <div className="chart"><p className="settingsH" > TLS </p> {TLSsdata}</div>
            <div className="chart"><p className="settingsH" > SMTP </p> {SMTPdata}</div>
            <div className="chart"><p className="settingsH" > Alarms </p> {Alarmsdata} </div>
            <div className="chart"><p className="settingsH" > Events </p> {Eventsdata} </div>
            <div className="chart"><p className="settingsH" > Elasticsearch and logstash </p> {LEdata} </div>
            <div className="chart"><p className="settingsH" > Slowlog </p> {Slowlogdata} </div>
            <div className="btn-group rightButton" >
                <button type="button"
                    className="btn btn-primary "
                    onClick={this.save}
                    style={{ "marginRight": "5px" }} > Save </button>
                <button type="button"
                    className="btn btn-secondary"
                    onClick={() => this.load("api/defaults")} > Reset </button>
            </div >
        </div>
        )
    }

}

export default Settings;
