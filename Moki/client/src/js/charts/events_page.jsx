import { useEffect, useMemo, useRef, useState } from "react";
import Table from "react-bootstrap/Table";
import Pagination from "react-bootstrap/Pagination";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

const COLUMNS_PREF_STORAGE = "columns-pref";
const NON_HIDEABLE_COLUMNS = ["TYPE", "ADVANCED"];

// User storage

/**
 * @returns {any | null}
 */
function getUserColumnsPref() {
  try {
    return JSON.parse(window.localStorage.getItem(COLUMNS_PREF_STORAGE));
  } catch (err) {
    console.error("Could not get user hidden columns:", err);
    return null;
  }
}

/**
 * @param hiddenColumns {any}
 */
function saveUserColumnsPref(columnsPref) {
  try {
    window.localStorage.setItem(
      COLUMNS_PREF_STORAGE,
      JSON.stringify(columnsPref),
    );
  } catch (err) {
    console.error("Could not save user hidden columns:", err);
  }
}

// Columns visibility buttons at the bottom of the table

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
      {column.columnDef.id}
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
      className={className + " cursor-pointer"}
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
  console.log(value, formattedData)

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

function getVisiblePages(current, total) {
  const siblings = 2;
  if (total < siblings + 3) {
    return range(1, total);
  }

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const nearBegin = left < 2;
  const nearEnd = right > total - 2;

  if (nearBegin && !nearEnd) {
    return range(1, siblings + 3);
  }
  if (!nearBegin && nearEnd) {
    return range(total - (siblings + 2), total);
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
          {[10, 20, 30, 40, 50].map((pageSize) => (
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

function createColumns({ columns, columnHelper }) {
  return [
    {
      enableHiding: false,
      id: "select",
      maxSize: 30,
      header: ({ table }) => (
        <IndeterminateCheckbox
          className="mb-0"
          style={{ height: "0.9rem" }}
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <IndeterminateCheckbox
          className="mb-0"
          style={{ height: "0.9rem" }}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    ...columns.map((c) => {
      const canHide = !NON_HIDEABLE_COLUMNS.includes(c.text);
      return columnHelper.accessor((row) => {
        let result = row;
        for (const key of c.dataField.split(".")) {
          result = result?.[key];
        }
        return result;
      }, {
        id: c.text,
        original: {...c},
        header: () => <div className="small">{c.text}</div>,
        cell: ({ column, row, getValue }) =>
          renderCell({ column, row, getValue }),
        enableHiding: canHide,
      });
    }),
  ];
}

// Render table with pagination

/**
 * param events {{}}
 */
function EventsPage(props) {
  const columnHelper = createColumnHelper();
  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo(
    () => createColumns({ columns: props.columns, columnHelper }),
    [],
  );

  const table = useReactTable({
    data: props.data,
    columns,
    state: {
      rowSelection,
    },
    initialState: {
      columnVisibility: props.columns.reduce((obj, col) => ({
        ...obj,
        [col.text]: !col.hidden ?? false,
      }), []),
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="medium">
      <div className="flex ml-3">
        {table.getAllColumns()
          .map((
            column,
          ) => (
            <ColumnButton
              saveColumnVisibility={props.saveColumnVisibility}
              key={column.id}
              column={column}
            />
          ))}
      </div>
      <Table
        hover
        responsive
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: header.getSize() }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </Table>
      <TablePagination table={table} />
    </div>
  );
}

export { EventsPage };
