/*
Class to get data for all charts iin Call dashboard
*/
import React from 'react';

import Dashboard from '../Dashboard.js';
import TimedateStackedChart from '@charts/timedate_stackedbar.jsx';
import Geoipchart from '@charts/geoip_map.jsx';
import DonutChart from '@charts/donut_chart.jsx';
import ListChart from '@charts/list_chart.jsx';
import store from "../../store/index";
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import { parseListData, parseAggCities, 
    parseBucketData, parseStackedbarTimeData } from '../../../es-response-parser';


class SecurityCharts extends Dashboard {
    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            ...this.state,
            charts: [],
            dashboardName: "security/charts",
            geoipMap: [],
            eventRegsTimeline: [],
            eventsByIP: [],
            subnets: [],
            eventsByCountry: [],
            typesCount: [],
            geoipHashMap: [],
            signature: [],
            sLoading: true

        };
        this.callBacks = {
            functors: [
                //DISTRIBUTION GEOIP MAP
                [{ result: 'geoipMap', func: parseAggCities }],

                //EVENT SECURITY TIMELINE
                [{ result: 'eventRegsTimeline', func: parseStackedbarTimeData, attrs: ["attrs.type"] }],

                //EVENTS BY IP ADDR
                [{ result: 'eventsByIP', func: parseListData, attrs: ["attrs.source"] }],

                //TOP SUBNETS /24
                [{ result: 'subnets', func: parseListData, attrs: ["attrs.sourceSubnets"] }],

                //EVENTS BY COUNTRY
                [{ result: 'eventsByCountry', func: parseListData, attrs: ["geoip.src.iso_code"] }],

                //SECURITY TYPES EVENTS
                [{ result: 'typesCount', func: parseBucketData, attrs:["attrs.type"] }],

                //DISTRIBUTION HASH GEOIP MAP
                [{ result: 'geoipHashMap', func: parseAggCities }],
                 //EVENTS BY SIGNATURE
                 [{ result: 'signature', func: parseListData, attrs: ["sip.request.sig"] }],
            ]
        };

    }

    //render GUI
    render() {
        return (<div> {
            this.state.isLoading && < LoadingScreenCharts />
        }
            {this.state.charts["EVENTS OVER TIME"] && <div className="row no-gutters" >
                <TimedateStackedChart id="eventsOverTime"
                    data={this.state.eventRegsTimeline}
                    name={"EVENTS OVER TIME"}
                    units={"count"}
                    keys={"security"}
                    width={
                        store.getState().width - 300
                    }
                />  </div>}
            {this.state.charts["SECURITY GEO EVENTS"] && <div className="row no-gutters" >
                <div className="col-auto" >
                    <Geoipchart data={this.state.geoipMap}
                        dataNotShown={this.state.geoipHashMap}
                        type={"geoip"}
                        name={"SECURITY GEO EVENTS"}
                        units={"count"}
                        width={store.getState().width - 300}
                    /> </div> </div>}
            <div className="row no-gutters" >
                {this.state.charts["TYPES"] && <div className="col-auto" style={{"marginRight": "5px"}}>
                    <DonutChart data={this.state.typesCount}
                        units={"count"}
                        name={"TYPES"}
                        id="types"
                        width={store.getState().width / 4 + 30}
                        legendSize={20}
                        height={200}
                        field="attrs.type" />
                </div>}
                {this.state.charts["EVENTS BY IP ADDR"] && <div className="col-auto" >
                    <ListChart data={
                        this.state.eventsByIP
                    }
                        name={
                            "EVENTS BY IP ADDR"
                        }
                        field={
                            "attrs.source"
                        }
                        type="list"
                    />  </div>}
                {this.state.charts["TOP SUBNETS"] && <div className="col-auto" >
                    <ListChart data={
                        this.state.subnets
                    }
                        name={
                            "TOP SUBNETS"
                        }
                        type="list"
                        field={
                            "attrs.sourceSubnets"
                        }
                    />  </div>}
                {this.state.charts["EVENTS BY COUNTRY"] && <div className="col-auto" >
                    <ListChart data={
                        this.state.eventsByCountry
                    }
                        name={
                            "EVENTS BY COUNTRY"
                        }
                        type="list"
                        field={
                            "geoip.country_code2"
                        }
                    />  </div>}
                    {this.state.charts["EVENTS BY SIGNATURE"] && <div className="col-auto" >
                    <ListChart data={
                        this.state.signature
                    }
                        name={
                            "EVENTS BY SIGNATURE"
                        }
                        type="list"
                        field={
                            "sip.request.sig"
                        }
                    />  </div>}
            </div>
        </div>
        );
    }
}

export default SecurityCharts;
