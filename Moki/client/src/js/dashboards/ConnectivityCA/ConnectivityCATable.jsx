import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";

function ConnectivityCATable({ tags }) {
  const { calls, total } = useTableData("connectivityCA/table", false);
  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        name={"connectivityCA"}
        total={total}
        id={"STATES CA EVENTS"}
        tags={tags}
      />
    </div>
  );
}

export default ConnectivityCATable;
