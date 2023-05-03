import { useTableData } from "@hooks/useTableData";
import ListChart from "@charts/table_chart.jsx";

function CallsTable({ tags }) {
  const { calls, total } = useTableData("calls/table");

  return (
    <div className="row no-gutters">
      <ListChart
        tags={tags}
        data={calls}
        total={total}
        name={"calls"}
        id={"CALL EVENTS"}
      />
    </div>
  );
}

export default CallsTable;
