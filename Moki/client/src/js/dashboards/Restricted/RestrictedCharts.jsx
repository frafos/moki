/*
Class to get data for all charts iin Call dashboard
*/
import React from 'react';

import Dashboard from '../Dashboard.js';
import ValueChart from '../../charts/value_chart.jsx';
import store from "../../store/index";
import ListChart from '../../charts/list_chart.jsx';
import TimedateStackedChart from '../../charts/timedate_stackedbar.jsx';
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
//import StackedLineChart from '../../charts/timedate_stackedbar_with_line_chart.js';
import {parseListData , parseQueryStringData , 
    parseAggData , parseAggSumBucketData, 
    parseBucketData , parseStackedbarTimeData} from '../../../es-response-parser';


class RestrictedCharts extends Dashboard {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            dashboardName: "restricted/home",
            sumCallAttempt: [],
            sumCallEnd: [],
            durationSum: [],
            answerSeizureRatio: [],
            avgDuration: [],
            sumDurationOverTime: [],
            fromUA: [],
            sourceIP: [],
            eventCallsTimeline: [],
            eventExceededTimeline: [],
            top10to: [],
            callingCountries: [],
            avgMoS: [],
            QoSHistogram: [],
            sipcodeCount: [],
            isLoading: true

        };
        this.callBacks = {
            functors: [
              //SUM CALL-END
              [{result: 'sumCallEnd', func: parseQueryStringData}],

              //SUM CALL-ATTEMPT
              [{result: 'sumCallAttempt', func: parseQueryStringData}],

              //CALLING COUNTRIES
              [{result: 'callingCountries', func: parseListData}],

              //DURATION SUM 
              [{result: 'durationSum', func: parseAggData}],

              //ANSWER-SEIZURE RATIO
              [{result: 'answerSeizureRatio', func: parseAggSumBucketData}],

              //AVG DURATION
              [{result: 'avgDuration', func: parseAggData}],

              //SUM DURATION OVER TIME
              [{result: 'sumDurationOverTime', func: parseBucketData}],

              //FROM UA
              [{result: 'fromUA', func: parseListData}],

              //SOURCE IP ADDRESS
              [{result: 'sourceIP', func: parseListData}],

              //EVENT CALLS TIMELINE
              [{result: 'eventCallsTimeline', func: parseStackedbarTimeData}],

              //EVENT EXCEEDED TIMELINE
              [{result: 'eventExceededTimeline', func: parseStackedbarTimeData}],

              //TOP 10 TO
              [{result: 'top10to', func: parseListData}],

              //AVG MoS
              [{result: 'avgMoS', func: parseAggData}]
            ]
        };
    }

    //render GUI
    render() {
        return (<div> {
            this.state.isLoading && < LoadingScreenCharts left="0" />
        } <div className="row no-gutters" >
                <div className="col-auto" >
                    <ValueChart data={
                        this.state.sumCallEnd
                    }
                        name={
                            "# CALLS"
                        }
                        fontSize={
                            "1.5rem"
                        }
                    />  </div> <div className="col-auto" >
                    <ValueChart data={
                        this.state.sumCallAttempt
                    }
                        name={
                            "# ATTEMPTS"
                        }
                        fontSize={
                            "1.5rem"
                        }
                    />  </div> <div className="col-auto" >
                    <ValueChart data={
                        this.state.durationSum
                    }
                        name={
                            "SUM DURATION"
                        }
                        fontSize={
                            "1.5rem"
                        }
                    />  </div>  <div className="col-auto" >
                    <ValueChart data={
                        this.state.answerSeizureRatio
                    }
                        name={
                            "ASR (%)"
                        }
                        fontSize={
                            "1.5rem"
                        }
                    />  </div> <div className="col-auto" >
                    <ValueChart data={
                        this.state.avgDuration
                    }
                        name={
                            "AVG LEN (min)"
                        }
                        fontSize={
                            "1.5rem"
                        }
                    />  </div> <div className="col-auto" >
                    <ValueChart data={
                        this.state.avgMoS
                    }
                        name={
                            "AVG MoS"
                        }
                    />  </div>  </div> <div className="row no-gutters" >
                <TimedateStackedChart id="eventsOverTimeCalls"
                    data={
                        this.state.eventCallsTimeline
                    }
                    name={
                        "EVENTS OVER TIME"
                    }
                    keys={
                        "user"
                    }
                    width={
                        store.getState().width - 300
                    }

                />  </div> <div className="row no-gutters" >

                <TimedateStackedChart id="eventExceededTimeline"
                    data={
                        this.state.eventExceededTimeline
                    }
                    name={
                        "INCIDENTS OVER TIME"
                    }
                    keys={
                        "exceeded"
                    }
                    width={
                        store.getState().width - 300
                    }
                />  </div>

            <div className="row no-gutters" >
                <div className="col-auto" >
                    <ListChart data={
                        this.state.sourceIP
                    }
                        name={
                            "SOURCE IP ADDRESS"
                        }
                        field={
                            "attrs.source"
                        }
                    />  </div> <div className="col-auto" >
                    <ListChart data={
                        this.state.callingCountries
                    }
                        name={
                            "COUNTRIES"
                        }
                        field={
                            "geoip.country_code2"
                        }
                    />  </div> <div className="col-auto" >
                    <ListChart data={
                        this.state.top10to
                    }
                        name={
                            "TOP 10 TO"
                        }
                        field={
                            "attrs.to.keyword"
                        }
                    />  </div>  <div className="col-auto" >
                    <ListChart data={
                        this.state.fromUA
                    }
                        name={
                            "FROM UA"
                        }
                        field={
                            "attrs.from-ua"
                        }
                    />   </div>
            </div>
        </div>
        );
    }
}

export default RestrictedCharts;
