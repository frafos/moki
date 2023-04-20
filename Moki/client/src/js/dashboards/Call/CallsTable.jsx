import Table from '../Table.js';
import ListChart from '../../charts/table_chart.jsx';

class CallsTable extends Table {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "calls/table",
            calls: [],
            total: 0
        }
    }

    render() {
        return (
            <div className="row no-gutters" >
                <ListChart tags={this.props.tags}
                    data={this.state.calls}
                    total={this.state.total}
                    name={"calls"}
                    id={"CALL EVENTS"}
                />
            </div >
        );
    }
}

export default CallsTable;
