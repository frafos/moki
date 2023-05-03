import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";

function QoSTable({ tags }) {
  const { calls, total } = useTableData("qos/table", false);

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        total={total}
        name={"qos"}
        tags={tags}
        id={"LOW QoS EVENTS"}
      />
    </div>
  );
}

export default QoSTable;
