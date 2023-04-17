/*
return aggregation number round to 2 decimal
*/

export default function parseAggSumBucketData(response) {
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.value) {
        var data = response.aggregations.agg.value;

        return Number((data).toFixed(2));
    }
    return "";
}


