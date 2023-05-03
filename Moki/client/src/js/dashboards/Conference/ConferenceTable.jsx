import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";

function ConferenceTable({ tags }) {
  const { calls, total } = useTableData("conference/table");

  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        total={total}
        name={"conference"}
        tags={tags}
        id={"CONFERENCE EVENTS"}
      />
    </div>
  );
}

export default ConferenceTable;
