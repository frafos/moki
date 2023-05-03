import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";

function DiagnosticsTable({ tags }) {
  const { calls, total } = useTableData("diagnostics/table");

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        name={"diagnostics"}
        total={total}
        id={"DIAGNOSTICS EVENTS"}
        tags={tags}
      />
    </div>
  );
}

export default DiagnosticsTable;
