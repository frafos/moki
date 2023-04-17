/*
Returns hits

*/
export default function parseTimerangeData(response) {
    if (response && response.hits && response.hits.hits) {
        return response.hits.hits;
    }
    return "";
}


