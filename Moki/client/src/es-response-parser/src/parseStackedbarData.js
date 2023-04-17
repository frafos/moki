/*
special stackedbar parse function

format: [value1: number, value2: number, time:timestamp, keys:[value1, value2], max: value
*/
export default function parseStackedbarData(response) {
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {

        var stackedbarDataParse = response.aggregations.agg.buckets;
        var innerData = {};
        var stackedbarData = [];
        var expired = 0;
        var del = 0;

        for (var i = 0; i < stackedbarDataParse.length; i++) {
            var sum = stackedbarDataParse[i].doc_count;
            if (stackedbarDataParse[i].key === "reg-del") {
                del = stackedbarDataParse[i].doc_count;

            }
            else if (stackedbarDataParse[i].key === "reg-expired") {
                expired = stackedbarDataParse[i].doc_count;
            }
            else {
                innerData[stackedbarDataParse[i].key] = stackedbarDataParse[i].doc_count;
                innerData['name'] = stackedbarDataParse[i].key;
                innerData['sum'] = sum;
                stackedbarData.push(innerData);
                innerData = {};

            }
        }
        if (stackedbarData.length > 0 && del+expired > 0) {
            innerData["reg-del"] = del;
            innerData["reg-expired"] = expired;
            innerData['name'] = "reg-del/reg-expired";
            innerData['sum'] = del + expired;
            stackedbarData.push(innerData);


            //sort it by sum value
            stackedbarData.sort(function (a, b) { return a.sum - b.sum; });
            stackedbarData.reverse();
        }
        return stackedbarData;
    }
    return "";
}
