import querySrv from './querySrv';

export async function elasticsearchConnection(url, params) {
            var data;
            var response;
            try{
               response = await querySrv(url, {
                        method: "POST",
                        timeout: 1000,
                        credentials: 'include',
                        body: JSON.stringify(params),
                       headers: {"Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": "include"}
                    });
                }
                catch (error) {
                    console.error(error);
                    return "ERROR: "+error;
                }

                if (!response.ok) {
                   // response
                    console.error(response);
                    return "ERROR: Problem with saving.";
                  }

                data = response.json();
                console.info(new Date() + "MOKI: got elastic data");
                return data;
}

