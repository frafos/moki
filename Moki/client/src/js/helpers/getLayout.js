import querySrv from './querySrv';
const BASE_URL = import.meta.env.BASE_URL;

//get monitor layout form monitor-layout.json

export async function getLayoutSettings() {
    var url = BASE_URL+"api/layout";
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