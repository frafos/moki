import store from "@/js/store";

export const getFilters = () => {
        var filters = store.getState().filter.filters;
        var filtersResult = [];
        for (var i = 0; i < filters.length; i++) {
                if (filters[i].state !== 'disable') {
                        filtersResult.push(filters[i]);
                }
        }

        return filtersResult;
}