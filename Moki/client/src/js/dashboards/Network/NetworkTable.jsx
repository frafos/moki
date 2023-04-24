import Table from '../Table.js';
import TableChart from '@charts/table_chart.jsx';

class NetworkTable extends Table {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "network/table",
            calls: [],
            total: 0
        }
    }

    render() {
        return (
            <div className="row no-gutters">
                <TableChart data={
                    this.state.calls
                } total={this.state.total} name={"network"} id={"NETWORK EVENTS"} />
            </div>
        );
    }
}

export default NetworkTable;
