import { Pagination as BPagination } from "react-bootstrap";

// Utility function for pagination

function range(start, end) {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => i + start);
}

function getVisiblePages(current, total, siblings = 2) {
  if (total < siblings + 3) {
    return range(1, total);
  }

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const nearBegin = left < 2;
  const nearEnd = right > total - 1;

  if (nearBegin && !nearEnd) {
    return range(1, siblings * 2 + 1);
  }
  if (!nearBegin && nearEnd) {
    return range(total - (siblings * 2), total);
  }

  return range(left, right);
}

/**
 * @typedef Props
 * @property {import("@tanstack/react-table").Table} table
 * @property {number[]} pageSizeOptions number of elements show in
    one page options
 * @property {boolean} gotoPage field to enter desired page to jump in
 * @property {number} siblings number of adjacent page numbers displayed
    on both sides of the current page
 */

/**
 * @param {Props} props
 */
function Pagination({ table, pageSizeOptions, gotoPage, siblings }) {
  const gap = (pageSizeOptions || gotoPage) ? "mr-3" : "";
  return (
    <section className={`d-flex mt-1 justify-content-center`}>
      <BPagination className={gap}>
        <BPagination.Item
          className="mr-1 ml-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </BPagination.Item>
        <BPagination.Item
          className="mr-2"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </BPagination.Item>
        {getVisiblePages(
          table.getState().pagination.pageIndex + 1,
          table.getPageCount(),
          siblings,
        ).map((page) => (
          <BPagination.Item
            key={page}
            style={{ minWidth: "1.7rem", textAlign: "center" }}
            onClick={() => table.setPageIndex(page - 1)}
            activeLabel=""
            active={table.getState().pagination.pageIndex + 1 === page}
          >
            {page}
          </BPagination.Item>
        ))}
        <BPagination.Item
          className="ml-2 mr-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </BPagination.Item>
        <BPagination.Item
          className="mr-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </BPagination.Item>
      </BPagination>
      <div className="d-flex">
        {pageSizeOptions &&
          (
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {pageSizeOptions.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
          )}
        {gotoPage &&
          (
            <div className="mr-1 ml-2" style={{ padding: 0 }}>
              <span>
                Go to page:{" "}
                <input
                  type="number"
                  style={{ width: "auto" }}
                  max={table.getPageCount()}
                  min="1"
                  defaultValue={table.getState().pagination.pageIndex + 1}
                  onChange={(e) => {
                    let page = e.target.value ? Number(e.target.value) - 1 : 0;
                    page = Math.min(page, table.getPageCount() - 1);
                    table.setPageIndex(page);
                  }}
                />
              </span>
            </div>
          )}
      </div>
    </section>
  );
}

export default Pagination;
