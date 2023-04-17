/*
Class to get data for all charts iin Call dashboard
*/
import React from 'react';

import Dashboard from '../Dashboard.js';
import store from "../../store/index";
import BarChart from '../../charts/bar_chart.jsx';
import TimedateStackedChart from '../../charts/timedate_stackedbar.jsx';
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import {parseHistogramData, parseStackedbarTimeData} from '../../../es-response-parser';


class QoSCharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            dashboardName: "qos/charts",
            QoSHistogram: [],
            MoSStats: [],
            isLoading: true
        };
        this.callBacks = {
            functors: [
              //QoS HISTOGRAM
              [{result: 'QoSHistogram', func: parseHistogramData}],

              //MoS STATS
              [{result: 'MoSStats', func: parseStackedbarTimeData}]
            ]
        };
    }

    //render GUI
    render() {
        return (<
            div > {
                this.state.isLoading && < LoadingScreenCharts />
            }

            <
            div className="row no-gutters" >
                <
                    BarChart data={
                        this.state.QoSHistogram
                    }
                    units={"count"}
                    id="QoSHistogram"
                    bottomMargin={
                        100
                    }
                    type="histogram"
                    name={
                        "QoS HISTOGRAM"
                    }
                    width={
                        store.getState().width - 300
                    }
                />  <
                    TimedateStackedChart id="MoSStats"
                    units={"count"}
                    data={
                        this.state.MoSStats
                    }
                    name={
                        "MoS STATS"
                    }
                    keys={
                        ["*-2.58", "2.58-3.1", "3.1-3.6", "3.6-4.03", "4.03-*"]
                    }
                    width={
                        store.getState().width - 300
                    }
                />  <
            /div> <
            /div> 
        );
    }
}

export default QoSCharts;
