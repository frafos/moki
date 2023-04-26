import React, { useEffect, useMemo, useRef, useState } from "react";

import Table from "./table";
import Pagination from "./pagination";

import {
  createColumnHelper,
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

// Events table logic

function EventsTable(
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
    autoResetPageIndex: false,
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
      <div
        style={{ width: "fit-content", maxWidth: "100%" }}
      >
        <Table
          {...{ table, saveColumnSize, renderExpandedRow }}
          renderBottom={
            <Pagination
              {...{
                table,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                gotoPage: true,
                siblings: PAGINATION_SIBLINGS,
              }}
            />
          }
        />
      </div>
    </div>
  );
}

export default EventsTable;
