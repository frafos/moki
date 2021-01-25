/*
Input: event with attributes
//download event, pcap and sequence chart in zip file     
*/
import { downloadPcap } from './downloadPcap';
import { downloadSD } from './downloadSD';
var FileSaver = require('file-saver');
var JSZip = require("jszip");

export async function downloadAll(obj) {
    var fileName = obj.attrs.filename;
    fileName = fileName ? fileName.substring(0, fileName.length - 5) : "";
    fileName = fileName ? fileName.substring(fileName.lastIndexOf("/") + 1) : Math.random().toString(36).substring(7);

    var zip = new JSZip();

    //export json (always exists)
    var json = new Blob([JSON.stringify(obj)], { type: 'text/plain' });
    zip.file(fileName + ".json", json);

    //download sd
    var sd = await downloadSD(obj.attrs.filename);
    if (sd && !sd.includes("Error")) {
        zip.file(fileName + ".html", sd);
    }


    //download pcap
    await downloadPcap(obj.attrs.filename).then(function (data) {
        fileName = fileName ? fileName.substring(fileName.lastIndexOf("/") + 1) : Math.random().toString(36).substring(7);
        if (typeof data !== 'string' || !data.includes("ERROR")) {
            var blob = new Blob([data], { type: "pcap" });
            zip.file(fileName + ".pcap", blob);
        }
    })

    zip.generateAsync({ type: "blob" })
        .then(function (blob) {
            FileSaver.saveAs(blob, "export.zip");
        });
}

