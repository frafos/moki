export default function parseListDataAnimation(response) {
    var result = [];
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {
        for (var p = 0; p < response.aggregations.agg.buckets.length; p++) {
            var responseLink = response.aggregations.agg.buckets[p];
            if (responseLink && responseLink.nested) {
                result.push({
                    time: responseLink.key,
                    data: [responseLink.agg.buckets, responseLink.nested.value]
                });
            }
        }
        return result;
    }
    return ["", ""];
}


