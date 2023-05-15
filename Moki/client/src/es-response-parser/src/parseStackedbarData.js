/**
special stackedbar parse function
* @return {Array<{ name: string, sum: number }>}
*/
export default function parseStackedbarData(response) {
  if (
    response && response.aggregations && response.aggregations.agg &&
    response.aggregations.agg.buckets
  ) {
    const stackedbarDataParse = response.aggregations.agg.buckets;
    const stackedbarData = [];
    let expired = 0;
    let del = 0;

    for (const data of stackedbarDataParse) {
      switch (data.key) {
        case "reg-del":
          del = data.doc_count;
          break;
        case "reg-expired":
          expired = data.doc_count;
          break;
        default:
          stackedbarData.push({
            key: data.key,
            name: data.key,
            sum: data.doc_count,
            [data.key]: data.doc_count,
          });
      }
    };

    if (stackedbarData.length > 0 && del + expired > 0) {
      stackedbarData.push({
        "reg-del": del,
        "reg-expired": expired,
        name: "reg-del/reg-expired",
        sum: del + expired
      });

      //sort it by sum value
      stackedbarData.sort(function (a, b) {
        return a.sum - b.sum;
      });
      stackedbarData.reverse();
    }

    return stackedbarData;
  }
  return "";
}
