/*
Class to get data for all charts iin Call dashboard
*/
import React from 'react';

import Dashboard from '../Dashboard.js';
import TimedateStackedChart from '@charts/timedate_stackedbar.jsx';
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import store from "../../store/index";
import { parseStackedbarTimeData } from '../../../es-response-parser';


class TransportCharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            dashboardName: "transport/charts",
            eventRegsTimeline: [],
            isLoading: true
        };
        this.callBacks = {
            functors: [
                [{ result: 'eventRegsTimeline', func: parseStackedbarTimeData }]
            ]
        };
    }
    //render GUI
    render() {
        return (<div> {
            this.state.isLoading && < LoadingScreenCharts />
        } <div className="row no-gutters" >
                <TimedateStackedChart id="eventsOverTime"
                    data={ this.state.eventRegsTimeline }
                    units={"count"}
                    name={ "EVENTS OVER TIME" }
                    keys={"transport" }
                    width={store.getState().width - 300}

                />  </div> </div>
        );
    }
}

export default TransportCharts;
