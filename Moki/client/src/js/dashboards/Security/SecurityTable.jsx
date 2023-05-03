import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";

function SecurityTable({ tags }) {
  const { calls, total } = useTableData("security/table");

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        total={total}
        name={"security"}
        id={"SECURITY EVENTS"}
        tags={tags}
      />
    </div>
  );
}

export default SecurityTable;
