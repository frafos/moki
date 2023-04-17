/*
Special date areachart parse function

data: 
name: name,
values: time, value

*/
export default function parseDateAreachart(responseName, response, responseName2, responseOld) {
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {
        var areachartDataParse = response.aggregations.agg.buckets;
        var areachartDataParseOld = response.aggregations.agg.buckets;
        var areachartDataValue = [];
        var areachartDataFinal = [];

        for (var j = 0; j < areachartDataParse.length; j++) {
            areachartDataValue.push({
                time: areachartDataParse[j].key,
                value: areachartDataParse[j].doc_count,
            });
        }
        areachartDataFinal.push({
            name: responseName,
            values: areachartDataValue

        });

        areachartDataValue = [];
        for (j = 0; j < areachartDataParseOld.length; j++) {
            areachartDataValue.push({
                time: areachartDataParseOld[j].key,
                value: areachartDataParseOld[j].doc_count,
            });
        }
        areachartDataFinal.push({
            name: responseName2,
            values: areachartDataValue

        });

        return areachartDataFinal;
    }
    return "";
}
