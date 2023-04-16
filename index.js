import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    const getExport = await fetch(process.env.OUTLINE_URL + "/api/collections.export_all", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: 'Bearer ' + process.env.OUTLINE_KEY
        },
        body: JSON.stringify({ })
    });

    const exported = (await getExport.json()).data;

    await awaitExport(exported.fileOperation.id);

    const getDownloadUrl = await fetch(process.env.OUTLINE_URL + "/api/fileOperations.redirect", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: 'Bearer ' + process.env.OUTLINE_KEY
        },
        body: JSON.stringify({ id: exported.fileOperation.id })
    });

    console.log(getDownloadUrl.url);
})();

async function awaitExport(fileOperationId) {
    return new Promise(async (resolve, reject) => {
        while(true) {
            await delay(5000);
            const getDownload = await fetch(process.env.OUTLINE_URL + "/api/fileOperations.info", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: 'Bearer ' + process.env.OUTLINE_KEY
                },
                body: JSON.stringify({ id: fileOperationId })
            });
        
            const downloaded = await getDownload.json();
    
            if(downloaded.data.state != "creating") {
                resolve(downloaded)
                break;
            }
        }
    });
}
