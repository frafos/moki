/*
Class to get data for all charts iin Call dashboard
*/
import React, {
    Component
} from 'react';

import TimedateStackedChart from '../../charts/timedate_stackedbar.js';
import Geoipchart from '../../charts/geoip_map.js';
import DonutChart from '../../charts/donut_chart.js';
import ListChart from '../../charts/list_chart.js';
import store from "../../store/index";
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import DashboardsTypes from '../../helpers/DashboardsTypes';
import {
    elasticsearchConnection
} from '../../helpers/elasticsearchConnection';
import parseListData from '../../parse_data/parseListData.js';
import parseAggCities from '../../parse_data/parseAggCities.js';
var parseBucketData = require('../../parse_data/parseBucketData.js');
const parseStackedTimebar = require('../../parse_data/parseStackedbarTimeData.js');


class SecurityCharts extends Component {

    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            dashboardName: "security/charts",
            geoipMap: [],
            eventRegsTimeline: [],
            eventsByIP: [],
            subnets: [],
            eventsByCountry: [],
            typesCount: [],
            sLoading: true

        };
        this.callBacks = {
            functors: [
              //DISTRIBUTION GEOIP MAP
              [{result: 'geoipMap', func: parseAggCities}],

              //EVENT SECURITY TIMELINE
              [{result: 'eventRegsTimeline', func: parseStackedTimebar.parse}],

              //EVENTS BY IP ADDR
              [{result: 'eventsByIP', func: this.parseListData}],

              //TOP SUBNETS /24
              [{result: 'subnets', func: parseListData}],

              //EVENTS BY COUNTRY
              [{result: 'eventsByCountry', func: parseListData}],

              //SECURITY TYPES EVENTS
              [{result: 'typesCount', func: parseBucketData.parse}]
            ]
        };

    }

  parseListData(response) {
    return parseListData(response, true);
  }


    //render GUI
    render() {
        return (<div> {
            this.state.isLoading && < LoadingScreenCharts />
        }
            <div className="row no-gutters" >
                <
                    TimedateStackedChart id="eventsOverTime"
                    data={
                        this.state.eventRegsTimeline
                    }
                    name={
                        "EVENTS OVER TIME"
                    }
                    units={"count"}
                    keys={
                        DashboardsTypes["security"]
                    }
                    width={
                        store.getState().width - 300
                    }
                />  </div> <div className="row no-gutters" >
                <div className="col" >
                    <
                        Geoipchart data={
                            this.state.geoipMap
                        }
                        type={"geoip"}
                        name={"SECURITY GEO EVENTS"}
                        units={"count"}
                        width={
                            store.getState().width - 300
                        }
                    /> </div> </div> <div className="row no-gutters" >
                <div className="col" >
                    <DonutChart data={this.state.typesCount}
                        units={"count"}
                        name={
                            "TYPES"
                        }
                        id="types"
                        width={
                            store.getState().width / 4 + 30
                        }
                        legendSize={
                            20
                        }
                        height={
                            200
                        }
                        field="attrs.type" />
                </div>
                <div className="col" >
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
                    />  </div> <div className="col" >
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
                    />  </div> <div className="col" >
                    <ListChart data={
                        this.state.eventsByCountry
                    }
                        name={
                            "EVENTS BY COUNTRY"
                        }
                        type="list"
                        field={
                            "geoip.country_name"
                        }
                    />  </div>
            </div>
        </div>
        );
    }
}

export default SecurityCharts;
