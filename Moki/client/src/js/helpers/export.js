/*
Input: JSON to export  
*/
import store from "@/js/store";

export async function exportJSON(result) {
    const element = document.createElement("a");

    const { profile } = store.getState().persistent;
    if (profile && profile[0] && profile[0].userprefs.mode === "encrypt") {
        element.download = "data_decryted.json"
    } else {
        element.download = "data.json";
    }

    const file = new Blob([JSON.stringify(result)], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
}