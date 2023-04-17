import Table from '../Table.js';
import TableChart from '../../charts/table_chart.jsx';

class ConferenceTable extends Table {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "conference/table",
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
                        "conference"
                    }
                    tags={this.props.tags}
                    id={
                        "CONFERENCE EVENTS"
                    }
                />  </div >
        );
    }
}

export default ConferenceTable;
