/*
special stackedbar parse function

format: [value1: number, value2: number, time:timestamp, keys:[value1, value2], max: value
*/
import { getTypes } from "../../js/helpers/getTypes.js";

export default function parseStackedbarTimeData(response) {
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {

        var stackedbarDataParse = response.aggregations.agg.buckets;
        var innerData = {};
        var stackedbarData = [];
        var sum = 0;

        var types = getTypes();
        if(types.length > 0 && types !== "type:none") types = types.map(a => a.id);
        for (var i = 0; i < stackedbarDataParse.length; i++) {
            for (var j = 0; j < stackedbarDataParse[i].agg.buckets.length; j++) {
                //special case:  exceeded data needs also type filter
                if (window.location.pathname === "/exceeded" && (types.length > 0 && types !== "type:none")) {
                    if (types.includes(stackedbarDataParse[i].agg.buckets[j].key)) {
                        var keyy = stackedbarDataParse[i].agg.buckets[j].key;
                        var value = stackedbarDataParse[i].agg.buckets[j].doc_count;
                        innerData[keyy] = value;
                        sum = sum + value;
                    }
                }
                else {
                    var keyy = stackedbarDataParse[i].agg.buckets[j].key;
                    var value = stackedbarDataParse[i].agg.buckets[j].doc_count;

                    innerData[keyy] = value;
                    sum = sum + value;
                }
            }
            if (sum !== 0) {
                innerData['time'] = stackedbarDataParse[i].key;
                innerData['value'] = stackedbarDataParse[i].value;
                innerData['sum'] = sum;
                stackedbarData.push(innerData);
            }
            innerData = {};
            sum = 0;

        }
        return stackedbarData;
    }
    return "";
}
