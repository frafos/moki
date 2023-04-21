/*
Class to get data for all charts iin Call dashboard
*/
import React, {
    Component
} from 'react';

import ValueChart from '../../charts/value_chart.jsx';
import CircleChart from '../../charts/circle_chart.jsx';
import GaugeChart from '../../charts/gauge_chart.jsx';
import LoadingScreenCharts from '../../helpers/LoadingScreenCharts';
import store from "../../store/index";
import MultiListChart from '../../charts/multiple_list_chart.jsx';
import ListChartMonitoring from '../../charts/list_chart_monitoring.jsx';
import MonitoringListChart from '../../charts/monitoring_list_chart.jsx';
import { parseTimestamp } from "../../helpers/parseTimestamp";
import { elasticsearchConnection } from '../../../gui';
// import BootstrapTable from '@moki-client/react-bootstrap-table-next';
// import paginationFactory, { PaginationProvider } from 'react-bootstrap-table2-paginator';

class MonitoringCharts extends Component {

    // Initialize the state
    constructor(props) {
        super(props);
        this.loadData = this.loadData.bind(this);

        this.state = {
            avgResponseTime: 0,
            usedDiskSpace: 0,
            isLoading: true,
            availableDiskSpace: 0,
            cpu: 0,
            heapUsedPercent: 0,
            elasticsearchStatus: "",
            logstashStatus: "",
            loadAverage1m: 0,
            loadAverage5m: 0,
            loadAverage15m: 0,
            memoryBytes: 0,
            memoryUsed: 0,
            disk: 0,
            eventStats: 0,
            indices: [],
            freeMemory: 0
        }
        store.subscribe(() => this.loadData());


    }

    componentDidMount() {
        this.loadData();
    }

    componentWillUnmount() {
        // fix Warning: Can't perform a React state update on an unmounted component
        this.setState = (state, callback) => {
            return;
        };
    }

    /*
    Load data from elasticsearch
    get filters, types and timerange from GUI
    */
    async loadData() {
        this.setState({
            isLoading: true
        });
        try {
            var data = await elasticsearchConnection("monitoring/charts");
            var events = await elasticsearchConnection("monitoring/events");
            //var sbcEventsStats = await elasticsearchConnection("monitoring/sbc");
        }
        catch (error) {
            console.error("Error receiving data: " + error);
        }

        if (typeof data === "string" && data.includes("ERROR:")) {
            window.notification.showError( { errno: 2, text: data, level: "error" });
            this.setState({ isLoading: false });
            return;
        }
        if (typeof events === "string" && events.includes("ERROR:")) {
            window.notification.showError( { errno: 2, text: events, level: "error" });
            this.setState({ isLoading: false });
            return;
        }
        /*if (typeof sbcEventsStats === "string" && sbcEventsStats.includes("ERROR:")) {
            this.props.showError(sbcEventsStats);
            this.setState({ isLoading: false });
            return;
        }*/

        //get node name
        if (data && data[0] && data[0].hasOwnProperty("nodes")) {
            var node = Object.keys(data[0].nodes)[0];

            //CPU STATS
            // cpu
            var cpu = data[0].nodes[node].os.cpu.percent;

            // One-minute load average on the system
            var loadAverage1m = data[0].nodes[node].os.cpu.load_average["1m"];

            // Five-minute load average on the system
            var loadAverage5m = data[0].nodes[node].os.cpu.load_average["5m"];

            // 15-minute load average on the system
            var loadAverage15m = data[0].nodes[node].os.cpu.load_average["15m"];

            //DISK
            //  (Linux only) - Array of disk metrics for each device that is backing an Elasticsearch data path. These disk metrics are probed periodically and averages between the last probe and the current probe are computed.
            var disk = data[0].nodes[node].fs.io_stats.devices;

            var avgResponseTime = 0;
            //ELASTICSEARCH STATS  
            if (data[0].nodes[node].adaptive_selection[node] && data[0].nodes[node].adaptive_selection[node].avg_response_time_ns) {
                //avgResponseTime
                avgResponseTime = data[0].nodes[node].adaptive_selection[node].avg_response_time_ns / 1000;
            }

            //used disk space
            if (data[0].nodes[node].fs.total.total_in_bytes && data[0].nodes[node].fs.total.available_in_bytes) {
                var usedDiskSpace = ((data[0].nodes[node].fs.total.total_in_bytes - data[0].nodes[node].fs.total.available_in_bytes) / data[0].nodes[node].fs.total.total_in_bytes) * 100;
            }

            // available disk space
            if (data[0].nodes[node].fs.total.available_in_bytes) {
                var availableDiskSpace = data[0].nodes[node].fs.total.available_in_bytes / 1000000;
            }

            // heap used
            if (data[0].nodes[node].jvm.mem && data[0].nodes[node].jvm.mem.heap_used_percent) {
                var heapUsedPercent = data[0].nodes[node].jvm.mem.heap_used_percent;
            }
        }

        if (data && data[1] && data[1].hasOwnProperty("elasticsearch")) {
            //elasticsearch status
            var elasticsearchStatus = data[1].elasticsearch;

            var freeMemory = data[1].memoryFree;
            var memoryBytes = data[1].memoryTotal;

            //LOGSTASH       
            //logstash status
            var logstashStatus = data[1].logstash;

            if (data && data[2] && data[2].hasOwnProperty("indices")) {
                //indices
                var indices = data[2].indices;
            }
        }

        //EVENTS
        if (events && events.events) {
            var eventStats = events.events;
        }

        //SBC - type count
        /*var sbcTypeCount = [];

        if (sbcEventsStats && sbcEventsStats.aggregations && sbcEventsStats.aggregations.agg && sbcEventsStats.aggregations.agg.buckets) {
            sbcTypeCount = sbcEventsStats.aggregations.agg.buckets;
        }
*/

        console.log(new Date() + " MOKI MONITORING: finished parsíng data");

        this.setState({
            avgResponseTime: avgResponseTime,
            usedDiskSpace: usedDiskSpace,
            availableDiskSpace: availableDiskSpace,
            cpu: cpu,
            isLoading: false,
            heapUsedPercent: heapUsedPercent,
            logstashStatus: logstashStatus,
            elasticsearchStatus: elasticsearchStatus,
            loadAverage1m: loadAverage1m,
            loadAverage5m: loadAverage5m,
            loadAverage15m: loadAverage15m,
            memoryBytes: memoryBytes,
            disk: disk,
            indices: indices,
            freeMemory: freeMemory,
            eventStats: eventStats

        });

    }



