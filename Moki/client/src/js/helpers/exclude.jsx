import querySrv from './querySrv';

/*
create new exclude alarm function
get html tag with value = comment, id = alarm id
*/

export async function exclude(i){
    var comment = document.getElementById("input" + i.id).value;
    if (comment && comment !== "") {
        //fetch old exclude data
        try {
            const response = await querySrv("api/setting", {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            });
            var jsonData = await response.json();
            var result = [];
            jsonData.forEach(data => {
                if (data.app === "m_alarms") {
                    result = data.attrs;
                }
            });
            var value = "";
        } catch (error) {
            console.error(error);
            alert("Problem with receiving alarms data. " + error);
        }
        var exceeded = i.exceeded + "_exclude";
        if (i["exceeded-by"] === "URI") {
            value = i.attrs.from;
        }
        else if (i["exceeded-by"] === "IP") {
            value = i.attrs.source;
        }
        else if (i["exceeded-by"] === "CA") {
            value = i.attrs.dst_ca_id;
        }
        //if more alarms were triggered
        if (Array.isArray(i["exceeded-by"])) {
            for (var k = 0; k < i["exceeded-by"].length; k++) {
                exceeded = i["exceeded"][k] + "_exclude";
                if (i["exceeded-by"][k] === "source") {
                    value = i.attrs.source;
                }
                else {
                    value = i.attrs.from;
                }
                for (var j = 0; j < result.length; j++) {
                    if (result[j].attribute === exceeded) {
                        //if ip/uri not already exists
                        if (!result[j].value.includes(value)) {
                            result[j].value.push(value);
                        }
                        result[j].comments.push(comment);
                    }
                }
            }
        }
        else {
            for (j = 0; j < result.length; j++) {
                if (result[j].attribute === exceeded) {
                    //if ip/uri not already exists
                    if (!result[j].value.includes(value)) {
                        result[j].value.push(value);
                    }
                    if(!result[j].comments){
                        result[j].comments = [];
                    }
                    result[j].comments.push(comment);
                }
            }
        }
        if (value !== "") {
            await querySrv("api/save", {
                method: "POST",
                body: JSON.stringify({
                    "app": "m_alarms",
                    "attrs": result

                }),
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": "include"
                }
            }).then(function (response) {
                if (!response.ok) {
                    console.error(response.statusText);
                    return false;
                }
                return response.json();

            }).then(function (responseData) {
                if (responseData === false || responseData.msg.includes("error")) {
                    alert(responseData.msg);
                    return false;
                }
                // alert(responseData.msg);
                return true;
            }).catch(function (error) {
                console.error(error);
                alert("Problem with saving data. " + error);
                return false;
            });

            document.getElementById("input" + i.id).value = "";
            document.getElementById("popupExclude" + i.id).style.display = "none";
            document.getElementById("spanExclude" + i.id).style.display = "none";
        }
    }
    else {
        alert("Write a comment why you want to exclude this URI/IP.");
    }
}

