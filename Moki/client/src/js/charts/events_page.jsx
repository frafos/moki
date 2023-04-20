import React, { useEffect, useMemo, useRef, useState } from "react";
import Table from "react-bootstrap/Table";
import Pagination from "react-bootstrap/Pagination";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";

const NON_HIDEABLE_COLUMNS = ["TYPE", "ADVANCED"];

const SELECT_COLUMN_MAX_SIZE = 50;
const DEFAULT_COLUMN_SIZE = 150;
const MIN_COLUM_SIZE = 60;
const MAX_COLUMN_SIZE = 250;

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];
const PAGINATION_SIBLINGS = 2;

// Columns visibility buttons at the top of the table

/**
 * @param {{column: import("@tanstack/react-table").Column<any, any>}}
 */
function ColumnButton({ saveColumnVisibility, column }) {
  if (!column.getCanHide()) {
    return null;
  }
  const isVisible = column.getIsVisible();
  return (
    <button
      type="button"
      className={isVisible ? " selectColumnButton green" : "selectColumnButton"}
      data-toggle="button"
      aria-pressed={isVisible ? "true" : "false"}
      onClick={() => {
        column.toggleVisibility();
        saveColumnVisibility(column.id);
      }}
    >
      {column.columnDef.text}
    </button>
  );
}

// Checkbox that can be indeterminate

function IndeterminateCheckbox({
  indeterminate,
  className = "",
  ...rest
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + " cursor-pointer mb-0"}
      {...rest}
    />
  );
}

// Render single value

function renderCell({ column, row, getValue }) {
  const value = getValue();
  const columnData = column.columnDef.original;
  const eventData = row.original;
  const formattedData = columnData.formatter?.(value, eventData);

  return (
    <span className="text-truncate" style={{ fontSize: "0.9em" }}>
      {formattedData && value ? formattedData : value}
    </span>
  );
}

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

// Rendering of pagination

function TablePagination({ table }) {
  return (
    <section className="d-flex mt-1 justify-content-around">
      <Pagination>
        <Pagination.Item
          className="mr-1 ml-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </Pagination.Item>
        <Pagination.Item
          className="mr-2"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </Pagination.Item>
        {getVisiblePages(
          table.getState().pagination.pageIndex + 1,
          table.getPageCount(),
          PAGINATION_SIBLINGS,
        ).map((page) => (
          <Pagination.Item
            key={page}
            style={{ minWidth: "1.7rem", textAlign: "center" }}
            onClick={() => table.setPageIndex(page - 1)}
            activeLabel=""
            active={table.getState().pagination.pageIndex + 1 === page}
          >
            {page}
          </Pagination.Item>
        ))}
        <Pagination.Item
          className="ml-2 mr-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </Pagination.Item>
        <Pagination.Item
          className="mr-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </Pagination.Item>
      </Pagination>
      <div className="d-flex">
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {PAGE_SIZE_OPTIONS.map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
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
      </div>
    </section>
  );
}

// Create columns

// return field in nested object based on string key (separated by .)
function accessKeyField(data, stringKey) {
  let result = data;
  for (const key of stringKey.split(".")) {
    result = result?.[key];
  }
  return result;
}

function createColumns({ allSelected, setAllSelected, columns, columnHelper }) {
  return [
    {
      enableHiding: false,
      id: "select",
      enableResizing: false,
      maxSize: SELECT_COLUMN_MAX_SIZE,
      header: ({ table }) => (
        <IndeterminateCheckbox
          checked={allSelected}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={() => {
            if (table.getIsSomeRowsSelected()) {
              table.resetRowSelection();
            } else {
              setAllSelected(!allSelected);
            }
          }}
        />
      ),
      cell: ({ row }) => {
        return (
          <div
            style={{
              paddingLeft: `${row.depth * 2}rem`,
            }}
          >
            <IndeterminateCheckbox
              className="mb-0"
              style={{ height: "0.9rem" }}
              checked={allSelected || row.getIsSelected()}
              disabled={!row.getCanSelect()}
              indeterminate={row.getIsSomeSelected()}
              onChange={row.getToggleSelectedHandler()}
            />{" "}
            {row.getCanExpand()
              ? (
                <span
                  onClick={row.getToggleExpandedHandler()}
                  style={{ cursor: "pointer" }}
                >
                  {row.getIsExpanded() ? "-" : "+"}
                </span>
              )
              : (
                "?"
              )}
          </div>
        );
      },
    },
    ...columns.map((c) => {
      const canHide = !NON_HIDEABLE_COLUMNS.includes(c.text);
      const prefWidth = Number(c.headerStyle?.width);
      return columnHelper.accessor((row) => {
        return accessKeyField(row, c.dataField);
      }, {
        minSize: MIN_COLUM_SIZE,
        size: isNaN(prefWidth) ? DEFAULT_COLUMN_SIZE : prefWidth,
        maxSize: MAX_COLUMN_SIZE,
        text: c.text,
        id: c.dataField,
        original: { ...c },
        header: () => c.text,
        cell: ({ column, row, getValue }) =>
          renderCell({ column, row, getValue }),
        enableHiding: canHide,
      });
    }),
  ];
}

// Table header and row content rendering

function TableHeader({ header, saveColumnSize }) {
  const [showResizer, setShowResizer] = useState(false);
  const sortedAsc = header.column.getIsSorted() === "asc";

  return (
    <th
      colSpan={header.colSpan}
      style={{
        width: header.getSize(),
        position: "relative",
      }}
    >
      <div
        className="d-flex"
        style={{
          cursor: header.column.getCanSort() ? "pointer" : "",
        }}
        onClick={() => {
          if (!header.column.getCanSort()) return;
          header.column.toggleSorting(sortedAsc);
        }}
      >
        {header.isPlaceholder ? null : flexRender(
          header.column.columnDef.header,
          header.getContext(),
        )}
        {{ asc: " 🔼", desc: " 🔽" }[header.column.getIsSorted()] ?? null}
      </div>
      {header.column.getCanResize() &&
        (
          <div
            onMouseDown={header.getResizeHandler()}
            onMouseUp={() => {
              saveColumnSize(header.id, header.getSize());
            }}
            onMouseEnter={() => setShowResizer(true)}
            onMouseLeave={() => setShowResizer(false)}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: "2rem",
              height: "100%",
              cursor: "col-resize",
              userSelect: "none",
            }}
          >
            <div
              style={{
                display: showResizer ? "" : "none",
                background: !header.column.getIsResizing()
                  ? "rgba(0, 0, 0, 0.5)"
                  : "rgba(0, 0, 1, 0.8)",
                width: "5px",
                position: "absolute",
                right: 0,
                height: "100%",
              }}
            />
          </div>
        )}
    </th>
  );
}