    //render GUI
    render() {
        const paginationOption = {
            totalSize: 100,
            sizePerPage: 50,
            hideSizePerPage: true,
            paginationSize: 1,
            prePageText: "<",
            nextPageText: ">",
            withFirstAndLast: false
        };

        var columns = [];
        columns.push(
            {
                dataField: 'timestamp',
                text: 'Time',
                formatter: (cell, obj) => {
                        return parseTimestamp(new Date(parseInt(obj.timestamp )));
                    }
            },{
            dataField: 'text',
            text: 'Text'
        },
            {
                dataField: 'level',
                text: 'Level'
            }
        );

        return (<div > {
            this.state.isLoading && < LoadingScreenCharts />
        }
            <h4> NOTIFICATIONS </h4> <div className="row no-gutters bottomMargin" >
                <div className="col-auto" style={{ "marginRight": "5px" }}>
                            <span >
                                <div>
                                    {window.notification.getAllNotifications(true)}
                                </div>
                            </span>
                </div>
            </div>
            <h4> CPU </h4> <div className="row no-gutters bottomMargin" >
                <div className="col-auto" style={{ "marginRight": "5px" }}>
                    <GaugeChart data={this.state.cpu}
                        name={"CPU USAGE (%)"}
                        id={"used_cpu"}
                        width={300}
                    />
                </div>
                <div className="col-auto">
                    <ValueChart data={this.state.loadAverage1m}
                        name={"1-MIN LOAD AVG"}
                    />
                </div>
                <div className="col-auto">
                    <ValueChart data={
                        this.state.loadAverage5m
                    }
                        name={
                            "5-MIN LOAD AVG"
                        }
                    />
                </div> <div className="col-auto">
                    <ValueChart data={
                        this.state.loadAverage15m
                    }
                        name={
                            "15-MIN LOAD AVG"
                        }
                    />
                </div></div>
            <h4> MEMORY </h4> <div className="row no-gutters bottomMargin" >
                <div className="col-auto">
                    <ValueChart data={this.state.freeMemory}
                        name={"FREE MEMORY (KB)"}
                    />
                </div>
                <div className="col-auto" style={{ "marginLeft": "5px" }}>
                    <ValueChart data={
                        this.state.memoryBytes
                    }
                        name={
                            "TOTAL MEMORY (KB)"
                        }
                    />

                </div>
            </div> <h4> DISK(Linux only) </h4> <div className="row no-gutters bottomMargin" >
                <div className="col-auto">
                    <MultiListChart data={
                        this.state.disk
                    }
                        name={
                            "DISK STATS"
                        }
                    />  </div>

            </div>
            <div className="row no-gutters bottomMargin" >
                <span> <h4 style={
                    {
                        "marginTop": "20px"
                    }
                } >
                    LOGSTASH < CircleChart data={
                        this.state.logstashStatus
                    }
                        id={
                            "logstash"
                        }
                    /></h4>


                    <div className="col">  <GaugeChart data={
                        this.state.heapUsedPercent
                    }
                        name={
                            "HEAP USED (%)"
                        }
                        id={
                            "used_heap"
                        }
                        width={
                            300
                        }
                    /></div> </span> <span> <h4 style={
                        {
                            "marginTop": "20px"
                        }
                    } > EVENTS STATS </h4>

                    <MonitoringListChart data={
                        this.state.eventStats
                    }
                    /></span>

            </div>

            <h4>
                ELASTICSEARCH < CircleChart data={
                    this.state.elasticsearchStatus
                }
                    id={
                        "elasticsearch"
                    }
                /></h4>
            <div className="row no-gutters bottomMargin" >
                <GaugeChart data={
                    this.state.usedDiskSpace
                }
                    name={
                        "USED DISK SPACE (%)"
                    }
                    id={
                        "used_disc"
                    }
                    width={
                        300
                    }
                /> <ValueChart data={
                    this.state.availableDiskSpace
                }
                    name={
                        "AVAILABLE DISK SPACE (MB)"
                    }
                />              <ValueChart data={
                    this.state.avgResponseTime
                }
                    name={
                        "AVG RESPONSE (ms)"
                    }
                /> </div> <div className="row no-gutters bottomMargin" >
                <ListChartMonitoring data={
                    this.state.indices
                }
                    name={
                        "INDICES STATS"
                    }
                /> </div>
        </div>
        );
    }
}


/*
 <div className="row no-gutters">
                <MultiListChart data={
                    this.state.sbcTypeCount
                } name={"SBC EVENTS COUNT"} field={"attrs.type"} />
            </div>
*/
export default MonitoringCharts;
