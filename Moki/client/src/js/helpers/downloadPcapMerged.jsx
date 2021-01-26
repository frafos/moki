export async function downloadPcapMerged(pathname) {
    var response;
    console.info("Downloading pcap " + pathname);
    try {
        response = await fetch("/api/download/merged", {
            method: "POST",
            timeout: 10000,
            credentials: 'include',
            body: JSON.stringify({
                url: pathname
            }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": "include"
            }
        })
    } catch (error) {
        return "ERROR: " + error;
    }

    if (!response.ok) {
        // response
        return "ERROR: File not found. You can extend storage in settings page.";
    }
    
    if(response.status !== 200){
        return "ERROR: Problem with getting file.";
    }
    return await response.blob();
}
