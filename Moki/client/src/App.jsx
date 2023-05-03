import React, { Component } from 'react';
import './App.css';
import NavBar from './js/bars/NavigationBar';
import FirstLoginPopup from './js/helpers/firstLoginPopup';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TimerangeBar from './js/bars/SetTimerangeBar';
import { getLayoutSettings } from './js/helpers/getLayout';
import { getSettings } from './js/helpers/getSettings';
import FilterBar from './js/bars/FilterBar.jsx';
import Restricted from './js/dashboards/Restricted/Restricted';
import Sequence from './js/pages/sequenceDiagram';
import { Navigate } from 'react-router';
import { paths } from "./js/controllers/paths.jsx";
import Popup from "./js/helpers/Popup";
import Notificationbar from './js/bars/Notificationbar';
import { parseTimestamp } from "./js/helpers/parseTimestamp";
import { getUsername } from "./js/helpers/getUsername";
import querySrv from './js/helpers/querySrv';
import { createFilter, getProfile } from './gui';
import DecryptPasswordPopup from './gui/src/menu/decryptPasswordPopup';

import store from "@/js/store";
import { setTimerange, setUser, setChartsWidth, 
    setLayout, setSettings, setFilters } from "@/js/slices";

const BASE_NAME = import.meta.env.BASE_URL;


//General class - check user level, profile from ES, monitor_layout before loading monitor
//return router with dashboards and bars
class App extends Component {
    // Initialize the state
    constructor(props) {
        super(props);
        this.state = {
            redirect: false,
            firstTimeLogin: false,
            isLoading: true,
            aws: true,
            monitorName: "",
            admin: false,
            siteAdmin: false,
            hostnames: "",
            dstRealms: [],
            tags: [],
            tagsFull: [],
            srcRealms: [],
            dashboards: [],
            dashboardsUser: [],
            dashboardsSettings: [],
            logo: "",
            user: {},
            resizeId: "",
            autologout: null,
            automaticLogoutTime: "never"
        }
        this.setFirstTimeLogin = this.setFirstTimeLogin.bind(this);
        this.redirect = this.redirect.bind(this);
        this.getHostnames = this.getHostnames.bind(this);
        this.checkURLFilters = this.checkURLFilters.bind(this);
        this.rerenderUsername = this.rerenderUsername.bind(this);
        this.updateExpiredTime = this.updateExpiredTime.bind(this);
        this.startAutomaticLogout = this.startAutomaticLogout.bind(this);
        this.setAutomaticLogout = this.setAutomaticLogout.bind(this);
        this.getSipUser();
        store.subscribe(() => this.rerenderUsername());
    }

    componentDidMount() {
        var thiss = this;
        //resize window function
        window.addEventListener('resize', function () {
            if (thiss.state.resizeId) clearTimeout(thiss.state.resizeId);
            thiss.setState({ resizeId: setTimeout(thiss.windowResize, 500) });
        });

    }

    //set automatic logout on inactivity
    setAutomaticLogout() {
        window.addEventListener('mousemove', this.updateExpiredTime);
        window.addEventListener('scroll', this.updateExpiredTime);
        window.addEventListener('keydown', this.updateExpiredTime);
    }

    updateExpiredTime() {
        localStorage.setItem("autoResetTime", Date.now() + this.state.automaticLogoutTime * 1000);

    }

    //restart auto reset
    startAutomaticLogout() {
        this.updateExpiredTime();
        let autologout = setInterval(() => {
            //update timeout in localstorage - more tab case
            const autoReset = localStorage.getItem("autoResetTime");
            if (parseInt(autoReset) < Date.now()) {
                 window.location = '/logout';
                this.cleanAutimaticTimeout();
            }
        }, 1000);

        this.setState({
            autologout: autologout
        })
    };

    cleanAutimaticTimeout(){
        clearInterval(this.state.autologout);
        window.removeEventListener('mousemove', this.updateExpiredTime);
        window.removeEventListener('scroll', this.updateExpiredTime);
        window.removeEventListener('keydown', this.updateExpiredTime);
    }

    //when user has changed, rerender it in GUI
    rerenderUsername() {
        var sipUser = { ...store.getState().persistent.user };
        if (sipUser) {
            if (sipUser.aws === false) {
                sipUser.account = "Account: " + sipUser.username;
            }
            else {
                sipUser.account = sipUser.email ? sipUser.user + ": " + sipUser.email : sipUser.username ? sipUser.user + " " + sipUser.username : sipUser.user;
            }
        } else {
            sipUser.account = "";
        }

        this.setState({ user: sipUser })
    }

