import React, {
  Component
} from 'react';


import ConnectivityCACharts from './ConnectivityCACharts';
import ConnectivityCATable from './ConnectivityCATable';
import FilterBar from '../../bars/FilterBar';

class ConnectivityCA extends Component {
  constructor(props) {
    super(props);
    this.state = {
      srcRealms: this.props.srcRealms,
      dstRealms: this.props.dstRealms
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.dstRealms !== prevState.dstRealms) {
      return { dstRealms: nextProps.dstRealms };
    }
    if (nextProps.srcRealms !== prevState.srcRealms) {
      return { srcRealms: nextProps.srcRealms };
    }
    else return null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.dstRealms !== this.props.dstRealms) {
      this.setState({ dstRealms: this.props.dstRealms });
    }
    if (prevProps.srcRealms !== this.props.srcRealms) {
      this.setState({ srcRealms: this.props.srcRealms });
    }
  }

  render() {
    return (
      <div className="container-fluid" style={{"paddingRight": "0"}}>
        <FilterBar tags={this.props.tags} srcRealms={this.state.srcRealms} dstRealms={this.state.dstRealms} />
        <ConnectivityCACharts />
        <ConnectivityCATable />
      </div>

    );
  }
}

export default ConnectivityCA;
