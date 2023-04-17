/*
USE FOR:

table
datebar
query without agg
donut 


*/
import { getTypes } from "../../js/helpers/getTypes.js";

export default function parseBucketData(response) {
    if (response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {
        //special case:  exceeded data needs also type filter
        var types = getTypes();
        if (window.location.pathname === "/exceeded" && (types !== "type:none" && types.length > 0)) {
            var buckets = response.aggregations.agg.buckets;
            var result = [];
            if(types !== "type:none" && types.length > 0) types = types.map(a => a.id);
            for (var i = 0; i < buckets.length; i++) {
                if (types.includes(buckets[i].key)) {
                    result.push(buckets[i]);
                }
            }
            return result;
        }

        return response.aggregations.agg.buckets;
    }
    return "";
}


