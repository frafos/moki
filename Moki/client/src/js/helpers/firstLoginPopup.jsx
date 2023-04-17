import React, { Component } from 'react';
import { isHostnameOrIp, isHostname } from './isHostnameOrIp';
import querySrv from './querySrv';

const ccmAddrLabel = "Hostname or IP of CCM";
const ccmProxiedLabel = "Proxy CCM behind monitor";

export default class FirstLoginPopup extends Component {

    constructor(props) {
        super(props);
        this.state = {
            error: ""
        };
        this.save = this.save.bind(this);
        this.keyDown = this.keyDown.bind(this);
    }

    // Check whether two hostnames belong to the same domain, like:
    // 'ccm.example.com' and 'monitor.example.com'
    isFromSameDomain(val1, val2){
        // Return part of the string behind 2nd last dot. E.g. from 'mon.example.com' it return the 'example.com'
        function getDomain(val){
            // get position of last dot
            let lastDot = val.lastIndexOf('.');
            if (lastDot < 0) return '';

            // get position of 2nd last dot
            lastDot = val.lastIndexOf('.', lastDot-1);
            if (lastDot < 0) return '';

            return val.slice(lastDot + 1);
        }

        const dom1 = getDomain(val1);
        const dom2 = getDomain(val2);

        if (!dom1 || !dom2 || dom1 !== dom2) return false;
        return true;
    }

    validate(){

        const ccmAddr = document.getElementById("ccmAddr").value;
        const ccmProxied = document.getElementById("ccmProxied").checked;

        if (ccmAddr.trim() === "") {
            this.setState({ "error": `${ccmAddrLabel} must be filled.` });
            return false;
        }

        if (!isHostnameOrIp(ccmAddr)) {
            this.setState({ "error": `${ccmAddrLabel} must contain hostname or IP address.` });
            return false;
        }

        if (!ccmProxied){
            if (!isHostname(window.location.hostname)) {
                this.setState({ "error": `When CCM is not proxied behind monitor, the monitor shall be accessed by hostname, not by IP address.` });
                return false;
            }

            if (!isHostname(ccmAddr)) {
                this.setState({ "error": `When CCM is not proxied behind monitor ${ccmAddrLabel} must contain hostname.` });
                return false;
            }

            if (!this.isFromSameDomain(ccmAddr, window.location.hostname)){
                this.setState({ "error": `When CCM is not proxied behind monitor, the hostname in ${ccmAddrLabel} field must belong to the same domain as the monitor.` });
                return false;
            }
        }

        return true;
    }

    async save() {
        this.setState({ "error": "" });

        if (!this.validate()) return;

        document.getElementById("createR").style.display = "none";
        document.getElementById("create").style.display = "block";

        const ccmAddr = document.getElementById("ccmAddr").value;
        const ccmProxied = document.getElementById("ccmProxied").checked;

        try {
            var response = await querySrv("api/firsttimelogin/save", {
                method: "POST",
                body:
                    JSON.stringify({
                        ccmAddr    : ccmAddr,
                        ccmProxied : ccmProxied
                    }),
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            })

            if (response.status !== 200) {
                document.getElementById("createR").style.display = "block";
                document.getElementById("create").style.display = "none";
                this.setState({ "error": "Problem to save values." });
            }

            var res = await response.json();
            if (res.error) {
                this.setState({ "error": res.error });
                document.getElementById("createR").style.display = "block";
                document.getElementById("create").style.display = "none";
            }
            else {
                // var thiss = this;
                setTimeout(function () {
                    // thiss.props.setFirstTimeLogin(false);
                    window.location.reload();
                }, 10000);
            }
        }
        catch (error) {
            this.setState({ "error": error });
            document.getElementById("createR").style.display = "block";
            document.getElementById("create").style.display = "none";
        }
    }

    keyDown(e){
        if (e.key === "Enter") {
            e.preventDefault();
            this.save();
          }
    }

    render() {
        return (
            <div className="popupOverlay" style={{ "visibility": "visible" }}>
                <div id="popupsmall" style={{ "maxWidth": "550px" }}>
                    <h3 style={{ "marginBottom": "15px" }}>Address of CCM is not set. Please enter hostname of CCM used for user authentication:</h3>
                    <div className="row align-items-center">
                        <label className="col-md-6 col-form-label" htmlFor="ccmAddr" style={{ "color": "grey" }}>{ccmAddrLabel}</label>
                        <input type="text" id="ccmAddr" required className="form-control col" onKeyDown={(e) => this.keyDown(e)} />
                    </div>
                    <div className="row align-items-center">
                        <label className="col-md-6 col-form-label" htmlFor="ccmProxied" style={{ "color": "grey" }}>{ccmProxiedLabel}</label>
                        <div className="form-check col">
                            <input type="checkbox" id="ccmProxied" className="mb-0" />
                        </div>
                    </div>
                    <p className='text-center font-italic' style={{ "fontSize": "11px", "color": "grey" }}>
                        If the checkbox is checked, the CCM is proxied behind monitor for authentication purposes.
                        This allow e.g. to use monitor GUI via SSH tunnel as everything is behind single IP address,
                        but single-sign-on to CCM GUI does not work.
                        If the checkbox is unchecked, single-sign-on should work if configured properly. E.g. you should
                        use FQDN instead of IP address for accessing monitor and CCM.
                    </p>
                    {this.state.error ? <p className="error" style={{"color": "red"}}>{this.state.error}</p> : ""}
                    <div style={{ "textAlign": "center" }} className="mt-4">
                        <button onClick={this.save} style={{ "marginRight": "5px" }} className="btn btn-primary"><i className="fa fa-circle-o-notch fa-spin" id="create" style={{ "display": "none" }}></i> <span id="createR">Save</span> </button>
                    </div>
                </div>
            </div>
        )
    }
}


