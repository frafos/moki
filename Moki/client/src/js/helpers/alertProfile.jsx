import { Component } from 'react';
import { parseTimestamp } from "./parseTimestamp";
import storePersistent from "../store/indexPersistent";
import querySrv from './querySrv';
import { cipherAttr } from '../../gui';

import clipboardIcon from "/icons/clipboard.png";
import removeIcon from "/icons/delete_lightgrey.png";

const DATEFORMATS = ["lastModified", "created", "lastLogin", "lastExceeded", 
    "ts", "lastRaised", "lastLaunchedTimer", "lastRaisedTS", "lastExceededTS", 
    "timestamp", "lastTimerTS", "lastExpired", "lastReceivedTimer"];

class AlertProfile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: this.props.data,
            result: null
        }
        this.renderAlertProfile = this.renderAlertProfile.bind(this);
        this.resetProfile = this.resetProfile.bind(this);
        this.load = this.load.bind(this);
    }

    componentDidMount() {
        this.load();
    }

    async get(url) {
        try {
            const response = await querySrv(url, {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            });
            var jsonData = await response.json();

            if (jsonData.statusCode && jsonData.statusCode === 404) {
                alert(jsonData.statusDescription);
                return;
            }

            return jsonData;
        } catch (error) {
            console.error(error);
            alert("Problem with receiving data. " + error);
            return;
        }
    }

    async resetProfile() {
        await this.get("api/alertapi/rmprofile?keyRef=" + this.state.data.alert.key.keyRef);
        this.setState({
            data: [],
            result: []
        })
    }

    //copy value in table to clipboard and show msg
    copyToclipboard(value, id) {
        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = value;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);

        if (!id) {
            id = value;
        }

        document.getElementById("copyToClipboardText" + id).style.display = "inline";
        setTimeout(function () {
            document.getElementById("copyToClipboardText" + id).style.display = "none";
        }, 1000);
    }

    async load() {
        let result = null;
        let profile = storePersistent.getState().profile;
        let mode = profile[0].userprefs.mode;
        let storedProfile = localStorage.getItem('profile');
        if (storedProfile) {
            storedProfile = JSON.parse(storedProfile);
            mode = storedProfile[0].userprefs.mode;
        }

        if (this.state.data.alert && this.state.data.alert.key && this.state.data.alert.key.keyRef) {
            result = await this.get("api/alertapi/getprofile?keyRef=" + this.state.data.alert.key.keyRef);
        }
        else {
            if (this.state.data.IP) {
                let ip = this.state.data.ipaddr;
                if (mode === "encrypt") {
                    if (!this.state.data.encrypt.includes("plain")) {
                        ip = await cipherAttr("attrs.source", this.state.data.ipaddr, profile, "encrypt");
                    }
                }
                result = await this.get("api/alertapi/getprofile?keyval=" + ip + "&keyname=ip");

            }
            else if (this.state.data.URI) {
                let uri = this.state.data.URI;
                if (mode === "encrypt") {
                    if (!this.state.data.encrypt.includes("plain")) {
                        uri = await cipherAttr("attrs.from", this.state.data.URI, profile, "encrypt");
                    }
                }
                result = await this.get("api/alertapi/getprofile?keyval=" + uri + "&keyname=uri");

            }
        }
        //add exceeded name from settings
        if (!result || (result && result.statusCode)) {
            this.close();
        }
        else {

            if (storePersistent.getState().layout.types.exceeded) {
                for (let item of Object.keys(result.Item)) {
                    for (let template of storePersistent.getState().layout.types.exceeded) {
                        if (template.id === item) {
                            result.Item[item + " - " + template.name] = result.Item[item];
                            delete result.Item[item];
                        }
                    }
                }
            }

            //decrypt IP or URI if necessary
            if (profile[0].userprefs.mode === "encrypt") {
                if (result.Item.IP) {
                    //remove hmac
                    if (!result.Item.IP.includes("plain")) {
                        let ip = result.Item.IP.substring(result.Item.IP.indexOf("#") + 1);
                        result.Item.IP = await cipherAttr("attrs.source", ip, profile, "decrypt");

                    }
                }

                if (result.Item.URI) {
                    result.Item.URI = await cipherAttr("attrs.from", result.Item.URI, profile, "decrypt");
                }
            }

            this.setState({
                result: result.Item
            })
        }
    }

    close() {
        document.getElementsByClassName("popup-overlay ")[0].click();
    }

    renderAlertProfile(data) {
        if (data === null) {
            return <div>getting data...</div>
        }
        else if (Object.keys(data).length === 0) {
            return <div>no data to display</div>
        }
        else {
            var result = [];
            var style = null;
            for (let row of Object.keys(data)) {
                if (this.state.data.exceeded.includes(row)) {
                    style = { "color": "var(--main)" };
                }
                if (typeof data[row] === 'object') {
                    result.push(<div key={row} style={style}><b style={{ "display": "inline" }}>{row}</b></div>)
                    for (let row2 of Object.keys(data[row])) {
                        if (typeof data[row][row2] === 'object') {
                            result.push(<div key={row + "-" + row2} ><b style={{ "display": "inline", "marginLeft": "15px" }}>{row2}</b></div>)
                            for (let row3 of Object.keys(data[row][row2])) {
                                if (DATEFORMATS.includes(row3)) {
                                    result.push(<div key={Math.random()} ><b style={{ "display": "inline", "marginLeft": "30px" }}>{row3}:</b><p style={{ "display": "inline", "marginLeft": "10px" }}>{parseTimestamp(data[row][row2][row3] * 1000)}</p></div>)
                                }
                                else {
                                    result.push(<div key={Math.random()} ><b style={{ "display": "inline", "marginLeft": "30px" }}>{row3}:</b><p style={{ "display": "inline", "marginLeft": "10px" }}>{data[row][row2][row3]}</p></div>)

                                }
                            }
                        }
                        else {
                            if (DATEFORMATS.includes(row2)) {
                                result.push(<div key={Math.random()} ><b style={{ "display": "inline", "marginLeft": "15px" }}>{row2}:</b><p style={{ "display": "inline", "marginLeft": "10px" }}>{parseTimestamp(data[row][row2] * 1000)}</p></div>)
                            }
                            else {
                                result.push(<div key={Math.random()} ><b style={{ "display": "inline", "marginLeft": "15px" }}>{row2}:</b><p style={{ "display": "inline", "marginLeft": "10px" }}>{data[row][row2]}</p></div>)

                            }
                        }
                    }
                } else {
                    if (DATEFORMATS.includes(row)) {
                        result.push(<div key={Math.random()} ><b style={{ "display": "inline" }}>{row}:</b><p style={{ "display": "inline", "marginLeft": "10px" }}>{parseTimestamp(data[row] * 1000)}</p></div>);
                    }
                    else {
                        result.push(<div key={Math.random()} ><b style={{ "display": "inline" }}>{row}:</b><p style={{ "display": "inline", "marginLeft": "10px" }}>{data[row]}</p></div>);

                    }
                }
                style = null;
            }
            return result;
        }
    }


    render() {
        return (
            <div className="row no-gutters" >
                <span>
                    <button className="link close" onClick={() => this.copyToclipboard(JSON.stringify(this.state.result), "Profile")} style={{ "position": "absolute", "right": "28px", "top": "1px" }}>
                        <img className="icon" alt="clipboardIcon" src={clipboardIcon} title="copy to clipboard" />
                    </button>
                    <span id={"copyToClipboardTextProfile"} className="copyToClip" style={{ "position": "absolute", "right": "28px", "top": "18px" }}>copied to clipboard</span>
                </span>
                <img onClick={() => this.resetProfile()} title="reset profile" src={removeIcon} style={{ "cursor": "pointer", "height": "16px", "marginLeft": "88%", "color": "#B8B8B8" }} />
                <div onClick={() => this.close()} style={{ "cursor": "pointer", "marginLeft": "97%", "color": "#B8B8B8", "marginTop": "-15px" }}>X</div>
                <div style={{ "marginRight": "5px", "marginTop": "20px" }} className="preStyle">
                    {this.renderAlertProfile(this.state.result)}
                </div>
            </div>
        )
    }
}

//check if IP is blacklisted
export async function checkBLip(ob, type = "ipblack", shouldCipherAttr = true, shouldReturnObject = false) {
    try {
        let hmac = ob.encrypt;
        if (hmac && hmac !== "plain") hmac = hmac.substring(0, hmac.indexOf(":"));
        let profile = storePersistent.getState().profile;
        let key = ob.attrs.source;
        if (shouldCipherAttr) {
            key = await cipherAttr("attrs.source", ob.attrs.source, profile, "encrypt");
        }

        let url = "api/bw/getip" + "?key=" + key + "&list=" + type;
        const response = await querySrv(url, {
            method: "GET",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": "include"
            }
        });
        var jsonData = await response.json();

        if (jsonData.statusCode && jsonData.statusCode === 404) {
            console.error(jsonData.statusDescription);
        }
        else {
            //no result
            if (jsonData && !jsonData.Item) {
                return false;
            }
            else {
                if (shouldReturnObject && jsonData.Item.constructor === Object  && Object.keys(jsonData.Item).length !== 0) {
                    return jsonData.Item;
                }
                else {
                    return true;
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
    return false;
}

export default AlertProfile;


