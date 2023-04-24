/*
Class to get data for all charts iin Call dashboard
*/

import React from 'react';
import Dashboard from '../Dashboard.js';
import TimedateHeatmap from '@charts/timedate_heatmap.jsx';
import TimedateStackedChart from '@charts/timedate_stackedbar.jsx';
import StackedChart from '@charts/stackedbar.jsx';
import store from "../../store/index";
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import ValueChart from '@charts/value_chart.jsx';
import { parseDateHeatmap, parseStackedbarData, 
    parseStackedbarTimeData, parseAggDistinct, 
    parseQueryStringData } from '../../../es-response-parser';

class OverviewCharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            dashboardName: "overview/charts",
            eventOverviewTimeline: [],
            totalEventsInInterval: [],
            activitySBC: [],
            keepAlive: [],
            tags: [],
            charts: [],
            distinctIP: [],
            totalEvents: [],
            distinctURI: [],
            isLoading: true
        };
        this.callBacks = {
            functors: [
                //EVENT OVERVIEW TIMELINE
                [{ result: 'eventOverviewTimeline', func: parseStackedbarTimeData }],

                //TOTAL EVENTS IN INTERVAL
                [{ result: 'totalEventsInInterval', func: parseStackedbarData }],

                //ACTIVITY OF SBC
                [{ result: 'activitySBC', func: parseDateHeatmap }],

                //SBC - KEEP ALIVE
                [{ result: 'keepAlive', func: parseDateHeatmap }],

                // empty
                [],

                //TAGS LIST
                [],

                //DISTINCT IP
                [{ result: 'distinctIP', func: parseAggDistinct }],

                //TOTAL EVENTS IN INTERVAL
                [{ result: 'totalEvents', func: parseQueryStringData }],

                //DISTINCT URI
                [{ result: 'distinctURI', func: parseAggDistinct }],
            ]
        };
    }



    //render GUI
    render() {
        return (
            <div>
                { this.state.isLoading && <LoadingScreenCharts />}
                <div className="row  no-gutters">
                    {this.state.charts["DISTINCT IP"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.distinctIP
                        } name={"DISTINCT IP"} />
                    </div>}
                    {this.state.charts["DISTINCT URI"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.distinctURI
                        } name={"DISTINCT URI"} />
                    </div>}
                    {this.state.charts["TOTAL EVENTS"] && <div className="col-auto">
                        <ValueChart data={
                            this.state.totalEvents
                        } name={"# EVENTS"} />
                    </div>}
                </div>
                { this.state.charts["EVENTS OVER TIME"] && <div className="row no-gutters" >
                    <TimedateStackedChart units={"count"} data={
                        this.state.eventOverviewTimeline
                    } id="eventsOverTime" name={"EVENTS OVER TIME"} keys={"overview"} width={store.getState().width - 300}
                    />
                </div>
                }
                <div className="row no-gutters" >
                    {this.state.charts["TOTAL EVENTS IN INTERVAL"] && <div className="col">
                        <StackedChart data={
                            this.state.totalEventsInInterval
                        } units={"count"} id="totalEvents" bottomMargin={80} keys={"overview"} name={"TOTAL EVENTS IN INTERVAL"} width={store.getState().width-300}
                        />
                    </div>
                    }
                </div>
                {this.state.charts["NODES - ACTIVITY"] && <div className="row no-gutters">
                    <TimedateHeatmap data={
                        this.state.activitySBC
                    } marginLeft={"250"} name={"NODES - ACTIVITY"} units={"any event count"} id="activitySBC" field={"attrs.hostname"} width={store.getState().width - 300} />
                </div>
                }
                {this.state.charts["NODES - KEEP ALIVE"] && <div className="row no-gutters">
                    <TimedateHeatmap units={"system event count"} data={
                        this.state.keepAlive
                    } marginLeft={"250"} name={"NODES - KEEP ALIVE"} id="keepAlive" field={"attrs.sbc"} width={store.getState().width - 300} />
                </div>}
            </div>
        );
    }
}

export default OverviewCharts;
