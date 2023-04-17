import Table from '../Table.js';
import TableChart from '../../charts/table_chart.jsx';

class ConnectivityCATable extends Table {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "connectivityCA/table",
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
                        "connectivityCA"
                    } total={this.state.total}
                    id={
                        "STATES CA EVENTS"
                    }
                    tags={this.props.tags}
                />  </div>
        );
    }
}

export default ConnectivityCATable;
