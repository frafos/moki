import { BaseType, Selection } from "d3";

function showItemSelection<T extends BaseType>(
  selection: Selection<T, unknown, null, undefined>,
) {
  selection.style("stroke", "orange")
    .style("cursor", "pointer");
}

function hideItemSelection<T extends BaseType>(
  selection: Selection<T, unknown, null, undefined>,
) {
  selection.style("stroke", "none");
}

export { showItemSelection, hideItemSelection }
