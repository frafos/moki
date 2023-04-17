import React, {
    Component
} from 'react';


import SystemTable from './SystemTable';
import SystemCharts from './SystemCharts';
import TypeBar from '../../bars/Typebar';
import FilterBar from '../../bars/FilterBar';

class System extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hostnames: this.props.hostnames
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.hostnames !== prevState.hostnames) {
            return { hostnames: nextProps.hostnames };
        }
        else return null;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.hostnames !== this.props.hostnames) {
            this.setState({ hostnames: this.props.hostnames });
        }
    }

    render() {
        return (
            <div className="container-fluid" style={{"paddingRight": "0"}}>
                <FilterBar tags={this.props.tags} />
                <TypeBar />
                <SystemCharts  hostnames={this.state.hostnames} />
                <SystemTable tags={this.props.tags} />
            </div>

        );
    }
}

export default System;
