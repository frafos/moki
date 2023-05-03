import { useTableData } from "@hooks/useTableData";
import TableChart from "@charts/table_chart.jsx";

function RestrictedTable({ tags }) {
  const { calls, total } = useTableData("restricted/overview", false);

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        total={total}
        name={"homeLoginCalls"}
        id={"OVERVIEW EVENTS"}
        tags={tags}
      />
    </div>
  );
}

export default RestrictedTable;
