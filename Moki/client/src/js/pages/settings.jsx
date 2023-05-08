import React, {
    Component
} from 'react';
import querySrv from '../helpers/querySrv';

class Settings extends Component {
    constructor(props) {
        super(props);
        this.load = this.load.bind(this);
        this.save = this.save.bind(this);
        this.state = {
            data: [],
            checkboxIPall: true,
            checkboxURIall: true,
            checkboxALERTall: true
        }
    }

    componentWillMount() {
        this.load();
    }

    /*
       Load data
       */
    async load() {

        var Url = "/transformer/logstash/thresholds";
        var jsonData;
        try {
            const response = await querySrv(Url, {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            });
            jsonData = await response.json();
            this.setState({
                data: jsonData
            });

             //set state of checkboxes
            for(var i =0; i < jsonData.length; i++){

                    var name = jsonData[i].name+"checkbox";
                     this.setState({
                        [name]: jsonData[i].value === "-1" ? false :  true
                     });
            }
            console.info("Got logstash settings data "+JSON.stringify(jsonData));
        } catch (error) {
            console.error(error);
            alert("Problem with receiving data. " + error);
        }

    }




    //save data
    async save() {
        var jsonData = this.state.data;
        var Url = "/transformer/logstash/thresholds";
        for (var i = 0; i < jsonData.length; i++) {


                var data = document.getElementById(jsonData[i].id);
            //disable
           var checkbox = document.getElementById(jsonData[i].name+"checkbox");
            if (checkbox && !checkbox.checked) {
                jsonData[i].value = -1;
            }
            else {
                jsonData[i].value = data.value;
            }

        }
console.log(jsonData);

        try {
            const response = await querySrv(Url, {
                method: "POST",
                body: JSON.stringify(jsonData),
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            });
            //const response = await querySrv("/api/getCallData");
            data = await response.json();
            alert("Data has been saved.");
        } catch (error) {
            console.error(error);
            //alert("Problem with saving data. " + error.responseText.message);
        }


    }



    //uncheck or check all types
    checkAll(type){
        var checkboxes = document.getElementsByClassName(type);
        var isChecked = document.getElementById("checkbox"+type+"all").checked;
        for(var j =0; j < checkboxes.length; j++){
            var name = checkboxes[j].id;
            this.setState({[name] : isChecked});

        }

    }



generate(dataAlarm){
    var alarms = [];
    var data = dataAlarm;
    if(data.length !== 0){
        var children = [];
    // Outer loop to create parent
    for(var i =0; i < data.length; i++) {
        var nextName = data[i+1] ? data[i+1].name : "";

      //Inner loop to create children
       if(data[i].name === nextName){
        children.push(<div className="row tab" key={data[i].id+"key"}><span className="col-8">{data[i].label}</span><input className="col" type={data[i].type} defaultValue={data[i].value} id={data[i].id} /></div>);
      }
    else{
        //Create the parent and add the children
        children.push(<div key={data[i].id+"key"} className="row tab"><div className="col-8">{data[i].label}</div><input className="col"  type={data[i].type} defaultValue={data[i].value}  id={data[i].id} /></div>);

        alarms.push(<div key={data[i].id+"key"} className="tab"><span className="form-inline"><input className={data[i].category} type="checkbox" id={data[i].name+"checkbox"} defaultChecked={this.state[data[i].name+"checkbox"]}/> <h3>{data[i].name}</h3></span>{children}</div>);
        children = [];
    }

    }
    return alarms
    }
    }

    generateGeneralData(dataAlarm){
    var data = dataAlarm;
    var alarms =[];
    if(data.length !== 0){
    // Outer loop to create parent
    for(var i =0; i < data.length; i++) {
        if(data[i].id === "exclude URIs" ){
            alarms.push(<div  key={data[i].id+"key"} className="tab "><span className="form-inline row justify-content-start"><p className="col-6">{data[i].label}</p><input placeholder="e.g. xxxxxxx, yyyyyy" className="col text-left" type={data[i].type === "boolean" ? "checkbox" : data[i].type } defaultValue={data[i].value}  id={data[i].id} /> </span></div>);

           }
        else if(data[i].id === "exclude IPs" ){
            alarms.push(<div  key={data[i].id+"key"} className="tab "><span className="form-inline row justify-content-start"><p className="col-6">{data[i].label}</p><input placeholder="e.g. xxx.xxx.xxx.xxx, yyy.yyy.yyy.yyy" className="col text-left" type={data[i].type === "boolean" ? "checkbox" : data[i].type } defaultValue={data[i].value}  id={data[i].id} /> </span></div>);

           }
       else {
        alarms.push(<div  key={data[i].id+"key"} className="tab "><span className="form-inline row justify-content-start"><p className="col-6">{data[i].label}</p><input className="col text-left" type={data[i].type === "boolean" ? "checkbox" : data[i].type } defaultValue={data[i].value}  id={data[i].id} /> </span></div>);
       }
    }
    }
    return alarms
    }


    render() {

        var data = this.state.data;
        var IPtype = [];
        var URItype = [];
        var Alerttype = [];
        var Generaltype = [];

        //separate type
        for(var i =0; i< data.length; i++){
            if(data[i].category === "KEY"){
                Alerttype.push(data[i]);
            }
            else if(data[i].category === "URI"){
               URItype.push(data[i]);
            }
            else if(data[i].category === "IP"){
                IPtype.push(data[i]);
            }
            else {
                Generaltype.push(data[i]);
            }
        }

       var Generaldata = this.generateGeneralData(Generaltype);
        var URIdata = this.generate(URItype);
        var IPdata = this.generate(IPtype);
        var Alertdata = this.generate(Alerttype);

        return ( <div className = "container" >
                <h2>SETTINGS </h2>
                    <hr/>
                        { Generaldata}
                    <hr/>
                     <span className="form-inline"><input  type="checkbox" id="checkboxURIall" defaultChecked={this.state.checkboxURIall}   onClick={() => this.checkAll("URI")} /> <h3> URI TYPE ALARMS</h3></span>
                    <div key="URI" className="top"> { URIdata} </div>
                    <span className="form-inline"><input  type="checkbox" id="checkboxIPall"  defaultChecked={this.state.checkboxIPall}  onClick={() => this.checkAll("IP")} /><h3>IP TYPE ALARMS</h3></span>
                    <div key="IP" className="top"> { IPdata} </div>

                <span className="form-inline"><input  type="checkbox" id="checkboxKEYall"  defaultChecked={this.state.checkboxALERTall}  onClick={() => this.checkAll("KEY")} /><h3>  ALERT TYPE ALARMS</h3></span>
                    <div key="Alert" className="top"> { Alertdata} </div>

                    <button type="button" className="btn btn-primary rightButton" onClick={this.save} >Save</button>
                </div>
        )
    }

}

export default Settings;
