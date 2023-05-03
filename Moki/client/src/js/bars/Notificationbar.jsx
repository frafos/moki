import React, { Component } from 'react';
import { status } from '../helpers/status'
import { diskSpace } from '../helpers/status';
import { Navigate } from 'react-router';

import store from "@/js/store";

import infoIcon from "/icons/info.png";
import warningIcon from "/icons/warning.png";

/*
FORMAT   {errno: X, text: Y, level: Z}
LEVELS
1) error
    - {errno: 1, text: "Logstash is not running", level: "error"}
    - {errno: 2, text: "Elasticsearch is not running", level: "error"}
    - {errno: 3, text: "Disk full > 90%", level: "error"}
    - {errno: 6, text: "Can't connect to monitor server", level: "error" }
2) warning
    - {errno: 4, text: "Disk full > 80%", level: "warning"}
3) info
    - {errno: 5, text: "Downloading data", level: "info"}

*/
const NOTIFICATIONS = [
    {},
    { errno: 1, text: "Logstash is not running", level: "error" },
    { errno: 2, text: "Elasticsearch is not running", level: "error" },
    { errno: 3, text: "Disk full > 90%", level: "error" },
    { errno: 4, text: "Disk full > 80%", level: "warning" },
    { errno: 5, text: "Downloading data", level: "info" },
    { errno: 6, text: "Can't connect to monitor server", level: "error" }
]
class Notificationbar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            notifications: [],
            allNotifications: [],
            redirect: false,
            diskSpace: null,
            statusCheck: null
        }
        this.remove = this.remove.bind(this);
        this.getAllNotifications = this.getAllNotifications.bind(this);
        this.showError = this.showError.bind(this);
        this.dontshow = this.dontshow.bind(this);
        this.shouldShow = this.shouldShow.bind(this);
        this.update = this.update.bind(this);
        window.notification = this;

    }

    async componentDidMount() {
        var self = this;
        const user = store.getState().persistent.user;
        console.log(user);
        if (user && user.user !== "DEFAULT") {
            //ES, logstash status check every 30s
            let statusCheck = setInterval(async function () {
                let result = await status();
                if (result.status !== "ok") {
                    self.showError(result.status);
                }
                else {
                    self.remove(1);
                    self.remove(2);
                }
            }, 30000);

            //disk check, very 30s
            let diskSpaceCheck = setInterval(async function () {
                let result = await diskSpace();
                if (result.status !== "ok") {
                    self.showError(result.status);
                }
                else {
                    self.remove(3);
                    self.remove(4);
                }
            }, 30000);

            this.setState({
                statusCheck: statusCheck,
                diskSpace: diskSpaceCheck
            });
        }
    }

    componentWillUnmount() {
        clearTimeout(this.state.statusCheck);
        clearTimeout(this.state.diskSpace);
    }

    /**
* display errors in error bar
* @param {errors}  string
* @return {} 
* */
    showError(error) {
        let isFound = false;
        for (let j = 0; j < this.state.notifications.length; j++) {
            if (this.state.notifications[j].errno === error.errno) {
                isFound = true;
                continue;
            }
        }
        if (!isFound) {
            error.timestamp = Date.now();

            this.setState({
                notifications: this.state.notifications.concat(error),
                allNotifications: this.state.notifications.concat(error)
            });
        }
    }


    /**
    * get notification object
    * @param {string}  errno  
    * @return {object} 
    * */
    getNotification(errno) {
        return NOTIFICATIONS[errno];
    }

    /**
  * get notification 
  * @param {string}  with history or not   
  * @return {object} 
  * */
    getAllNotifications(history = false) {
        if (history) {
            return this.state.allNotifications;
        }
        else {
            return this.state.notifications;
        }
    }

    /**
    * remove notification 
    * @param {object}  error an error 
    * @return {} stores in state 
    * */
    remove(errno) {
        var array = [...this.state.notifications];
        let isFound = false;
        for (let j = 0; j < array.length; j++) {
            if (array[j].errno === errno) {
                isFound = true;
                //for warning type only
                if (array[j].level === "warning") {
                    this.dontshow(errno);
                }
                array.splice(j, 1);

            }
        }

        if (isFound) {
            this.setState({ notifications: array });
        }
    }

    /**
    * update notification 
    * @param {object}  error an error 
    * @return {} stores in state 
    * */
    update(errno) {
        var array = [...this.state.notifications];
        let isFound = false;
        for (let j = 0; j < array.length; j++) {
            if (array[j].errno === errno.errno) {
                array[j] = errno;
                isFound = true;
                continue;
            }
        }

        if (isFound) {
            this.setState({ notifications: array });
        }
    }

    /**
  * don't show notification for one day 
  * @param {string}  errno
  * @return {} stores in state 
  * */
    dontshow(errno) {
        //dontshowNotification
        let dontshowNotification = JSON.parse(window.localStorage.getItem("dontshowNotification"));
        if (!dontshowNotification) dontshowNotification = [];
        let isFound = false;
        for (let notification of dontshowNotification) {
            if (notification.errno === errno) {
                isFound = true;
            }
        }
        if (!isFound) {
            dontshowNotification.push({ errno: errno, time: Date.now() });
            window.localStorage.setItem("dontshowNotification", JSON.stringify(dontshowNotification));
        }
    }

    shouldShow() {
        var notifications = this.state.notifications;
        var dontshowNotification = JSON.parse(window.localStorage.getItem("dontshowNotification"));
        if (!dontshowNotification) dontshowNotification = [];
        var result = [];
        var dontShowresult = [];
        //check for don't show nofications
        for (let notification of notifications) {
            if (dontshowNotification.length === 0) {
                result = notifications;
                continue;
            }
            for (let dontshow of dontshowNotification) {
                if (dontshow.errno === notification.errno) {
                    if (new Date() - 1000 * 60 * 60 > dontshow.time) {
                        result.push(notification);
                    }
                    else {
                        dontShowresult.push(notification);
                    }
                }
                else {
                    result.push(notification);
                }
            }
            window.localStorage.setItem("dontshowNotification", JSON.stringify(dontShowresult));
        }

        return result;
    }

    render() {
        var notifications = this.shouldShow();
        if (notifications.length === 0) {
            return (<div></div>)
        } else {
            return (
                <div className="row" >
                    {window.location.pathname !== "/monitoring" && <div className={this.props.className}>  {this.state.notifications.map((notification, i) => {
                        return <div key={i} style={notification.level === "error" ? { "backgroundColor": "#FD3031", "padding": "10px", "border": "0.05rem solid" } : notification.level === "warning" ? { "backgroundColor": "#FEBD02", "padding": "10px", "border": "0.05rem solid" } : { "backgroundColor": "#34C15D", "padding": "10px", "border": "0.05rem solid" }}>
                            <img className="icon" alt="icon" src={notification.level === "error" ? warningIcon : notification.level === "warning" ? warningIcon : infoIcon} />
                            <span onClick={() => this.setState({ "redirect": true })} style={{ "cursor": "pointer", "paddingLeft": "25px" }}>{notification.text}</span>
                            {notification.level !== "error" && <button style={{ "float": "right", "marginRight": "20px", "color": "white", "fontSize": "25px" }} className="closeButton" onClick={() => this.remove(notification.errno)}>&times;</button>}
                        </div>
                    })}
                    </div>}
                    {this.state.redirect && <Navigate push to="/monitoring" />}
                </div>)
        }
    }
}

export default Notificationbar;
