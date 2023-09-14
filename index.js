import * as dotenv from 'dotenv';
dotenv.config();

// Web Api
import fetch from 'node-fetch';

// File Download
import fs from 'fs';
import http from 'http';

// Date Format
const DATE = formatDate(new Date()); // YY-mm-dd_HH-MM-SS 

// Start Export
(async () => {
    const collectionUrl = process.env.COLLECTION == "all" ? "/api/collections.export_all" : "/api/collections.export";
    const getExport = await fetch(process.env.OUTLINE_URL + collectionUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": 'Bearer ' + process.env.OUTLINE_KEY
        },
        body: JSON.stringify({
            "format": process.env.FORMAT,
            "id": process.env.COLLECTION
        })
    });

    if(getExport.status == 400) {
        console.log("Bad Request, did you specify the correct .env.COLLECTION? " + process.env.COLLECTION);
        return
    }
    const exported = (await getExport.json()).data;

    console.log("Starting Export...");
    await awaitExport(exported.fileOperation.id);

    const getDownloadUrl = await fetch(process.env.OUTLINE_URL + "/api/fileOperations.redirect", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": 'Bearer ' + process.env.OUTLINE_KEY
        },
        body: JSON.stringify({ id: exported.fileOperation.id })
    });
    console.log("Export Done");

    // Download File
    console.log("Starting Download...");
    const file = fs.createWriteStream(`./backups/outline-${DATE}_${process.env.FORMAT}.zip`);
    http.get(getDownloadUrl.url, function(response) {
        response.pipe(file);

        // after download completed close filestream
        file.on("finish", async () => {
            file.close();
            console.log("Download Completed");

            console.log("Cleaning up...");
            // Delete Export
            if (process.env.DELETE_EXPORT_AFTER_DOWNLOAD) {
                await fetch(process.env.OUTLINE_URL + "/api/fileOperations.delete", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: 'Bearer ' + process.env.OUTLINE_KEY
                    },
                    body: JSON.stringify({ id: exported.fileOperation.id })
                });
                console.log("Deleted Remote");
            }
            console.log("Done (:");
        });
    });
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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function formatDate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');      // "+ 1" becouse the 1st month is 0
    var day = String(date.getDate()).padStart(2, '0');
    var hour = String(date.getHours()).padStart(2, '0');
    var minutes = String(date.getMinutes()).padStart(2, '0');
    var secconds = String(date.getSeconds()).padStart(2, '0');

    return year + "-" + month + '-' + day + '_'+ hour+ '-'+ minutes+ '-'+ secconds;
}