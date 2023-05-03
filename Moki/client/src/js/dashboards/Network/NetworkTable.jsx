import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";

function NetworkTable() {
  const { calls, total } = useTableData("network/table", false);

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        total={total}
        name={"network"}
        id={"NETWORK EVENTS"}
      />
    </div>
  );
}

export default NetworkTable;
