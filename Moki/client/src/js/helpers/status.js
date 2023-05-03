import querySrv from './querySrv';
import store from "@/js/store";
const BASE_NAME = import.meta.env.BASE_URL;

export async function status() {
    const response = await querySrv(BASE_NAME + "api/status", {
        method: "GET",
        timeout: 10000,
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Credentials": "include"
        }
    });

    const json = await response.json();
    let result = "ok";

    if (json.error) {
        result = { errno: 2, text: "Elasticsearch is not running or responding.", level: "error" };
    }
    //no event in last 30 seconds
    else if (json.hits && json.hits.hits && json.hits.hits.length === 0) {
        result = { errno: 1, text: "Events pipeline heartbeat problem. Logstash may not be running or can't store data in elasticsearch.", level: "error" };
    }
    return {
        status: result
    }
}

export async function diskSpace() {
    const res = await querySrv(BASE_NAME + "api/monitoring/charts", {
        method: "POST",
        timeout: 10000,
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Credentials": "include"
        }
    });

    let events_cleanup_percentage = 0;
    let events_warning_percentage = 0;
    let isCleaningScript = false;
    //get limit for warning and cleanup script
    let settings = store.getState().persistent.settings;
    if (settings && settings[0] && settings[0].attrs) {
        settings = settings[0].attrs;

        for (let hit of settings) {
            if (hit.attribute === "events_cleanup_percentage") {
                events_cleanup_percentage = hit.value;
                isCleaningScript = parseInt(hit.value);
            }
            if (hit.attribute === "events_warning_percentage") {
                events_warning_percentage = hit.value;
            }
        }
    }

    if (events_warning_percentage === 0) events_warning_percentage = 30;
    if (events_cleanup_percentage === 0) events_cleanup_percentage = 10;


    events_warning_percentage = 100 - events_warning_percentage;
    events_cleanup_percentage = 100 - events_cleanup_percentage;


    const data = await res.json();
    //get node name
    if (data && data[0] && data[0].hasOwnProperty("nodes")) {
        var node = Object.keys(data[0].nodes)[0];
        let result = "ok";

        //used disk space
        if (data[0].nodes && data[0].nodes[node] && data[0].nodes[node].fs && data[0].nodes[node].fs.total && data[0].nodes[node].fs.total.available_in_bytes) {
            var usedDiskSpace = ((data[0].nodes[node].fs.total.total_in_bytes - data[0].nodes[node].fs.total.available_in_bytes) / data[0].nodes[node].fs.total.total_in_bytes) * 100;
        }
        else {
            //can't get disk space - ES not running, different error
            return { status: result }
        }

        let cleaningText = "Warning, cleaning script is on and will run on "+events_cleanup_percentage+"% and delete the oldest events.";
        if(!isCleaningScript){
            cleaningText = "Cleaning script is off. Please delete some data, pcaps, logs or activate automatic cleaning script in settings";
        }

        if (usedDiskSpace > events_warning_percentage && usedDiskSpace < events_cleanup_percentage-1) {
            result = { errno: 4, text: "Disk full > " + events_warning_percentage + "%. "+cleaningText, level: "warning" };
        }
        else if (usedDiskSpace >= events_cleanup_percentage-1) {
            result = { errno: 3, text: "Disk full >= " + events_cleanup_percentage + "%. "+cleaningText, level: "error" };
        }
        return {
            status: result
        }
        

    }
    return { status: "ok" }
}