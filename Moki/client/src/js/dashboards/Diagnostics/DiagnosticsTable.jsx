import Table from '../Table.js';
import TableChart from '@charts/table_chart.jsx';

class DiagnosticsTable extends Table {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "diagnostics/table",
            calls: [],
            total: 0
        }
    }

    render() {
        return (
            <div className="row no-gutters" >
                <TableChart data={
                    this.state.calls
                }
                    name={
                        "diagnostics"
                    } total={this.state.total}
                    id={
                        "DIAGNOSTICS EVENTS"
                    }
                    tags={this.props.tags}
                />  </div>
        );
    }
}

export default DiagnosticsTable;
