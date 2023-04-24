/*
Class to get data for all charts in Conference dashboard
*/
import React from 'react';

import Dashboard from '../Dashboard.js';
import TimedateStackedChart from '@charts/timedate_stackedbar.jsx';
import ListChart from '@charts/list_chart.jsx';
import ValueChart from '@charts/value_chart.jsx';
import store from "../../store/index";
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import { parseListData, parseAggAvgCnt, parseStackedbarTimeData, 
    parseQueryStringData, parseAggData, parseAggQueryWithoutScriptValue, 
    parseListDataSort} from '../../../es-response-parser';


class ConferenceCharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
           dashboardName: "conference/charts",
           sumCallEnd: [],
           sumCallStart: [],
           durationSum: [],
           durationAvg: [],
           avgParticipants: [],
           topConferences: [],
           eventCallsTimeline: [], 
           activeConf: 0,
           topActiveConferences: [],
           topParticipants: [],
           isLoading: false,
        }
        this.callBacks = {
            functors: [
                //SUM CONF-LEAVE
                [{result: 'sumCallEnd', func: parseQueryStringData}],
       
                //SUM CONF-JOIN
                [{result: 'sumCallStart', func: parseQueryStringData}],

                //DURATION SUM 
                [{result: 'durationSum', func: parseAggData}],
                
                //DURATION SUM 
                [{result: 'durationAvg', func: parseAggData}],

                //AVG PARTICIPANTS
                [{result: 'avgParticipants', func: parseAggAvgCnt}],

                //TOP CONFERENCES
                [{result: 'topConferences', func: parseListData}],

                //EVENT CALLS TIMELINE
                [{result: 'eventCallsTimeline', func: parseStackedbarTimeData}],
                
                //CONFERENCE ACTUAL
                [{result: 'activeConf', func: parseAggQueryWithoutScriptValue}],
                
                //TOP PARTICIPANTS
                [{result: 'topParticipants', func: parseListData}],
                
                //TOP ACTIVE CONF
                [{result: 'topActiveConferences', func: parseListDataSort}]
            ]
        };
    }
    
    //render GUI
    render() {
        return (
            <div> 
           { this.state.isLoading && <LoadingScreenCharts />   } 

                <div className="row no-gutters">
                    <div className="col-auto">
                            <ValueChart data = {
                                this.state.activeConf
                            } name= {"ACTIVE"}/> 
                    </div> 
                    <div className="col-auto">
                            <ValueChart data = {
                                this.state.sumCallEnd
                            }  name= {"LEAVEs"}/> 
                    </div>
                    <div className="col-auto">
                            <ValueChart data = {
                                this.state.sumCallStart
                            } name= {"JOINs"}/> 
                    </div>
                    <div className="col-auto">
                        <ValueChart data = {
                                    this.state.durationSum
                                } name= {"MAX DURATION"}/> 
                        </div>
                    <div className="col-auto">
                            <ValueChart data = {
                                this.state.durationAvg
                            } name= {"AVG DURATION"}/> 
                    </div>
                    <div className="col-auto">
                            <ValueChart data = {
                                this.state.avgParticipants
                            } name= {"AVG PARTICIPANT"}/> 
                    </div> 
            
            </div>
            <div className = "row no-gutters" >
                    <TimedateStackedChart id="eventsOverTime" data = {
                        this.state.eventCallsTimeline
                    } keys="conference"  name={"EVENTS OVER TIME"}  width={store.getState().width-300}
                    /> 
            </div>
            <div className = "row no-gutters" >
                <div className="col-auto">
                    <ListChart data = {
                        this.state.topConferences 
                    } name={"TOP CONFERENCES"} field= {"attrs.conf_id"}/> 
                </div>
                    <div className="col-auto">
                    <ListChart data = {
                        this.state.topActiveConferences 
                    } name={"TOP ACTIVE CONFERENCES"} field= {"attrs.conf_id"}/> 
                </div>
                <div className="col-auto">
                    <ListChart data = {
                        this.state.topParticipants 
                    } name={"TOP PARTICIPANTS"} field= {"attrs.from.keyword"}/> 
                </div>
            </div>
        </div>
        );
    }
}

export default ConferenceCharts;
