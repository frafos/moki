import React, { Component } from 'react';
import { elasticsearchConnection } from '../../gui';
import { parseTableHits, decrypt } from '../../es-response-parser';
import storePersistent from "../store/indexPersistent";

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

        try {

            var name = window.location.pathname.substr(1);
            if (name === "connectivityCA" || name === "connectivity" || name === "home" || name === "microanalysis") {
                name = "overview";
            }

            var size = 10000;
            if (storePersistent.getState().settings && storePersistent.getState().settings[0]) {
                for (let hit of storePersistent.getState().settings[0].attrs) {
                    if (hit.attribute === "query_size") {
                        size = hit.value;
                        continue;
                    }
                }
            }
            // Retrieves the list of calls
            var calls = await elasticsearchConnection(name + "/table", { "size": size, "type": "export", "fce": this.showDownloadingSize });
            //parse data
            if (calls && calls.hits && calls.hits.hits && calls.hits.hits.length > 0) {
                var data = await parseTableHits(calls.hits.hits, storePersistent.getState().profile, "export");

                this.setState({
                    data: data
                });

                window.notification.remove(5);


                //if not encrypt mode, download directly
                if (!(storePersistent.getState().profile && storePersistent.getState().profile[0] && storePersistent.getState().profile[0].userprefs.mode === "encrypt")) {
                    this.export();
                }

                /*
                                const visitNodes = (obj, visitor, stack = []) => {
                                    if (typeof obj === 'object') {
                                        for (let key in obj) {
                                            visitNodes(obj[key], visitor, [...stack, key]);
                                        }
                                    } else {
                                        let path = stack.map(i => "['" + i + "']");
                                        visitor(stack.join('.'), obj, path.join(''));
                                    }
                                }
                
                                //list of all attrs  
                                if (data[0]) {
                                    var attributes = [];
                                    for (let hit of data) {
                                        visitNodes(hit._source, (attr, value, path) => {
                                            if (!attributes.filter(e => e.attr === attr).length > 0) {
                                                attributes.push({
                                                    attr: attr,
                                                    path: path
                                                })
                                            }
                                        });
                                    }
                                    this.setState({ attributes: attributes });
                                }*/
            }
            else {
                /* this.setState({
                     error: "Problem to get data from elasticsearch"
                 })*/

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
    /*
        convertToCSV(objArray) {
            var array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
            var str = '';
    
            for (var i = 0; i < array.length; i++) {
                var line = '';
                for (var index in array[i]) {
                    if (line !== '') line += ','
    
                    line += array[i][index];
                }
    
                str += line + '\r\n';
            }
    
            return str;
        }
    */
    async export() {
        /*  const attributesState = this.state.attributes;
          var attributes = [];
          //get rid of uncheck columns
          for (var i = 0; i < attributesState.length; i++) {
              var el = document.getElementById(attributesState[i].attr);
              if (el && el.checked) {
                  attributes.push(attributesState[i]);
              }
          }
  
          //progressText
          this.setState({
              showProgressBar: true,
              progressText: "Adding only selected columns ....",
              progressValue: 10
          }, () => continueFce(attributes, this));
  
          async function continueFce(attributes, thiss){
              var result = data;
              var data = thiss.state.data;
              */
        //       var event = {};
        //         result = data;
        /*
                    function set(path, value) {
                        var schema = event;  // a moving reference to internal objects within obj
                        var pList = path.split('.');
                        var len = pList.length;
                        for (var i = 0; i < len - 1; i++) {
                            var elem = pList[i];
                            if (!schema[elem]) schema[elem] = {}
                            schema = schema[elem];
                        }
            
                        schema[pList[len - 1]] = value;
                    }
        
                    for (i = 0; i < data.length; i++) {
                        if (i % 10 === 0) {
                            thiss.updateProgressBar(i);
                        }
        
                        for (let hit of attributes) {
                            try {
                                if (eval("data[i]._source" + hit.path)) {
                                    let value = eval("data[i]._source" + hit.path) ? eval("data[i]._source" + hit.path) : " ";
                                    set(hit.attr, value);
                                }
                            } catch (e) {
        
                            }
                        }
                        result.push(event);
                        event = {};
                    }
            
                    thiss.setState({
                        showProgressBar: false,
                        progressText: "",
                        progressValue: 0
                    });
        
        */

        var result = this.state.data;
        //check if should be decrypted
        var isDecrypt = document.getElementById("decryptCheckbox") ? document.getElementById("decryptCheckbox").checked : false;
        if (isDecrypt) {
            //show progress bar
            this.setState({ showProgressBar: true, progressText: "Decrypting...." });
            result = await decrypt(storePersistent.getState().profile, result, [], this.updateProgressBar);
            this.setState({ showProgressBar: false });
        }


        /* if (attributes.length === 0) {
             alert("No data selected");
         } else {
             */
        const element = document.createElement("a");
        var file = "";
        //no csv export anymore, if so, need to add column list to result
        /* if (this.props.type === "CSV") {
             var jsonObject = JSON.stringify(result);
             result = this.convertToCSV(jsonObject);
             element.download = "data.csv";
             if (storePersistent.getState().profile && storePersistent.getState().profile[0] && storePersistent.getState().profile[0].userprefs.mode === "encrypt") {
                 element.download = "data_decrypted.csv"
             }
             file = new Blob([result], { type: 'text/plain' });
         }
         else {*/
        //JSON

        element.download = "data.json";
        if (isDecrypt) {
            element.download = "data_decrypted.json"
        }
        file = new Blob([JSON.stringify(result, null, 1)], { type: 'text/plain' });
        // }
        element.href = URL.createObjectURL(file);
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        //close export window
        this.props.close();

    }

    /*
        checkAll() {
            let checkboxes = document.getElementsByClassName("exportCheckbox");
            let isChecked = document.getElementById("allCheckExport").checked;
            for (let hit of checkboxes) {
                hit.checked = isChecked;
            }
        }
    */
    render() {
        /*
                function isSearchable(field) {
        
                    var searchable = getSearchableFields();
                    searchable.push("@timestamp");
                    for (var j = 0; j < searchable.length; j++) {
                        if (searchable[j] === field) {
                            return true;
                        }
                    }
                    return false;
                }
                */
            return (
                <span className="exportBody">
                    <div className="row">
                        {!this.state.data && <span style={{ "width": "100%" }}><span style={{ "color": "grey", "fontSize": "larger", "marginLeft": "1%" }} id="loadingExport"> {this.state.dialogMsg}</span></span>}
                        {(this.state.data && this.state.data.length === 0) && <span style={{ "width": "100%" }}><i className="fa fa-circle-o-notch fa-spin" style={{ "color": "grey", "width": "10px", "height": "10px", "marginLeft": "5%" }}></i><span style={{ "color": "grey", "fontSize": "larger", "marginLeft": "1%" }} id="loadingExport"> {this.state.dialogMsg}</span><span style={{ "color": "grey", "fontSize": "larger" }}>{this.state.downloadValue !== 0 ? " Downloading data size: " + this.state.downloadValue : ""}</span></span>}
                    </div>
                    <div className="row">
                        {(this.state.data && this.state.data.length !== 0) && storePersistent.getState().profile && storePersistent.getState().profile[0] && storePersistent.getState().profile[0].userprefs.mode === "encrypt" && <span style={{ "marginTop": "10px", "marginLeft": "2px" }}><input type="checkbox" id="decryptCheckbox" className="decryptCheckbox" defaultChecked={false} /><label style={{ "paddingBottom": "11px", "color": "grey", "fontSize": "larger" }}>Decrypt data. It could take a few minutes.</label></span>}
                        {this.state.showProgressBar && <div className="row" style={{ "width": "65%", "marginLeft": "2px", "color": "grey", "fontSize": "larger" }}><div id="Progress_Status" className="col">  <div id="myprogressBar" style={{ "width": this.state.progressValue + "%" }}></div>  </div>{this.state.progressValue + "%"}<div>{this.state.progressText}</div></div>}
                        {(this.state.data && this.state.data.length !== 0) && storePersistent.getState().profile && storePersistent.getState().profile[0] && storePersistent.getState().profile[0].userprefs.mode === "encrypt" && <button className="btn btn-default rightButton" onClick={this.export}>{"Export"} </button>}
                    </div>
                </span>

            )
    }
}

export default Export;