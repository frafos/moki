/*
Base class for all dashboards
*/
import {
  Component
} from 'react';

import store from "../store/index";
import storePersistent from "../store/indexPersistent";
import { elasticsearchConnection } from '../../gui';
const HAS_TABLE = ["calls", "conference", "connectivityCA", 
  "diagnostics", "exceeded", "causeAnalysis", "flow", "network", 
  "overview", "alerts", "qos", "realm", "registration", 
  "restricted", "security", "system", "transport", "account"];

class Dashboard extends Component {

  // Initialize the state
  constructor(props) {
    super(props);
    this.loadData = this.loadData.bind(this);
    this.finishedLoadingInicialValues = this.finishedLoadingInicialValues.bind(this);
    this.state = {
      loadingInicialValues: true
    };
    window.dashboard = this;
    this.transientState = {};
    this.callBacks = { functors: [] };
    //set empty type array for first time loading
    store.getState().types = [];
    // call 'unsubscribe()' to deregister default loadData change listener
    this.getLayout = this.getLayout.bind(this);
    this.getIncialData = this.getIncialData.bind(this);
  }

  async componentDidMount() {
    await this.getIncialData();
  }

  async getIncialData() {
    console.log("dashboard.js did mount")
    //load types and filters before getting data
    if (window.types) await window.types.loadTypes();
    let name = this.state.dashboardName.substr(0, this.state.dashboardName.indexOf("/"));
    //await this.loadData();
    this.setState({ loadingInicialValues: false }, function () {
      this.loadData();
      if (HAS_TABLE.includes(name)) window.table.loadData();
    });
    this.unsubscribe = store.subscribe(() => this.loadData());

  }

  finishedLoadingInicialValues() {
    return this.state.loadingInicialValues;
  }

  componentWillUnmount() {
    // fix Warning: Can't perform a React state update on an unmounted component
    this.setState = (state, callback) => {
      return;
    };
  }

  getLayout = async () => {
    const layout = storePersistent.getState().layout;
    if (layout) {
      var name = this.state.dashboardName.substr(0, this.state.dashboardName.indexOf("/"));
      if (layout.charts[name]) {
        this.setState({
          charts: layout.charts[name],
          layout: layout
        });
      }
    }
  }

  async processESData(data) {
    if ((!data) || (!data.responses)) {
      return;
    }
    const profile = storePersistent.getState().profile;
    var functors = [];
    for (let i = 0; (i < data.responses.length) && (i < this.callBacks.functors.length); i++) {
      // functors for i'th response
      functors = this.callBacks.functors[i];
      // apply all the functors to the i'th response
      for (let j = 0; j < functors.length; j++) {
        let attrs = [];
        if (functors[j].attrs) attrs = functors[j].attrs;
        //special loader
        //multi parser "Regs", "data.responses[5]", "Regs-1d", "data.responses[6]"
        if (functors[j].type === "multipleLineData") {
          this.transientState[functors[j].result] = await functors[j].func(functors[j].details[0], data.responses[i], functors[j].details[1], data.responses[i + 1], profile, attrs);
        }
        //parseEventsRateData - pass also hours and total count
        else if (functors[j].type === "parseEventsRateData") {
          let hours = (store.getState().timerange[1] -  store.getState().timerange[0])/3600000;
          this.transientState[functors[j].result] = await functors[j].func(data.responses[i], data.responses[2], hours);
        }
        //multileLine domains need second result
        else if(functors[j].type ===  "multipleLineDataDomains"){
          let hours = (store.getState().timerange[1] -  store.getState().timerange[0])/3600000;
          this.transientState[functors[j].result] = await functors[j].func(data.responses[i], data.responses[i+1], data.responses[2], hours);
        }
        else {
          this.transientState[functors[j].result] =
            await functors[j].func(data.responses[i], profile, attrs);
        }
      }
    }
  }

  async loadData() {
    //wait for types to load, it will trigger again
    //calls dashboard has special loader
    let name = window.location.pathname.substring(1);
    if (this.state.loadingInicialValues === false || name === "calls") {
      try {
        this.getLayout();
        this.setState({ isLoading: true });
        var data = await elasticsearchConnection(this.state.dashboardName);

        if (typeof data === "string") {
          window.notification.showError( { errno: 2, text: data, level: "error" });
          this.setState({ isLoading: false });
          return;
        } else if (data) {
          await this.processESData(data);
          this.setState(this.transientState);
          this.setState({ isLoading: false });
          console.info(new Date() + " MOKI DASHBOARD: finished parsing data");
        }
      } catch (e) {
        window.notification.showError( { errno: 2, text: "Problem to parse data.", level: "error" });
        console.error(e);
        this.setState({ isLoading: false });
      }
    }
  }
}


export default Dashboard;
