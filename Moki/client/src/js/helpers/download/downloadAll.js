/*
Input: event with attributes
//download event, pcap and sequence chart in zip file     
*/
import { downloadPcap } from './downloadPcap';
import { downloadSD } from './downloadSD';
import storePersistent from "../../store/indexPersistent";

import FileSaver from "file-saver"
import JSZip from "jszip"

export async function downloadAll(obj) {
    var fileName = obj.attrs.filename;
    fileName = fileName ? fileName.substring(0, fileName.length - 5) : "";
    fileName = fileName ? fileName.substring(fileName.lastIndexOf("/") + 1) : Math.random().toString(36).substring(7);

    var zip = new JSZip();

    //export json (always exists)
    var json = new Blob([JSON.stringify(obj)], { type: 'text/plain' });
    if (storePersistent.getState().profile[0] && storePersistent.getState().profile[0].userprefs.mode === "encrypt") {
        fileName = fileName + "_decrypted";
    }
    zip.file(fileName + ".json", json);

    if (obj.attrs.filename) {
        //download sd
        var sd = await downloadSD(obj.attrs.filename);
        if (sd && !sd.includes("Error")) {
            zip.file(fileName + ".html", sd);
        }
    }

    if (obj.attrs.filename) {
        //download pcap
        await downloadPcap(obj.attrs.filename).then(function (data) {
            fileName = fileName ? fileName.substring(fileName.lastIndexOf("/") + 1) : Math.random().toString(36).substring(7);
            if (typeof data !== 'string' || !data.includes("ERROR")) {
                var blob = new Blob([data], { type: "pcap" });
                zip.file(fileName + ".pcap", blob);
            }
        })
    }

    zip.generateAsync({ type: "blob" })
        .then(function (blob) {
            var name = "export.zip";
            if (storePersistent.getState().profile[0] && storePersistent.getState().profile[0].userprefs.mode === "encrypt") {
                name = "export_decrypted.zip";
            }
            console.log(name);

            FileSaver.saveAs(blob, name);
        });
}


