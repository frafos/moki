
import Table from '../Table.js';
import TableChart from '../../charts/table_chart.jsx';

class SystemTable extends Table {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "system/table",
            calls: [],
            total: 0
        }
    }


    render() {
        return ( 
            <div className = "row no-gutters" >
            <TableChart data = {
                this.state.calls
            } total={this.state.total}
            name = {
                "system"
            }
            id = {
                "SYSTEM EVENTS"
            }
            tags={this.props.tags} 
            />  </div> 
        );
    }
}

export default SystemTable;
