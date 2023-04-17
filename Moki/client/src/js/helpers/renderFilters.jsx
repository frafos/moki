import Filter from '../bars/Filter';

export const renderFilters = (filters, deleteFilter, disableFilter, enableFilter, pinFilter, editFilter, negationFilter, unpinFilter) => {
        filters = JSON.parse(JSON.stringify(filters));

        //exceeded exception, disable filter with exceeded-by or exceeded for any other dashboard than Exceeded
        //enable automatically exceeded filters in exceeded dashboard
        for (const filter of filters) {
            if (window.location.pathname === "/exceeded" || window.location.pathname === "/alerts") {
                if (filter.title.includes("exceeded") && filter.state === "enable" && filter.previousState === "enable") {
                    filter.state = "enable";
                }
            }
            else {
                if (filter.title.includes("exceeded")) {
                    filter.state = "disable";
                }
            }
        }

  return (
    <div>
      {filters.map((filter) => {
         return (
            <Filter key={filter.id} state={filter.state} 
              title={filter.title} encrypt={filter.encrypt}  
              id={"filter" + filter.id} deleteFilter={deleteFilter} 
              disableFilter={disableFilter} enableFilter={enableFilter} 
              pinFilter={pinFilter} negationFilter={negationFilter} 
              unpinFilter={unpinFilter} editFilter={editFilter} />
          );
      })}
    </div>
  );
}