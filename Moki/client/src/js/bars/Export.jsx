import { Component } from 'react';
import { elasticsearchConnection } from '../../gui';
import { parseTableHits } from '../../es-response-parser';
import store from "@/js/store";

const BASE_URL = import.meta.env.BASE_URL;

class Export extends Component {
    constructor(props) {
        super(props);
        this.loadData = this.loadData.bind(this);
        this.export = this.export.bind(this);
        this.updateProgressBar = this.updateProgressBar.bind(this);
    }

    updateProgressBar(text) {
        window.notification.update({ errno: 5, text: text, level: "info" });
    }

    async loadData() {
        window.notification.showError({ errno: 5, text: "Downloading data, it can take a while! ", level: "info" });
        const { settings, profile } = store.getState().persistent;

        try {

            let name = window.location.pathname.substr(1);
            if (name === "connectivityCA" || name === "connectivity" || name === "home" || name === "microanalysis") {
                name = "overview";
            }

            let size = 10000;
            if (settings && settings[0]) {
                for (const hit of settings[0].attrs) {
                    if (hit.attribute === "query_size") {
                        size = hit.value;
                        continue;
                    }
                }
            }
            // Retrieves the list of calls
            let calls = await elasticsearchConnection(name + "/table", { "size": size, "type": "export" });
            const totalHits = calls.hits.total.value;
            let actualHits = calls.hits.hits.length;
            let exportData = [];

            this.updateProgressBar("Downloading data... total: " + totalHits + ", downloaded: " + actualHits);

            //parse data and store it
            if (calls && calls.hits && calls.hits.hits && calls.hits.hits.length > 0) {
                while (actualHits < totalHits) {
                    this.updateProgressBar("Downloading data... total: " + totalHits + ", downloaded: " + actualHits);
                    let data = await parseTableHits(calls.hits.hits, profile, "export", true);

                    //blobData: this.state.blobData + JSON.stringify(data)
                    // blobData: [...this.state.blobData, ...data]
                    // exportData +  Buffer.from(JSON.stringify(data)).toString('base64');
                    //new Blob([Buffer.from(exportData, 'base64').toString('ascii')], { type: "application/json" });

                   // exportData = exportData + new Blob([JSON.stringify(data)], { type: "application/json" });
                   exportData =  exportData +  JSON.stringify(data); 

                    //get new scroll data
                    try {

                        let fetchCalls = await fetch(BASE_URL + "api/scroll", {
                            method: "POST",
                            timeout: 60000,
                            credentials: 'include',
                            body: JSON.stringify({ scroll_id: calls._scroll_id }),
                            headers: {
                                "Content-Type": "application/json",
                                "Access-Control-Allow-Credentials": "include",
                                "Access-Control-Expose-Headers": "Content-Length"
                            }
                        });

                        calls = await fetchCalls.json();
                        actualHits = actualHits + calls.hits.hits.length;

                        //export partially
                        if (actualHits % 500000 === 0) {
                            await this.export(exportData, true);
                            exportData = [];
                        }

                    } catch (error) {
                        return error;
                    }
                }
                //last round of data parse
                let data = await parseTableHits(calls.hits.hits, profile, "export", false);

                //clean scroll
                try {
                    fetch(BASE_URL + "api/cleanScroll", {
                        method: "POST",
                        timeout: 60000,
                        credentials: 'include',
                        body: JSON.stringify({ scroll_id: calls._scroll_id }),
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Credentials": "include",
                            "Access-Control-Expose-Headers": "Content-Length"
                        }
                    });
                } catch (error) {

                }

                exportData =  exportData +  JSON.stringify(data); 


                //export
                this.updateProgressBar("Downloading data... total: " + totalHits + ", downloaded: " + totalHits);
                this.export(exportData);
            }
            else {
                window.notification.update({ errno: 5, text: "Nothing to export.", level: "info" });
            }

        } catch (error) {
            window.notification.update({ errno: 5, text: "Problem to get data from elasticsearch. " + error, level: "error" });
            console.error(error);
        }
    }

    //create an element and export data
    //partialExport - fot not closing export notification
    async export(exportData, partialExport) {
        const { timerange } = store.getState().filter;
        const gte = timerange[0];
        const lte = timerange[1];

        const element = document.createElement("a");
        let file = ""
        element.download = "export-"+new Date(gte).toISOString()+"-"+new Date(lte).toISOString()+".json";
        // file = new Blob([this.state.blobData], { type: "text/plain" });
        // file = new Blob([JSON.stringify(this.state.blobData, null, 2)], { type: "application/json" });
        // new Blob([Buffer.from(exportData, 'base64').toString('ascii')], { type: "application/json" });
        try {
            file = new Blob([exportData], { type: "application/json" })
        }
        catch (error) {
            window.notification.update({ errno: 5, text: "Problem to export data - out of memory.", level: "info" });
            return;
        }

        element.href = URL.createObjectURL(file);
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();

        if (!partialExport) {
            window.notification.remove(5);
        }
        return;
    }

    render() {
        return <button onClick={() => this.loadData()} className="btn">Export</button>;
    }
}

export default Export;