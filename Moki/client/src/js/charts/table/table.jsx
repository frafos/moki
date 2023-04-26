import { Table as BTable } from "react-bootstrap";
import { useState } from "react";
import { flexRender } from "@tanstack/react-table";
import Pagination from "./pagination";

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
          userSelect: "none",
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
              saveColumnSize?.(header.id, header.getSize());
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
              style={{
                width: cell.column.getSize(),
              }}
            >
              {flexRender(
                cell.column.columnDef.cell,
                cell.getContext(),
              )}
            </td>
          );
        })}
      </tr>
      {renderExpandedRow && row.getIsExpanded() && (
        <tr style={{ fontSize: "0.9rem" }}>
          <td colSpan={row.getVisibleCells().length}>
            {renderExpandedRow(row.original)}
          </td>
        </tr>
      )}
    </>
  );
}

// table rendering

/**
 * @param {{ table: import("@tanstack/react-table").Table}}
 */
function Table({ table, saveColumnSize, renderExpandedRow, renderBottom }) {
  return (
    <div
      style={{ width: "fit-content", maxWidth: "100%" }}
    >
      <BTable
        hover
        responsive
        style={{
          width: table.getTotalSize(),
        }}
      >
        <thead style={{ fontSize: "0.9rem" }}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHeader
                  saveColumnSize={saveColumnSize}
                  key={header.id}
                  {...{ header, table }}
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
      </BTable>
      {renderBottom}
    </div>
  );
}

export default Table;
