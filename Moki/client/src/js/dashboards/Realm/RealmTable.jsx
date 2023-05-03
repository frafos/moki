import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";

function RealmTable({ tags }) {
  const { calls, total } = useTableData("realm/table", false);

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        total={total}
        name={"realm"}
        id={"REALM EVENTS"}
        tags={tags}
      />
    </div>
  );
}

export default RealmTable;
