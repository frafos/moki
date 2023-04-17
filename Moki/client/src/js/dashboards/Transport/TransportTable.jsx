import Table from '../Table.js';
import TableChart from '../../charts/table_chart.jsx';
import store from "../../store/index";

class TransportTable extends Table {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "transport/table",
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
                        "transport"
                    }
                    id={
                        "TRANSPORT EVENTS"
                    }
                    width={
                        store.getState().width - 300
                    }
                    tags={this.props.tags}
                />  </div> 
        );
    }
}

export default TransportTable;
