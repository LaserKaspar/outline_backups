// Config
import * as dotenv from 'dotenv';
dotenv.config();

// Web APIs
import { URL } from 'url';
import http from 'http';
import https from 'https';
import fetch from 'node-fetch';

// File Download
import fs from 'fs';
import { finished } from 'stream/promises';

// Date Format
const DATE = formatDate(new Date()); // YY-mm-dd_HH-MM-SS 

function getAgentForUrl(urlString) {
    const url = new URL(urlString);

    if (url.protocol === 'https:') {
        return new https.Agent({ rejectUnauthorized: !process.env.ALLOW_UNSAFE });
    } else if (url.protocol === 'http:') {
        return new http.Agent();
    } else {
        throw new Error(`Unsupported protocol: ${url.protocol}`);
    }
}

// Start Export
(async () => {
    const collectionUrl = process.env.COLLECTION == "all" ? "/api/collections.export_all" : "/api/collections.export";
    
    console.log("Starting Export...");
    const getExport = await fetch(process.env.OUTLINE_URL + collectionUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": 'Bearer ' + process.env.OUTLINE_KEY
        },
        body: JSON.stringify({
            "format": process.env.FORMAT,
            "id": process.env.COLLECTION
        }),
        agent: getAgentForUrl,
    });

    if(getExport.status != 200) {
        switch (getExport.status) {
            case 400:
                console.log("Bad Request, did you specify the correct .env.COLLECTION? " + process.env.COLLECTION);
                break;
            default:
                console.log("Unhandeled Request: " + getExport.status, await getExport.text());
                break;
        }
        return
    }
    const exported = (await getExport.json()).data;

    console.log("Waiting for Export to finish...");
    await awaitExport(exported.fileOperation.id);

    const getDownloadUrl = await fetch(process.env.OUTLINE_URL + "/api/fileOperations.redirect", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": 'Bearer ' + process.env.OUTLINE_KEY
        },
        body: JSON.stringify({ id: exported.fileOperation.id }),
        agent: getAgentForUrl,
    });
    console.log("Export Done");

    // Download File
    console.log("Starting Download...");
    const url = getDownloadUrl.url;
    const agent = getAgentForUrl(url);

    const res = await fetch(url, { agent });
    if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);

    const fileStream = fs.createWriteStream(`./backups/outline-${DATE}_${process.env.FORMAT}.zip`);
    await finished(res.body.pipe(fileStream));

    console.log("Download Completed");

    if (process.env.DELETE_EXPORT_AFTER_DOWNLOAD) {
        console.log("Cleaning up...");

        const deleteRes = await fetch(process.env.OUTLINE_URL + "/api/fileOperations.delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: 'Bearer ' + process.env.OUTLINE_KEY
            },
            body: JSON.stringify({ id: exported.fileOperation.id }),
            agent: getAgentForUrl(process.env.OUTLINE_URL),
        });

        if (!deleteRes.ok) {
            const errText = await deleteRes.text();
            console.warn(`Failed to delete export: ${deleteRes.status} - ${errText}`);
        } else {
            console.log("Deleted Remote");
        }
    }

    console.log("Done (:");
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
                body: JSON.stringify({ id: fileOperationId }),
                agent: getAgentForUrl,
            });
        
            const downloaded = await getDownload.json();

            if(downloaded.data.state == "complete") {
                resolve(downloaded)
                break;
            }
            if(downloaded.data.state == "error") {
                reject(downloaded)
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