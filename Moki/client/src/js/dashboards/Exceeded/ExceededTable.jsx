import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";

function ExceededTable({ tags }) {
  const { calls, total } = useTableData("exceeded/table");

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        total={total}
        name={"exceeded"}
        id={"EXCEEDED EVENTS"}
        tags={tags}
      />
    </div>
  );
}

export default ExceededTable;
