import React, {
  Component
} from 'react';
import { createFilter } from '../../gui';
import Animation from '../helpers/Animation';
import CountryFlag from "../helpers/countryFlag";
import { Navigate } from 'react-router';

import store from "@/js/store";

import clipboardIcon from "/icons/clipboard.png";
import filter from "/icons/filter.png";
import unfilter from "/icons/unfilter.png";
import emptyIcon from "/icons/empty_small.png";

class TableChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data,
      redirect: false,
      page: 0,
      pagginationData: []
    }
    this.filter = this.filter.bind(this);
    this.setData = this.setData.bind(this);
  }

  filter(event) {
    //check for ""
    let value = event.currentTarget.getAttribute('value');
    value = value.replace(/([^"\\]*(?:\\.[^"\\]*)*)"/g, '$1\\"');
    createFilter(event.currentTarget.getAttribute('field') + ":\"" + value + "\"");
    if (this.props.name === "SEVERITY") {
      this.setState({ redirect: true })
    }
  }


  unfilter(event) {
    //check for ""
    let value = event.currentTarget.getAttribute('value');
    value = value.replace(/([^"\\]*(?:\\.[^"\\]*)*)"/g, '$1\\"');
    createFilter("NOT " + event.currentTarget.getAttribute('field') + ":\"" + value + "\"");
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
    i = i - 1;
    //  var pagginationData = i === 1 ? [this.state.data[0].slice(i - 1, i * 10), this.state.data[1]] : [this.state.data[0].slice(i - 1, (i - 1) * 10), this.state.data[1]];
    var pagginationData = [this.state.data[0].slice(i * 10, i * 10 + 10), this.state.data[1]]
    this.setState({
      page: i,
      pagginationData: pagginationData

    })
  }

  //Create buttons list for paggination
  createPaggination() {
    var data = this.state.data?.at(0);
    if (data) {
      var pageCount = Math.ceil(data.length / 10);
      if (pageCount >= 2) {
        var buttons = [];
        for (var i = 0; i < pageCount; i++) {
          buttons.push(<button value={i + 1} key={i + 1} onClick={e => this.setPage(e.target.value)} className={this.state.page === i ? "page-link-active page-link page-link-myPadding " : "page-link page-link-myPadding "}>{i + 1}</button>);
        }
        return buttons;
      }

    }
  }


  encryptedAttr(value) {
    let isEncrypted = false;
    let field = this.props.field;

    //fix for keyword type in attribute's name
    field = field === "attrs.from.keyword" ? "attrs.from" : field;
    field = field === "attrs.to.keyword" ? "attrs.to" : field;
    field = field === "attrs.r-uri.keyword" ? "attrs.r-uri" : field;

    const { profile } = store.getState().persistent;

    if (profile[0] && profile[0].userprefs.mode && profile[0].userprefs.mode === "anonymous" && profile[1].userprefs.anonymizableAttrs[field] && !profile[1].userprefs.anonymizableAttrs[field].includes("NOT-")) {
      isEncrypted = true;
    }

    return <span style={{ "color": isEncrypted ? "darkred" : "#212529" }}>{value}</span>
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

    function shortText(string, name) {
      if (name === "SEVERITY") {
        if (string === 0) {
          return "high";
        }
        else if (string === 1) {
          return "medium";
        }
        else {
          return "low";
        }
      }
      if (string.length > 40) {
        return string.substring(0, 40) + '...';
      }
      else {
        return string;
      }
    }

    //copy value in table to clipboard and show msg
    function copyToclipboard(value) {
      var dummy = document.createElement("textarea");
      document.body.appendChild(dummy);
      dummy.value = value;
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);

      document.getElementById("copyToClipboardText" + value).style.display = "inline";
      setTimeout(function () {
        document.getElementById("copyToClipboardText" + value).style.display = "none";
      }, 1000);
    }

    function longestText(data) {
      if (data.length == 0) return;
      var longestText = 0;
      for (const record of data[0]) {
        longestText = Math.max(longestText, record.key.length);
      }
      return longestText < 30 ? longestText : 30;
    }

    const { profile } = store.getState().persistent;

    if (window.location.pathname === "/web") {
      var data = this.state.data[0];

      while (data && data.length < 3 && data.length !== 0) {
        data.push({ "key": "", "doc_count": "" });
      }

      return (
        <div className="tableChart chart" >
          <h3 className="alignLeft title" style={{ "float": "inherit" }}>{this.props.name}</h3>
          <Animation display="none" name={this.props.name} type={this.props.type} setData={this.setData} dataAll={this.state.data} autoplay={this.props.autoplay} />
          {this.state.pagginationData[0] && this.state.pagginationData[0].length > 0 &&
            <table>
              <tbody>{this.state.pagginationData[0].map((item, key) => {
                return (
                  <tr key={key} style={{ "height": "30px" }}>
                    <td className="listChart filterToggleActiveWhite" id={item.key} style={{ "borderBottom": "none" }} title={item.key}>
                      {(this.props.name.includes("COUNTRY") || this.props.name.includes("COUNTRIES")) && item.key !== "unknown" && item.key !== "" && (profile[0] && profile[0].mode && profile[0].mode !== "anonymous") ? <CountryFlag countryCode={item.key} /> : <span />}
                      {this.encryptedAttr(item.key.substring(0, 16))}
                    </td>
                    {(item.doc_count !== "" && this.state.data[1]) && <td className="listChart" style={{ "borderBottom": "none", "color": "grey" }}>{roundNumber(item.doc_count / this.state.data[1] * 100) + "%"}</td>}
                  </tr>
                )

              })}</tbody>
            </table>
          }
          {((this.state.data[0] && this.state.data[0].length === 0) || this.state.data[0] === "") &&
            <table style={{ "minWidth": "17em" }}>
              <tbody>
                <span className="noDataIcon"> <img alt="nodata" src={emptyIcon} style={{ "marginLeft": "3em", "padding": "1em", "marginTop": "10px", "marginBottom": "11px" }} />  </span>
              </tbody>
            </table>
          }
        </div>)

    }
    else {
      let className = "tableChart chart chartMinHeight";
      let style = {};
      if (this.props.minHeight === "true"){
        className = "tableChart chart";
        style = {"minHeight": "100px"};
      } 
      var isAnimation = window.location.pathname !== "/web" && (this.props.name === "EVENTS BY IP ADDR" || this.props.name === "TOP SUBNETS" || this.props.name === "EVENTS BY COUNTRY"); return (
        <div className={className} style={style}>
          <h3 className="alignLeft title" style={{ "float": isAnimation ? "left" : "inherit" }}>{this.props.name}</h3>
          {isAnimation && <Animation name={this.props.name} type={this.props.type} setData={this.setData} dataAll={this.state.data} />}
          {this.state.pagginationData[0] && this.state.pagginationData[0].length > 0 &&
            <table style={{ "display": "initial" }}>
              <tbody>{this.state.pagginationData[0].map((item, key) => {
                return (
                  <tr key={key}>
                    <td className="filtertd listChart filterToggleActiveWhite" id={item.key} title={item.key} style={{ "width": longestText(this.state.data) * 10 + 150 + "px" }}>
                      {(this.props.name.includes("COUNTRY") || this.props.name.includes("COUNTRIES")) && item.key !== "unknown" && profile[0] && profile[0].mode !== "anonymous" ? <CountryFlag countryCode={item.key} /> : <span />}
                      {this.encryptedAttr(shortText(item.key, this.props.name))}
                      {this.props.field && this.props.disableFilter !== true && <span className="filterToggle">
                        <img onClick={this.filter} field={this.props.field} value={item.key} className="icon" alt="filterIcon" src={filter} />
                        <img field={this.props.field} value={item.key} onClick={this.unfilter} className="icon" alt="unfilterIcon" src={unfilter} />
                        <span><img onClick={() => copyToclipboard(item.key)} className="icon" title="copy to clipboard" alt="clipboardIcon" src={clipboardIcon} /><span id={"copyToClipboardText" + item.key} className="copyToClip">copied to clipboard</span></span>
                      </span>}
                    </td>
                    <td className="alignRight listChart">{niceNumber(item.doc_count, this.props.name)}</td>
                    {(item.doc_count !== "" && this.state.data[1]) && <td className="alignRight listChart tab" style={{ "color": "grey" }}>{roundNumber(item.doc_count / this.state.data[1] * 100) + "%"}</td>}
                  </tr>
                )

              })}</tbody>
            </table>
          }
          {this.props.paggination !== false && <div style={{ "marginTop": "5px", "marginLeft": "25%", "marginBottom": "5px" }}>{this.createPaggination()}</div>}
          {((this.state.data && this.state.data[0] && this.state.data[0].length === 0) || (this.state.data && this.state.data[0] === "")) &&
            <table style={{ "minWidth": "17em" }}>
              <tbody>
                <tr className="noDataIcon"><td><img alt="nodata" src={emptyIcon} className="noDataList" /></td></tr>
              </tbody>
            </table>
          }
          {this.state.redirect && <Navigate push to="/alerts" />}
        </div>
      )
    }
  }
}

export default TableChart;
