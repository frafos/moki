import React, {
  Component
} from 'react';


import RealmTable from './RealmTable';
import RealmCharts from './RealmCharts';
import FilterBar from '../../bars/FilterBar.jsx';

class Realm extends Component {
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

  componentDidUpdate(prevProps) {
    if (prevProps.hostnames !== this.props.hostnames) {
      this.setState({ hostnames: this.props.hostnames });
    }
  }

  render() {
    return (
      <div className="container-fluid" style={{"paddingRight": "0"}}>
        <FilterBar tags={this.props.tags} />
        <RealmCharts  hostnames={this.state.hostnames} />
        <RealmTable tags={this.props.tags} />
      </div>

    );
  }
}

export default Realm;
