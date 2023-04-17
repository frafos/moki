export default function parseQueryStringData(response) {
    if (response.hits && response.hits.total && response.hits.total.value) {
        return response.hits.total.value;
    } else {
        return 0;
    }

}
