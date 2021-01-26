import React, {
    Component
} from 'react';


import TableChart from '../../charts/table_chart.js';
import store from "../../store/index";
import {
    elasticsearchConnection
} from '../../helpers/elasticsearchConnection';

class SecurityTable extends Component {

    // Initialize the state
    constructor(props) {
        super(props);
        this.loadData = this.loadData.bind(this);
        this.state = {
            security: [],
            total: 0
        }
        store.subscribe(() => this.loadData());

    }


    componentDidMount() {
        this.loadData();
    }

    async loadData() {
        // Retrieves the Table of calls
        var calls = await elasticsearchConnection("security/table");

        if (calls === undefined || !calls.hits || !calls.hits.hits || (typeof calls === "string" && calls.includes("ERROR:"))) {

            return;
        } else if (calls) {
            var data = calls.hits.hits;
             var total = calls.hits.total.value;
            this.setState({
                security: data,
                total: total
            });
        }
    }

    render() {
        return ( 
            <
            div className = "row no-gutters" >
            <
            TableChart data = {
                this.state.security
            } total={this.state.total}
            name = {
                "security"
            }
            id = {
                "SECURITY EVENTS"
            }
            tags={this.props.tags} 
            />  < /
            div >
        );
    }
}

export default SecurityTable;
