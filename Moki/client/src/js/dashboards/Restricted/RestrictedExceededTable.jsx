import { useTableData } from "@hooks/useTableData";
import TableChart from "@charts/table_chart.jsx";

function RestrictedExceededTable({ tags }) {
  const { calls, total } = useTableData("alerts/table");

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        total={total}
        name={"alerts"}
        id={"ALERTS EVENTS"}
        tags={tags}
      />
    </div>
  );
}

export default RestrictedExceededTable;
