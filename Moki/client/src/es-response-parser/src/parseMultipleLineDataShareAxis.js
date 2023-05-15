/**
 * @return {Array<{ name: string, values: Array<{date: number, value: number}> }>} value
 */
export default function parseMultipleLineDataShareAxis(responseName, response, responseName2, response2) {
    if (response.aggregations && response2.aggregations && response.aggregations.agg && response2.aggregations.agg) {
        var areachartDataParse = response.aggregations.agg.buckets;
        var areachartDataParse2 = response2.aggregations.agg.buckets;
        var areachartDataValue = [];
        var areachartDataFinal = [];
        let max = 0;

        //old data in background
        for (var j = 0; j < areachartDataParse2.length; j++) {
            //create sum of all attrs max count
            max = 0;
            for (var k = 0; k < areachartDataParse2[j].agg.buckets.length; k++) {
                max = max + areachartDataParse2[j].agg.buckets[k].agg2.value;
            }
            areachartDataValue.push({
                date: areachartDataParse2[j].key + 60 * 60 * 24 * 1000,
                value: max
            });
        }
        areachartDataFinal.push({
            name: responseName2,
            values: areachartDataValue

        });
        areachartDataValue = [];
        for (j = 0; j < areachartDataParse.length; j++) {
            //create sum of all attrs max count
            max = 0;
            for (k = 0; k < areachartDataParse[j].agg.buckets.length; k++) {
                if (areachartDataParse[j].agg.buckets[k]) {
                    max = max + areachartDataParse[j].agg.buckets[k].agg2.value;
                }
            }
            areachartDataValue.push({
                date: areachartDataParse[j].key,
                value: max
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
