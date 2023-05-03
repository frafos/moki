import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";

function SystemTable({ tags }) {
  const { calls, total } = useTableData("system/table", false);

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        total={total}
        name={"system"}
        id={"SYSTEM EVENTS"}
        tags={tags}
      />
    </div>
  );
}

export default SystemTable;
