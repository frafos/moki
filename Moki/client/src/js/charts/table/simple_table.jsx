import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Pagination from "./pagination";
import Table from "./table";

function SimpleTable({ columns, data }) {
  const table = useReactTable({
    data,
    columns,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return <Table {...{ table }} renderBottom={<Pagination {...{ table }} />} />;
}

export default SimpleTable;
