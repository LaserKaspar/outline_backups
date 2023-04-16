import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

(async () => {
    const response = await fetch(process.env.OUTLINE_URL + "/api/auth.info", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: 'Bearer ' + process.env.OUTLINE_KEY
        }
    })

    console.log(response);
    const body = await response.json();
    const document = body.data;
    console.log(document);
})();
