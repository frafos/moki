import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";

function OverviewTable({ tags }) {
  const { calls, total } = useTableData("overview/table");

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        total={total}
        tags={tags}
        name={"overview"}
        id={"OVERVIEW EVENTS"}
      />
    </div>
  );
}

export default OverviewTable;
