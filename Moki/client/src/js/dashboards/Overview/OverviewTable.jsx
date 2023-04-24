import Table from '../Table.js';
import TableChart from '@charts/table_chart.jsx';

class OverviewTable extends Table {

  // Initialize the state
  constructor(props) {
    super(props);
      this.state = {
        ...this.state,
        dashboardName: "overview/table",
        calls: [],
        total: 0
    }
  }
 
  render() {
    return (
      <div className="row no-gutters">
        <TableChart data={
          this.state.calls
        } total={this.state.total} tags={this.props.tags} name={"overview"} id={"OVERVIEW EVENTS"} />
      </div>
    );
  }
}

export default OverviewTable;
