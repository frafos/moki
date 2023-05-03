import TableChart from "@charts/table_chart.jsx";
import { useTableData } from "@hooks/useTableData";
import { useSelector } from "react-redux";

function TransportTable({ tags }) {
  const { calls, total } = useTableData("transport/table");

  const width = useSelector((state) => state.persistent.width);
  return (
    <div className="row no-gutters">
      <TableChart
        data={calls}
        total={total}
        name={"transport"}
        id={"TRANSPORT EVENTS"}
        width={width - 300}
        tags={tags}
      />
    </div>
  );
}

export default TransportTable;
