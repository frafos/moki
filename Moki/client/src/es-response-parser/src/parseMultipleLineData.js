/*
data: 

name: name,
values: time, value

*/

export default function parseMultipleLineData(response) {
    if (response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets && response.aggregations.agg.buckets[0] && response.aggregations.agg.buckets[0][2]) {
        var areachartDataParse = response.aggregations.agg.buckets;
        var areachartDataValue = [];
        var areachartDataFinal = [];

        for (var i = 0; i < areachartDataParse.length; i++) {
            var responseName = areachartDataParse[i].key;

            for (var j = 0; j < areachartDataParse[i][2].buckets.length; j++) {
                areachartDataValue.push({
                    date: areachartDataParse[i][2].buckets[j].key,
                    value: areachartDataParse[i][2].buckets[j][1].value
                });
            }

            areachartDataFinal.push({
                name: responseName,
                values: areachartDataValue

            });
            areachartDataValue = [];
        }
        return areachartDataFinal;
    } else {
        return "";
    }
}
