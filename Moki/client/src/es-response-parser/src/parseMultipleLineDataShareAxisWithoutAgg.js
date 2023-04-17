/*
data: 

name: name,
values: time, value

*/
export default function parseMultipleLineDataShareAxisWithoutAgg(responseName, response, responseName2, response2) {
    if (response.aggregations && response2.aggregations && response.aggregations.agg && response2.aggregations.agg) {
        var areachartDataParse = response.aggregations.agg.buckets;
        var areachartDataParse2 = response2.aggregations.agg.buckets;
        var areachartDataValue = [];
        var areachartDataFinal = [];

        for (var j = 0; j < areachartDataParse2.length; j++) {
            areachartDataValue.push({
                date: areachartDataParse2[j].key + 60 * 60 * 24 * 1000,
                value: areachartDataParse2[j].doc_count,
            });
        }
        areachartDataFinal.push({
            name: responseName2,
            values: areachartDataValue

        });

        areachartDataValue = [];
        for (j = 0; j < areachartDataParse.length; j++) {
            areachartDataValue.push({
                date: areachartDataParse[j].key,
                value: areachartDataParse[j].doc_count,
            });
        }
        areachartDataFinal.push({
            name: responseName,
            values: areachartDataValue

        });

        return areachartDataFinal;
    } else {
        return "";
    }
}
