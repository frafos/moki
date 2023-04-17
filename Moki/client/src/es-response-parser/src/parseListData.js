function parseListData(response){
    if (response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets && response.aggregations.nested) {
        return [response.aggregations.agg.buckets, response.aggregations.nested.value];
    }
    return ["", ""];
}

function parseIp(response) {
    return parseListData(response);
}

function parseUri(response) {
    return parseListData(response);
}

function parseList(response) {
    return parseList(response);
}

export {
    parseListData,
    parseList,
    parseIp,
    parseUri
};
