import React, { Component } from 'react';
import { elasticsearchConnection } from '../../gui';
import { parseTableHits, decrypt } from '../../es-response-parser';
import store from "@/js/store";

class Export extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: "",
            //attributes attrs+, @timestamp   
            attributes: [],
            exportOpen: false,
            error: "",
            progressValue: 0,
            showProgressBar: false,
            progressText: "",
            downloadValue: 0,
            dialogMsg: ""
        }
        this.loadData = this.loadData.bind(this);
        this.export = this.export.bind(this);
        this.showDownloadingSize = this.showDownloadingSize.bind(this);
        this.updateProgressBar = this.updateProgressBar.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.exportOpen !== prevState.exportOpen) {
            return { exportOpen: nextProps.exportOpen };
        }
        else return null;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.exportOpen !== this.props.exportOpen) {
            if (this.props.exportOpen === true ) {
                this.loadData();
            }
        }
    }

    updateProgressBar(value) {
        this.setState({ progressValue: Math.round((value / this.state.data.length) * 100) })
    }

    showDownloadingSize(value) {
        this.setState({ downloadValue: Math.round(value / 1000000) + "MB" })
        window.notification.update({ errno: 5, text: "Downloading data, it can take a while! Downloading " + Math.round(value / 1000000) + "MB", level: "info" });

    }

    async loadData() {
        this.setState({
            data: [],
            downloadValue: 0,
            dialogMsg: "Downloading data, it can take a while!"
        });
        window.notification.showError({ errno: 5, text: "Downloading data, it can take a while! ", level: "info" });

        const { settings, profile } = store.getState().persistent;

        try {

            var name = window.location.pathname.substr(1);
            if (name === "connectivityCA" || name === "connectivity" || name === "home" || name === "microanalysis") {
                name = "overview";
            }

            var size = 10000;
            if (settings && settings[0]) {
                for (const hit of settings[0].attrs) {
                    if (hit.attribute === "query_size") {
                        size = hit.value;
                        continue;
                    }
                }
            }
            // Retrieves the list of calls
            const calls = await elasticsearchConnection(name + "/table", { "size": size, "type": "export", "fce": this.showDownloadingSize });
            //parse data
            if (calls && calls.hits && calls.hits.hits && calls.hits.hits.length > 0) {
                var data = await parseTableHits(calls.hits.hits, profile, "export");

                this.setState({ data: data });
                window.notification.remove(5);

                //if not encrypt mode, download directly
                if (!(profile && profile[0] && profile[0].userprefs.mode === "encrypt")) {
                    this.export(data);
                }

            }
            else {

                window.notification.update({ errno: 5, text: "Nothing to export.", level: "info" });
                this.setState({
                    data: null,
                    dialogMsg: "No data in elasticsearch"
                });
                this.props.close();
            }

        } catch (error) {
            window.notification.update({ errno: 5, text: "Problem to get data from elasticsearch. "+error, level: "error" });
            this.setState({
                error: error,
                data: null,
                dialogMsg: "Problem to get data from elasticsearch"
            })
            this.props.close();
            console.error(error);
        }

    }

    async export(data) {

        let result = data;
        const { profile } = store.getState().persistent;

        //check if should be decrypted
        const isDecrypt = document.getElementById("decryptCheckbox") ? document.getElementById("decryptCheckbox").checked : false;

        if (isDecrypt) {
            //show progress bar
            this.setState({ showProgressBar: true, progressText: "Decrypting...." });
            result = await decrypt(profile, result, [], this.updateProgressBar);
            this.setState({ showProgressBar: false });
        }

        const element = document.createElement("a");
        element.download = "data.json";
        if (isDecrypt) {
            element.download = "data_decrypted.json"
        }

        const file = new Blob([JSON.stringify(result, null, 1)], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        //close export window
        this.props.close();
    }

    render() {
        const { profile } = store.getState().persistent;
        return (
            <span className="exportBody">
                <div className="row">
                    {!this.state.data && <span style={{ "width": "100%" }}><span style={{ "color": "grey", "fontSize": "larger", "marginLeft": "1%" }} id="loadingExport"> {this.state.dialogMsg}</span></span>}
                    {(this.state.data && this.state.data.length === 0) && <span style={{ "width": "100%" }}><i className="fa fa-circle-o-notch fa-spin" style={{ "color": "grey", "width": "10px", "height": "10px", "marginLeft": "5%" }}></i><span style={{ "color": "grey", "fontSize": "larger", "marginLeft": "1%" }} id="loadingExport"> {this.state.dialogMsg}</span><span style={{ "color": "grey", "fontSize": "larger" }}>{this.state.downloadValue !== 0 ? " Downloading data size: " + this.state.downloadValue : ""}</span></span>}
                </div>
                <div className="row">
                    {(this.state.data && this.state.data.length !== 0) && profile && profile[0] && profile[0].userprefs.mode === "encrypt" && <span style={{ "marginTop": "10px", "marginLeft": "2px" }}><input type="checkbox" id="decryptCheckbox" className="decryptCheckbox" defaultChecked={false} /><label style={{ "paddingBottom": "11px", "color": "grey", "fontSize": "larger" }}>Decrypt data. It could take a few minutes.</label></span>}
                    {this.state.showProgressBar && <div className="row" style={{ "width": "65%", "marginLeft": "2px", "color": "grey", "fontSize": "larger" }}><div id="Progress_Status" className="col">  <div id="myprogressBar" style={{ "width": this.state.progressValue + "%" }}></div>  </div>{this.state.progressValue + "%"}<div>{this.state.progressText}</div></div>}
                    {(this.state.data && this.state.data.length !== 0) && profile && profile[0] && profile[0].userprefs.mode === "encrypt" && <button className="btn btn-default rightButton" onClick={this.export}>{"Export"} </button>}
                </div>
            </span>
        )
    }
}

export default Export;