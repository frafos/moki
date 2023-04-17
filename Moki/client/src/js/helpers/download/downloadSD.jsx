import querySrv from '../querySrv';

export async function downloadSD(pathname) {
    if(! Array.isArray(pathname)){
        pathname = [pathname];
    }
    try {
        const response = await querySrv("api/diagram/download", {
            method: "POST",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": "include"
            },
            body: JSON.stringify({
                url: pathname
            })
        });
        var sd = await response.text();
        return sd;
    } catch (error) {
        console.error(error);
        alert("Problem with receiving alarms data. " + error);
    }
}