    //check url parameters for filters
    async checkURLFilters() {
        //change timerange if set in url
        //format: from=XXXXXXX&to=YYYYYYYY
        let params = (new URL(decodeURI(window.location))).searchParams;
        if (params) {
            var timestamp_gte = parseInt(params.get("from"));
            var timestamp_lte = parseInt(params.get("to"));
            if (timestamp_gte && timestamp_lte) {
                var timestamp_readiable = parseTimestamp(new Date(timestamp_gte)) + " - " + parseTimestamp(new Date(timestamp_lte));

                store.dispatch(setTimerange([timestamp_gte, timestamp_lte, timestamp_readiable]));

                this.setState({
                    timerange: timestamp_readiable,
                    timestamp_gte: timestamp_gte,
                    timestamp_lte: timestamp_lte
                });
            }

            var result = [];
            var filters = params.getAll("filter");
            if (filters) {
                var id = 1;
                for (let filter of filters) {
                    result.push(await createFilter(filter, id, false, true, false));
                    id++;
                }
                store.dispatch(setFilters(result));
            }
        }

    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.windowResize);
    }

    /**
* get monitor version from cmd and layout settings
* @return {} stores everything in state
* */
    async getMonitorSettings() {
        //get monitor version
        var url = BASE_NAME + "api/monitor/version";
        var monitorVersion = "";
        try {
            const response = await querySrv(url, {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            });
            monitorVersion = await response.json();
            monitorVersion = monitorVersion.error ? "" : monitorVersion.version;

        } catch (error) {
            console.error(error);
        }


        var res = await getProfile(this.state.user);
        var aws = this.state.user.aws;

        //set automatic logout for aws
        if (aws === true && store.getState().persistent.profile[0] && store.getState().persistent.profile[0].userprefs.autologout !== "never") {
            this.setState({
                automaticLogoutTime: store.getState().persistent.profile[0].userprefs.autologout
            }, () =>  {
                this.setAutomaticLogout();
                this.startAutomaticLogout();
            })
        }

        if (res !== "ok") {
            //this.showError(JSON.stringify(res));
        }

        //store layout
        var jsonData = await getLayoutSettings();
        store.dispatch(setLayout(jsonData));
        console.info(jsonData);
        console.info("Storing layout");

        //get settings if exists
        if (aws !== true) {
            var jsonSettings = await getSettings();
            store.dispatch(setSettings(jsonSettings));

            //check if first time login
            const response = await querySrv(BASE_NAME + "api/firsttimelogin/check", {
                method: "GET",
                timeout: 10000,
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            });

            const json = await response.json();
            if (!response.ok) {
                return;
            }
            if (json.msg && json.msg === true) {
                this.setState({ firstTimeLogin: true });
            }
        }

        //get dashboard list
        var dashboards = Object.keys(jsonData.dashboards);
        if ((this.state.aws && !this.state.admin) || !this.state.aws) {
            dashboards = dashboards.filter(dashboard => jsonData.dashboards[dashboard]);
        }

        this.setState({
            dashboards: dashboards
        });

        //get settings dashboard list
        var dashboardsSettings = Object.keys(jsonData.settingsDashboards);
        if ((this.state.aws && !this.state.admin) || !this.state.aws) {
            dashboardsSettings = dashboardsSettings.filter(dashboard => jsonData.settingsDashboards[dashboard]);

            //remove users from settings
            dashboardsSettings = dashboardsSettings.filter(dashboard => dashboard !== "users");
        }

        //for admin level aws remove WBlist
        if (this.state.aws && this.state.admin) {
            dashboardsSettings = dashboardsSettings.filter(dashboard => dashboard !== "wblist");
            dashboardsSettings = dashboardsSettings.filter(dashboard => dashboard !== "settings");
            dashboardsSettings = dashboardsSettings.filter(dashboard => dashboard !== "alarms");
        }

        this.setState({
            dashboardsSettings: dashboardsSettings
        });

        //get user dashboard list
        var userSettings = Object.keys(jsonData.userDashboards);
        if ((this.state.aws && !this.state.admin) || !this.state.aws) {
            userSettings = userSettings.filter(dashboard => jsonData.userDashboards[dashboard]);
        }
        this.setState({
            dashboardsUser: userSettings
        });

        //set logo
        this.setState({
            logo: jsonData.logo
        });

        //set favicon
        this.setState({ logo: "data:;base64," + await this.getLogo("logo") },
            async () => {
                document.getElementById("favicon").href = "data:;base64," + await this.getLogo("favicon");

                //set main and secondary color
                document.body.style.setProperty('--main', jsonData.color);
                document.body.style.setProperty('--second', jsonData.colorSecondary);

                let monitorName = "";
                if (!this.state.aws) {
                    for (let hit of jsonSettings[0].attrs) {
                        if (hit.attribute === "monitor_name") {
                            monitorName = hit.value;
                        }
                    }
                } else {
                    monitorName = jsonData.name;
                }
                this.setState({
                    monitorName: monitorName + " " + monitorVersion,
                    isLoading: false
                });
            });

        await this.checkURLFilters();
    }

    //change value if first time login
    setFirstTimeLogin(value) {
        this.setState({
            firstTimeLogin: value
        })
    }

    /**
* load logo from server based on the path in monitor_layout.json
* @param {path}  path path to logo img
* @return {base64} return img in base64
* */
    async getLogo(type) {
        let path = "api/monitor/favicon";
        if (type === "logo") {
            path = "api/monitor/logo";
        }

        var url = BASE_NAME + path;
        try {
            const response = await querySrv(url, {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            });
            var logo = await response.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(logo).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    '',
                ),
            );
            return base64;
        } catch (error) {
            console.error(error);
        }
    }

    /**
* Get user settings stored in ES
* @param {string}  attribute to retrieve
* @return {response} json response from ES
* */
    async getUserSetting(attribute) {
        var url = BASE_NAME + "api/setting/user";
        try {
            const response = await querySrv(url, {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                },
                body: JSON.stringify({
                    "attribute": attribute
                })
            });
            return await response.json();
        } catch (error) {
            console.error(error);
        }
    }


    /**
* hostnames, realms list to set colors, tags list
* @return {} stores in state
* */
    async getHostnames() {
        const request = async () => {
            try {
                const response = await querySrv(BASE_NAME + "api/hostnames", {
                    method: "GET",
                    timeout: 10000,
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": "include"
                    }
                });

                const json = await response.json();
                if (!response.ok) {
                    return;
                }
                var hostnames = [];
                var hostnamesColor = [];
                if (json.responses && json.responses[0] && json.responses[0].aggregations && json.responses[0].aggregations.distinct && json.responses[0].aggregations.distinct.buckets) {
                    hostnames = json.responses[0].aggregations.distinct.buckets;
                    var colors = ['#58a959', '#61BEE2', '#f58231', '#00008B', '#c41d03', '#2077e8', '#41FA51', '#d66bad', '#ffe119', '#e6beff', '#ccc8a0', '#aa59e0', '#99e5af', '#d18e1a', '#465D00'];
                    for (var i = 0; i <= hostnames.length; i++) {
                        if (hostnames[i]) {
                            hostnamesColor[hostnames[i].key] = colors[i % 14];
                        }
                    }
                }

                if (json.responses && json.responses[1] && json.responses[1].aggregations && json.responses[1].aggregations.distinct && json.responses[1].aggregations.distinct.buckets) {
                    var realms = json.responses[1].aggregations.distinct.buckets;
                    for (i = 0; i <= realms.length; i++) {
                        if (realms[i]) {
                            hostnamesColor[realms[i].key] = colors[i % 14];
                        }
                    }
                }

                //get src realms
                if (json.responses && json.responses[2] && json.responses[2].aggregations && json.responses[2].aggregations.distinct && json.responses[2].aggregations.distinct.buckets) {
                    this.setState({
                        srcRealms: json.responses[2].aggregations.distinct.buckets
                    });
                }

                //get dst realms
                if (json.responses && json.responses[3] && json.responses[3].aggregations && json.responses[3].aggregations.distinct && json.responses[3].aggregations.distinct.buckets) {
                    this.setState({
                        dstRealms: json.responses[3].aggregations.distinct.buckets
                    });
                }
                //get tags
                if (json.responses && json.responses[4] && json.responses[4].aggregations && json.responses[4].aggregations.distinct && json.responses[4].aggregations.distinct.buckets) {

                    //if tags is array split it
                    var tags = [];
                    for (i = 0; i < json.responses[4].aggregations.distinct.buckets.length; i++) {
                        if (Array.isArray(json.responses[4].aggregations.distinct.buckets[i].key)) {
                            tags.push(json.responses[4].aggregations.distinct.buckets[i].key.slice());
                        } else {
                            tags.push(json.responses[4].aggregations.distinct.buckets[i].key);
                        }

                    }
                    this.setState({
                        tags: tags,
                        tagsFull: json.responses[4].aggregations.distinct.buckets
                    });
                }

                this.setState({
                    hostnames: hostnamesColor
                });
            }
            catch (er) {
                window.notification.showError({ errno: 6, text: er, level: "error" });
            }
        }
        request();
    }

    //change charts width if windows width changes
    windowResize() {
        if (window.innerWidth !== store.getState().persistent.width) store.dispatch(setChartsWidth(window.innerWidth));
    }

    /**
* get sip user level, based on that show dashboards and monitor layout
* @return {} stores in state
* */
    async getSipUser() {
        var response = "";
        try {
            var sip;
            response = await querySrv(BASE_NAME + "api/user/sip", {
                credentials: "include",
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                "Access-Control-Allow-Credentials": "include"
            });
            if (!response.ok) {
                window.notification.showError({ errno: 6, text: "Monitor server is not running.", level: "error" });
            }
            else {
                sip = await response.json();
                console.info("USER login:");
                console.info(sip);

                if (sip.redirect && !window.location.pathname.includes("no-sip-identity")) {
                    console.info("redirect to no-sip-identity");
                    window.location.href = "/no-sip-identity?err=" + sip.redirect;
                    return;
                }
                else if (!window.location.pathname.includes("no-sip-identity")) {
                    if (sip.aws === false) {
                        this.setState({
                            aws: false
                        })
                    } else {
                        this.setState({
                            aws: true
                        })
                    }

                    console.info("MOKI: sip user: " + sip.user);

                    //get username
                    sip.username = await getUsername();

                    //set user info :  email:email, domainID:domainID, jwt: jwtbit
                    store.dispatch(setUser(sip));
                    this.setState({
                        user: sip
                    })

                    //set admin
                    if (sip.jwt === 0) {
                        this.setState({
                            admin: true
                        })
                    }

                    if (sip.jwt === 1 || sip.user === "DEFAULT") {
                        this.setState({
                            siteAdmin: true
                        })
                    }

                    //default user: no need to log in for web
                    if (sip.user !== "USER" && sip.user !== "DEFAULT") {
                        this.getHostnames();
                    }

                    //default user: no need to log in for web
                    if (sip.user !== "DEFAULT") {
                        this.getMonitorSettings();
                    }
                    else {
                        //store layout
                        var jsonData = await getLayoutSettings();
                        store.dispatch(setLayout(jsonData));
                        this.setState({
                            dashboards: ["web"],
                            isLoading: false
                        });
                    }
                }
            }
        } catch (error) {
            if (response.status === 500) {
                window.notification.showError({ errno: 6, text: "Monitor server is not running.", level: "error" });

            } else {
                console.error(error);
                window.notification.showError({ errno: 2, text: "Check elasticsearch connection and restart the page.", level: "error" });
            }
        }
    }

    redirect() {
        if (this.state.redirect === "false") {
            this.setState({
                redirect: "true"
            })
        } else {
            this.setState({
                redirect: "false"
            })
        }
    }



    /**
* render layout based on user level
* */
    render() {
        var dashboards = this.state.dashboards;


        //loading screen span
        var loadingScreen = <span>
            <Notificationbar className="errorBarLoading"></Notificationbar>
            <div style={{ "marginTop": (window.innerHeight / 2) - 50 }} className=" align-items-center justify-content-center">
                {!this.state.logo && <div style={{ "marginLeft": "42%", "marginBottom": "15px", "fontSize": "2.75rem", "color": "gray" }}>MONITOR</div>}
                <div className="loaderr">
                    <div className="bar"></div>
                </div>
                {this.state.logo && <div><img src={this.state.logo} alt="logo" style={{ "marginLeft": "40%", "width": "300px" }} /></div>}
            </div>
        </span>

        //get userto display
        var sipUserSwitch;
        const aws = this.state.aws;
        var url = window.location.pathname;
        var styleAws = { "paddingLeft": "7px", "paddingBottom": "5px" };

        if (store.getState().persistent.user) {
            var style = store.getState().persistent.user.aws === false ? { "paddingBottom": "0px", "paddingLeft": "7px" } : styleAws;
        }
        //show just diagram
        if (this.state.dashboards.length > 0) {
            if ((aws === false || this.state.admin || this.state.siteAdmin) && url.includes("sequenceDiagram")) {
                sipUserSwitch = <div className="row"
                    id="body-row">
                    <Routes>
                        <Route path='/sequenceDiagram/:id' render={() => < Sequence />} />
                        <Route path='/sequenceDiagram/' render={() => < Sequence />} />
                    </Routes>
                </div>

                //ADMIN ROLE: show everything
            } else if (aws === false || this.state.admin || this.state.siteAdmin) {
                console.info("Router: admin mode");
                var dashboardAlter = [...this.state.dashboards];
                if (this.state.aws) {
                    dashboardAlter.push("profiles");
                    dashboardAlter.push("connectivityIP");
                }

                var styleUser = { "display": "inline", "paddingTop": "7px", "position": "absolute" };
                if (store.getState().persistent.user && store.getState().persistent.user.jwt === 0) {
                    styleUser = { "display": "inline" };
                }

                //admin context
                sipUserSwitch = <div className="row" id="body-row" >
                    <NavBar redirect={this.redirect} toggle={this.toggle} aws={this.state.aws} dashboardsUser={this.state.dashboardsUser} dashboards={this.state.dashboards} dashboardsSettings={this.state.dashboardsSettings} />
                    <div className="row justify-content-between header" style={{ "marginRight": 0, "marginLeft": 0 }} >
                        <span id="user" className="top" style={style}>
                            {aws === true && <DecryptPasswordPopup />}
                            <div style={styleUser}>{this.state.user.account}</div>
                            {aws === true && (!this.state.admin && !this.state.siteAdmin) && <a href="/logout" > Log out </a>}
                        </span>
                        <TimerangeBar />
                    </div>

                    <div id="context" className={"margin250"}>
                        <Notificationbar className="errorBar"></Notificationbar>
                        <div className="row">
                            <Routes>
                                {paths(dashboardAlter, this.state.tags, this.state.hostnames, this.state.dstRealms, this.state.srcRealms)}
                                {paths(this.state.dashboardsSettings, this.state.tags, this.state.hostnames, this.state.dstRealms, this.state.srcRealms)}
                                {paths(this.state.dashboardsUser, this.state.tags, this.state.hostnames, this.state.dstRealms, this.state.srcRealms)}
                                {aws && <Route path="/logout" />}
                                {aws && <Route path="/passwdd" />}
                                <Route path="*" element={<Navigate to={dashboards.includes("home") ? "/home" : "/" + dashboards[0]} />} />
                            </Routes>
                        </div>
                        <span className="footer" style={{ "float": "right" }}>
                            <div>{this.state.monitorName}</div>
                            <img src={this.state.logo} alt="logo" id="footerlogo" />
                        </span>
                    </div>
                </div>;
            }
            //END USER ROLE: show one limited dashboard
            else {
                console.info("Router: end user mode");
                //end user context
                sipUserSwitch = <div className="row"
                    id="body-row">
                    <div className="col" >
                        <div className="d-flex justify-content-between header" >
                            <span id="user" className="top">
                                {aws === true && <DecryptPasswordPopup />}
                                {this.state.user.account}
                                {aws === true && !this.state.admin && <a href="/logout"> Log out </a>}</span>
                            <TimerangeBar />
                        </div>
                        <FilterBar redirect={this.state.redirect} />
                        <Notificationbar className="errorBarLoading" ></Notificationbar>
                        <div>
                            <Routes>
                                <Route exact path='/index' element={<Restricted name="restricted" tags={this.state.tags} />} />
                                <Route exact path='/' element={<Restricted name="restricted" />} />
                                <Route path='/logout' />
                                <Route path='/no-sip-identity/' />
                                <Route path='/sequenceDiagram/:id' element={<Sequence />} />
                                <Route path='/sequenceDiagram/' element={<Sequence />} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                            <span className="footer" style={{ "float": "right" }}>
                                <div>{this.state.monitorName}</div>
                                <img src={this.state.logo} alt="logo" id="footerlogo" />
                            </span>
                        </div>
                    </div>
                </div>;
            }
        }
        return (
            <span>
                <span id="decryptpopupplaceholder"></span>
                <Popup></Popup>

                {this.state.firstTimeLogin ? <FirstLoginPopup setFirstTimeLogin={this.setFirstTimeLogin} /> :
                    (this.state.isLoading) ? loadingScreen :
                        <BrowserRouter basename={BASE_NAME}>
                            <div className="container-fluid" style={{ "backgroundColor": "white" }}> {sipUserSwitch}
                            </div>
                        </BrowserRouter>
                }
            </span>
        );
    }
}

export default App;

