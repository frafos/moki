/*
return field1/field2 ratio value
*/

export default function parseRatio(response) { 
  if (response && response.aggregations && response.aggregations.field1 && response.aggregations.field1.value && response.aggregations.field2 && response.aggregations.field2.value) {
    return Math.round(response.aggregations.field1.value/response.aggregations.field2.value);
  }
  return 0;
}