function TableRow({ row, renderExpandedRow }) {
  return (
    <>
      <tr>
        {row.getVisibleCells().map((cell) => {
          return (
            <td
              key={cell.id}
              style={{ width: cell.column.getSize() }}
            >
              {flexRender(
                cell.column.columnDef.cell,
                cell.getContext(),
              )}
            </td>
          );
        })}
      </tr>
      {row.getIsExpanded() && (
        <tr>
          <td colSpan={row.getVisibleCells().length}>
            {renderExpandedRow(row.original)}
          </td>
        </tr>
      )}
    </>
  );
}

// Process page data
// data can be transformed here in case decryption is needed

// Assuming you want case-insensitive comparison
function compareStrings(key, desc) {
  return function (a, b) {

    a = accessKeyField(a, key);
    b = accessKeyField(b, key);

    if (a === b) return 0;
    if (a == undefined) return 1; 
    if (b == undefined) return -1;

    a = typeof a === "string" ? a.toLowerCase() : a;
    b = typeof b === "string" ? b.toLowerCase() : b;

    if (desc) {
      return (a < b) ? 1 : (a > b) ? -1 : 0;
    } else {
      return (a > b) ? 1 : (a < b) ? -1 : 0;
    }
  };
}

/**
 * @param {{ data: any[], pageIndex: number, pageSize: number }}
 */
function useProcessData({ data, pageIndex, pageSize, sorting }) {
  const [pageData, setPageData] = useState([]);

  const sortedData = useMemo(() => {
    for (const sort of sorting) {
      data.sort(compareStrings(sort.id, sort.desc));
    }
    return data;
  }, [data, sorting]);

  useEffect(() => {
    (async () => {
      const index = pageIndex * pageSize;
      setPageData(sortedData.slice(index, index + pageSize));
    })();
  }, [data, pageIndex, pageSize, sorting]);

  return pageData;
}

// Events table logic

function EventsPage(
  {
    columns,
    data,
    saveColumnVisibility,
    saveColumnSize,
    renderExpandedRow,
    updateSelectedRows,
  },
) {
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState([]);
  const [allSelected, setAllSelected] = useState(false);
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columnHelper = createColumnHelper();
  const tableColumns = useMemo(
    () => createColumns({ allSelected, setAllSelected, columns, columnHelper }),
    [allSelected],
  );

  const pageData = useProcessData({
    pageIndex,
    pageSize,
    data,
    sorting,
    columns,
  });

  useEffect(() => updateSelectedRows(allSelected, rowSelection, data), [
    rowSelection,
    allSelected,
  ]);

  const pagination = useMemo(() => {
    return {
      pageIndex,
      pageSize,
    };
  }, [pageIndex, pageSize]);

  const table = useReactTable({
    data: pageData,
    columns: tableColumns,
    pageCount: Math.ceil(data.length / pageSize),
    state: {
      rowSelection,
      pagination,
      sorting,
    },
    initialState: {
      columnVisibility: columns.reduce((obj, col) => ({
        ...obj,
        [col.dataField]: !col.hidden ?? false,
      }), []),
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    columnResizeMode: "onChange",
    getRowId: (row) => row._id,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <div className="medium">
      <div className="flex ml-3">
        {table.getAllColumns()
          .map((column) => (
            <ColumnButton
              saveColumnVisibility={saveColumnVisibility}
              key={column.id}
              column={column}
            />
          ))}
      </div>
      <Table hover responsive>
        <thead style={{ fontSize: "0.9rem" }}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHeader
                  saveColumnSize={saveColumnSize}
                  key={header.id}
                  {...{ header }}
                />
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              row={row}
              renderExpandedRow={renderExpandedRow}
            />
          ))}
        </tbody>
      </Table>
      <TablePagination table={table} />
    </div>
  );
}

export { EventsPage };
