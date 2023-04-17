/*
data: 
[ 
[name, value1, value2, value3],
[name2, value1, value2, value3],
]
*/
export default function parseMultipleData(response) {
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {
        var dataParse = response.aggregations.agg.buckets;
        var dataFinal = [];

        for (var j = 0; j < dataParse.length; j++) {
            let values = {};
            if (dataParse[j].agg && dataParse[j].agg.value) {
               values.value0= dataParse[j].agg.value;
            }
            else {
                values.value0 = 0;
            }

            if (dataParse[j].agg2 && dataParse[j].agg2.value) {
                values.value1= dataParse[j].agg2.value;
            }
            else {
                values.value1 = 0;
            }
            if (dataParse[j].agg3 && dataParse[j].agg3.value) {
                values.value2= dataParse[j].agg3.value;
            }
            else {
                values.value2= 0;
            }

            if (dataParse[j].agg4 && dataParse[j].agg4.value) {
                values.value3= dataParse[j].agg4.value;
            }
            else {
                values.value3 = 0;
            }

            if (dataParse[j].agg6 && dataParse[j].agg6.value) {
                values.value4= dataParse[j].agg6.value / 100;
            }
            else {
                values.value4 = 0;
            }

            dataFinal.push({
                name: dataParse[j].key,
                values: values
            });
            values = [];
        }
        return dataFinal;
    }
    return "";
}