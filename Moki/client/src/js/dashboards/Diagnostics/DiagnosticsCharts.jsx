/*
Class to get data for all charts iin Call dashboard
*/
import React from 'react';

import Dashboard from '../Dashboard.js';
import TimedateStackedChart from '../../charts/timedate_stackedbar.jsx';
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import store from "../../store/index";
import { parseStackedbarTimeData } from '../../../es-response-parser';

class DiagnosticsCharts extends Dashboard {

  // Initialize the state
  constructor(props) {
    super(props);
    this.state = {
      dashboardName: "diagnostics/charts",
      eventDiagnosticTimeline: [],
      isLoading: true
    };
    this.callBacks = {
      functors: [
        //EVENT Diagnostic TIMELINE
        [{ result: 'eventDiagnosticTimeline', func: parseStackedbarTimeData, attrs:["attrs.type"] }]
      ]
    };
  }

  //render GUI
  render() {
    return (<div> { this.state.isLoading && < LoadingScreenCharts />}
      <div className="row no-gutters" >
        <TimedateStackedChart data={this.state.eventDiagnosticTimeline}
          id="eventsOverTime"
          name={"EVENTS OVER TIME"}
          keys={"diagnostics"}
          units={"count"}
          width={store.getState().width - 300}
        />
      </div>
    </div>
    );
  }
}

export default DiagnosticsCharts;
