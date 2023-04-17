export default function parseAggQueryWithoutScriptValue(response) {
    if (response && response.aggregations && response.aggregations.agg) {
        return response.aggregations.agg.value;
    }
    return 0;
}


