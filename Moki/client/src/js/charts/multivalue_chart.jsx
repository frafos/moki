import { Component } from 'react';
import { formatDuration } from "@/js/helpers/formatTime";
import { createFilter } from '../../gui';

import sortIcon from "/icons/sort.png";
import filter from "/icons/filter.png";
import unfilter from "/icons/unfilter.png";

export default class multivalueChart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            direction: "desc",
            page: 0,
            pagginationData: []
        }
        this.order = this.order.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.data !== prevState.data) {
            return { data: nextProps.data };
        }
        else return null;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.data !== this.props.data) {
            this.setState({ data: this.props.data });

            //data format: [list, sum]
            var pagginationData = [];
            if (this.props.data.length > 0) {
                pagginationData = this.props.data.slice(0, 10)
            }
            this.setState({
                data: this.props.data,
                pagginationData: pagginationData
            });
        }
    }

    filter(event) {
        createFilter(event.currentTarget.getAttribute('field') + ":\"" + event.currentTarget.getAttribute('value') + "\"");
    }


    unfilter(event) {
        createFilter("NOT " + event.currentTarget.getAttribute('field') + ":\"" + event.currentTarget.getAttribute('value') + "\"");
    }

    sortByKey(array, key, direction) {
        if (direction === "desc") {
            return array.sort(function (a, b) {
                var x = a[key];
                var y = b[key];
                return ((x > y) ? -1 : ((x < y) ? 1 : 0));
            });
        }
        else {
            return array.sort(function (a, b) {
                var x = a[key];
                var y = b[key];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        }
    }

    //change paggination page, stay on same page or move
    setPage(i, stay = false) {
        i = parseInt(i);
        var pagginationData = i === 1 ? this.state.data.slice(0, 10) : this.state.data.slice((i * 10) - 10, i * 10);
        if (stay) {
            this.setState({
                pagginationData: pagginationData
            })
        }
        else {
            this.setState({
                page: i - 1,
                pagginationData: pagginationData
            })
        }
    }

    //Create buttons list for paggination
    createPaggination() {
        var data = this.state.data;
        if (data) {
            var pageCount = Math.ceil(data.length / 10);
            if (pageCount >= 2) {
                var buttons = [];
                for (var i = 0; i < pageCount; i++) {
                    buttons.push(<button value={i + 1} key={i} onClick={e => this.setPage(e.target.value)} className={this.state.page === i ? "page-link-active page-link page-link-myPadding " : "page-link page-link-myPadding "}>{i + 1}</button>);
                }
                return buttons;
            }

        }
    }

    order(event) {
        if (this.state.direction === "desc") {
            this.setState({ direction: "asc" })
        }
        else {
            this.setState({ direction: "desc" })
        }
        var dataSorted = this.sortByKey(this.state.data, event.currentTarget.getAttribute('field'), this.state.direction);
        this.setState({ data: dataSorted }, function () { this.setPage(this.state.page, true) });
    }

    render() {
        function niceNumber(nmb) {
            if (nmb) {
                return nmb.toLocaleString();
            } else {
                return 0;
            }
        }


        var data = this.state.pagginationData;
        var items = [];

        if (data) {
            for (var i = 0; i < data.length; i++) {
                items.push(<tr key={i}><td className="filterToggleActiveWhite">
                    <div className='d-flex'>
                        <span className="filterToggle">
                            <img onClick={this.filter} field={this.props.field} value={data[i].name} className="icon" alt="filterIcon" src={filter} />
                            <img field={this.props.field} value={data[i].name} onClick={this.unfilter} className="icon" alt="unfilterIcon" src={unfilter} />
                        </span>
                        <div title={data[i].name} className="table-text-truncate">{data[i].name}</div>
                    </div>
                </td>
                    {data[i] && data[i].values && Object.keys(data[i].values).length > 0 && Object.keys(data[i].values).map((value, j) => {
                        return data[i] ? <td className="filtertd text-nowrap" key={value}>{j === 1 && this.props.name3 === "Duration" ? formatDuration(data[i].values[value]) : niceNumber(data[i].values[value])}</td> : 0
                    })}
                </tr>
                )
            }
            if (data.length === 0) {
                items.push(<tr key={"key"}><td key={"value"}>-</td>
                    {data && data[0] && data[0].values && data[0].values.map((value, i) => {
                        return <td className="filtertd" key={"value" + i}>0</td>
                    })}
                </tr>
                )
            }
        }

        let columnNames = [];
        for (let hit of Object.keys(this.props)) {
            if (hit.includes("name")) {
                columnNames.push(this.props[hit]);
            }
        }

        return (
            <div id={this.props.id} style={{ "width": "100%" }} className="chart">
                <h3 className="alignLeft title">{this.props.title}</h3>
                <div className="table-margins">
                    <table style={{ "width": "100%" }} className="m-0">
                        <tbody>
                            <tr>
                                {columnNames.length > 0 && columnNames.map((value, i) => {
                                    return <th key={value}><h3 className="text-nowrap">{value}<img onClick={this.order} field={"value" + i} className="icon" alt="filterIcon" src={sortIcon} /></h3></th>
                                })}
                            </tr>
                            {items}
                            {this.state.data && this.state.data.length > 10 && this.createPaggination()}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}


//<h4 className="alignLeft">{niceNumber(this.props.data[1])}</h4>