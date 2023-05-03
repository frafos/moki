import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";

function RegistrationTable({ tags }) {
  const { calls, total } = useTableData("registration/table");

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        name={"registration"}
        total={total}
        id={"REGISTRATION EVENTS"}
        tags={tags}
      />
    </div>
  );
}

export default RegistrationTable;
