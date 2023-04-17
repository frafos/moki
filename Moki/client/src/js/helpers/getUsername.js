import querySrv from './querySrv';

//get username from server, store in redux and also return it

import storePersistent from "../store/indexPersistent";
import { setUser } from "../actions/index";
const BASE_URL = import.meta.env.BASE_URL;

export async function getUsername() {
    var url = BASE_URL + "api/user/username";
    try {
        const response = await querySrv(url, {
            method: "GET",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": "include"
            }
        });
        let username = await response.json();
        if (storePersistent.getState().user) {
            let user = storePersistent.getState().user;
            user.username = username.username;
            storePersistent.dispatch(setUser(user));
        }
        return username.username;
    } catch (error) {
        console.error(error);
        return error;
    }
}