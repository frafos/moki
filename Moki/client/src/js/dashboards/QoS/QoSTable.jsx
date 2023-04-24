import Table from '../Table.js';
import TableChart from '@charts/table_chart.jsx';

class QoSTable extends Table {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "qos/table",
            calls: [],
            total: 0
        }

    }

    render() {
        return (
            <div className="row no-gutters" >
                <TableChart data={
                    this.state.calls
                } total={this.state.total}
                    name={
                        "qos"
                    }
                    tags={this.props.tags}
                    id={
                        "LOW QoS EVENTS"
                    }
                />  </div>
        );
    }
}

export default QoSTable;
