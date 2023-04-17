function parseListDataCardinality(response) {
    var sum = 0;
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {
        var data = response.aggregations.agg.buckets;
        var finalData = [];
        for (var j = 0; j < data.length; j++) {
            finalData.push({
                key: data[j].key,
                doc_count: data[j].agg.value,
            });
            sum = sum + data[j].agg.value;
        }

        return [finalData, sum];
    }
    return "";
}

function parseListDataCardinalityDecrypt(response){
    parseListDataCardinality(response);
}

export {
    parseListDataCardinality,
    parseListDataCardinalityDecrypt
};


