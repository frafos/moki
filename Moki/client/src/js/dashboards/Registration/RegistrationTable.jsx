import Table from '../Table.js';
import TableChart from '@charts/table_chart.jsx';

class RegistrationTable extends Table {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "registration/table",
            calls: [],
            total: 0
        }

    }

    render() {
        return (
            <div className="row no-gutters">
                <TableChart data={
                        this.state.calls
                    }
                    name={
                        "registration"
                    } total={this.state.total}
                    id={
                        "REGISTRATION EVENTS"
                    }
                    tags={this.props.tags} />  
                </div> 
        );
    }
}

export default RegistrationTable;
