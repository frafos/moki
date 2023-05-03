import moment from 'moment-timezone';
import { timestampBucket} from '../bars/TimestampBucket.js';
import * as d3 from "d3";

import store from "@/js/store";

export const parseTimestamp = (timestamp, ms = false) => {  
        var format = getTimeSetings(ms);
        //no format
        if (format === "") {
                return new Date(timestamp).toLocaleString();
        }
        //timezone and format from settings 
        else if (Array.isArray(format)) {
                return moment.tz(timestamp, format[1]).format(format[0]);
        }
        //browser timezone, format from settings
        else {
                return moment(timestamp).format(format);
        }
}

export const parseTimestampUTC = (timestamp, ms) => {  
        var format = getTimeSetings(ms);

        if (format === "") {
                return new Date(timestamp).toLocaleString();
        }
        else if (Array.isArray(format)) {
                return moment.utc(timestamp).format(format[0]);
        }
        else {
                return moment(timestamp).format(format);
        }
}

export const parseTimestampD3js = (timestamp_gte, timestamp_lte) => { 
        var format = getTimeSetings(false);
        //no profile
        if (format === "") {
                return d3.timeFormat(timestampBucket(timestamp_gte, timestamp_lte));
        }
        //timestamp with timezone stored in profile
        else if (Array.isArray(format)) {
                return  d3.utcFormat(timestampBucket(timestamp_gte, timestamp_lte));
        }
        //browser timezone
        else {
                return d3.timeFormat(timestampBucket(timestamp_gte, timestamp_lte));
        }
}

export function parseTimeData(value){
        var format = getTimeSetings(false);
        //no profile
        if (format === "") {
                return value;
        }
        //timestamp with timezone stored in profile
        else if (Array.isArray(format)) {
                return value + (moment.unix(value).tz(format[1]).utcOffset()*60*1000);
              
        }
        //browser timezone
        else {
                return value;
        }

}

function getTimeSetings(ms) {
    const { user, settings, profile } = store.getState().persistent;
    
    //format is stored in json file
    if (!user.aws) {
        if (settings && settings.length > 0) {
            let timeFormat = "";
            let dateFormat = "";
    
            for (const attr of settings[0].attrs) {
                switch (attr.attribute) {
                    case "timeFormat":
                        timeFormat = attr.value;
                    case "dateFormat":
                        dateFormat = attr.value;
                }
            }
    
            return (dateFormat + " " + timeFormat);
        }
    }
    //format is stored in user profile
    else {
        if (profile[0] && profile[0].userprefs) {
            const userprefs = profile[0].userprefs;
            let format = userprefs.date_format + " " + userprefs.time_format;
            const timezone = userprefs.timezone;
    
            if (ms) {
                if (userprefs.time_format === "hh:mm:ss A") {
                    format = userprefs.date_format + " hh:mm:ss.SSS A";
                }
                else {
                    format = userprefs.date_format + " " + userprefs.time_format + ".SSS";
                }
            }
    
            if (timezone !== "browser"){
                return [format, timezone]
            }

            return format
        }
        else {
            return "";
        }
    }
}

