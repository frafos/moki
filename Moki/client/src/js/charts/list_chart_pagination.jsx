import React, {
  Component
} from 'react';
import { createFilter } from '@moki-client/gui';
import filter from "../../styles/icons/filter.png";
import unfilter from "../../styles/icons/unfilter.png";
import emptyIcon from "../../styles/icons/empty_small.png";
import Animation from '../helpers/Animation';
import ReactCountryFlag from "react-country-flag";


class TableChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      page: 0,
      pagginationData: []
    }
    this.filter = this.filter.bind(this);
    this.setData = this.setData.bind(this);
  }

  filter(event) {
    createFilter(event.currentTarget.getAttribute('field') + ":\"" + event.currentTarget.getAttribute('value') + "\"");
  }


  unfilter(event) {
    createFilter("NOT " + event.currentTarget.getAttribute('field') + ":\"" + event.currentTarget.getAttribute('value') + "\"");
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.data !== prevState.data) {
      return { data: nextProps.data };
    }
    else return null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.data !== this.props.data) {
      //data format: [list, sum]
      var pagginationData = [];
      if (this.props.data.length > 0) {
        pagginationData = [this.props.data[0].slice(0, 10), this.props.data[1]]
      }
      this.setState({
        data: this.props.data,
        pagginationData: pagginationData
      });
    }
  }

  setData(data) {
    this.setState({ data: data });
  }

  //change paggination page
  setPage(i) {
    i = parseInt(i);
    var pagginationData = i === 1 ? [this.state.data[0].slice(i - 1, i * 10), this.state.data[1]] : [this.state.data[0].slice(i - 1, (i - 1) * 10), this.state.data[1]];
    this.setState({
      page: i - 1,
      pagginationData: pagginationData

    })
  }

  //Create buttons list for paggination
  createPaggination() {
    const data = this.state.data?.at(0);
    if (data) {
      var pageCount = Math.ceil(data.length / 10);
      console.log(data);
      // console.log(data.length/10);
      //console.log(pageCount);
      if (pageCount >= 2) {
        var buttons = [];
        for (var i = 0; i < pageCount; i++) {
          buttons.push(<button value={i + 1} onClick={e => this.setPage(e.target.value)} className={this.state.page === i ? "page-link-active page-link page-link-myPadding " : "page-link page-link-myPadding "}>{i + 1}</button>);
        }
        return buttons;
      }

    }
  }
  render() {
    function niceNumber(nmb, name) {
      if (name.includes("DURATION") && name !== "DURATION GROUP" && name !== "TOP DURATION < 5 sec") {
        var sec_num = parseInt(nmb, 10);

        var days = Math.floor(sec_num / 86400) ? Math.floor(sec_num / 86400) + "d" : "";

        var hours = Math.floor(sec_num / 3600) ? Math.floor(sec_num / 3600) + "h" : "";

        var minutes = Math.floor((sec_num % 3600) / 60) ? Math.floor((sec_num % 3600) / 60) + "m" : "";

        var seconds = sec_num % 60 ? sec_num % 60 + "s" : "";

        //don't  display seconds if value is in days
        if (days) {
          seconds = "";
        }

        if (!days && !hours && !minutes && !seconds) return "0s";
        return days + " " + hours + " " + minutes + " " + seconds;
      }
      else if (nmb) {
        return nmb.toLocaleString();
      } else {
        return 0;
      }
    }

    function roundNumber(nmb) {
      if (nmb) {
        return nmb.toFixed(2).toLocaleString();
      }
      else return nmb;
    }

    return (

      <div className="tableChart chart chartMinHeight">
        <h3 className="alignLeft title" style={{"float": "inherit"}}>{this.props.name}</h3>
        {(window.location.pathname !== "/web" && (this.props.name === "EVENTS BY IP ADDR" || this.props.name === "TOP SUBNETS" || this.props.name === "EVENTS BY COUNTRY")) && <Animation name={this.props.name} type={this.props.type} setData={this.setData} dataAll={this.state.data} />}
        {this.state.pagginationData[0] && this.state.pagginationData[0].length > 0 &&
          <table>
            <tbody>{this.state.pagginationData[0].map((item, key) => {
              return (
                <tr key={key}>
                  <td className="filtertd listChart filterToggleActiveWhite" id={item.key} > 
                  { this.props.disableFilter !== true &&  <span className="filterToggle">
                   <img onClick={this.filter} field={this.props.field} value={item.key} className="icon" alt="filterIcon" src={filter} />
                    <img field={this.props.field} value={item.key} onClick={this.unfilter} className="icon" alt="unfilterIcon" src={unfilter} />
                  </span>}
                    {(this.props.name.includes("COUNTRY") || this.props.name.includes("COUNTRIES")) && item.key !== "unknown" ? <ReactCountryFlag style={{ "marginRight": "5px" }} countryCode={item.key} svg /> : <span />}
                    {item.key}
                  </td>
                  <td className="alignRight listChart">{niceNumber(item.doc_count, this.props.name)}</td>
                  <td className="alignRight listChart tab">{roundNumber(item.doc_count / this.state.data[1] * 100) + "%"}</td>
                </tr>
              )

            })}</tbody>
          </table>
        }
        {this.createPaggination()}
        { ((!this.state.data || (this.state.data[0] && this.state.data[0].length === 0)) || this.state.data[0] === "") &&
          <table style={{ "minWidth": "17em" }}>
            <tbody>
              <tr><td><span></span></td></tr>

              <tr><td> <span className="noDataIcon"> <img alt="nodata" src={emptyIcon} className="noDataList" />  </span></td></tr>
            </tbody>
          </table>
        }
      </div>
    )

  }
}

export default TableChart;