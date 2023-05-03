import querySrv from './querySrv';

//get username from server, store in redux and also return it

import store from "@/js/store";
import { setUser } from "@/js/slices";

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
        if (store.getState().persistent.user) {
            let user = store.getState().persistent.user;
            store.dispatch(setUser({ ...user, username: username.username }));
        }
        return username.username;
    } catch (error) {
        console.error(error);
        return error;
    }
}