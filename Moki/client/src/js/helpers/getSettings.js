import querySrv from './querySrv';
const BASE_URL = import.meta.env.BASE_URL;

//get monitor settings from defaults.json or stored user values

export async function getSettings() {
    var url = BASE_URL + "api/setting";
    try {
        const response = await querySrv(url, {
            method: "GET",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": "include"
            }
        });
        return await response.json();
    } catch (error) {
        console.error(error);
        return error;
    }
}