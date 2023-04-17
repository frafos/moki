import React, {
    Component
} from 'react';


import SecurityTable from './SecurityTable';
import SecurityCharts from './SecurityCharts';
import TypeBar from '../../bars/Typebar';
import FilterBar from '../../bars/FilterBar.jsx';

class Security extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="container-fluid" style={{"paddingRight": "0"}}>
                <FilterBar tags={this.props.tags} />
                <TypeBar />
                <SecurityCharts />
                <SecurityTable tags={this.props.tags} />
            </div>

        );
    }
}

export default Security;
