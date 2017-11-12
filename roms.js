// MAME ROM downloader

const process = require('process');
const fs = require('fs');
const readline = require('readline');
const Crawler = require('crawler');
const slugify = require('slugify');
const request = require('request');

require('colors'); // ;-)

// require('async');

const UA_STRINGS = [
    // Android Devices
    "Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Mobile Safari/537.36",
    // iO$ Devices
    "Mozilla/5.0 (iPhone; U; CPU like Mac OS X; en) AppleWebKit/420+ (KHTML, like Gecko) Version/3.0 Mobile/1A543a Safari/419.3",
    "Mozilla/5.0 (iPad; CPU OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.",
    // Window$ Devices
    "Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)",
    // Desktop
    "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:33.0) Gecko/20120101 Firefox/33.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0",
    "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0; WOW64; Trident/4.0; SLCC1)",
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; WOW64; Trident/4.0; SLCC1)",
    "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; WOW64; Trident/4.0; SLCC1)",
    "Mozilla/5.0 (MSIE 9.0; Windows NT 6.1; Trident/5.0)",
    "Mozilla/5.0 (MSIE 10.0; Windows NT 6.1; Trident/5.0)"
];

let query = process.argv[2] || '';
let arcade = process.argv[3] || null;
let letter = '';
let rquery;

// Relative to $HOME directory
let ROMS_DIR = '/roms/';

// Base64-encoded site name :P
const URL = new Buffer('aHR0cDovL3d3dy5jb29scm9tLmNvbS9yb21zLw==', 'base64').toString('ascii');
const DOWNLOAD_URL = new Buffer('aHR0cDovL3d3dy5jb29scm9tLmNvbS9kbHBvcC5waHA/aWQ9', 'base64').toString('ascii');

async function machineList() {
    let reList = new RegExp(/(menu2\[)(.*)/gi);
    return new Promise((resolve, reject) => {
        request.get(URL, (error, request, body) => {
            if (error) {
                reject(error);
            }
            resolve(body.match(reList));
        });
    });

}

if (!arcade) {
    let re = new RegExp(/menu[0-9]+(\[)[0-9]{1,2}(\])='(.*)<a\s+(href=")|(">[0-9a-zA-Z\s]+)(.*)(<\/a>')/gi);

    let systems = [];
    let resultado = machineList().then((list) => {

        console.log('ŚÉĹÉĆṬ ŚÝŚṬËḾ:');

        list.forEach((item, i) => {
            systems.push(item.replace(re, ''));
            console.log((i < 10 ? ' ' + (i) : i) + ' ' + item.replace(re, '').replace(/\/|roms/g, '').bold + ' (' + item.replace(re, '') + ')');
        });

        const rl1 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl1.question('ŚÝŚṬÉḾ: ', (answer) => {

            arcade = systems[answer].replace(/^\/roms\//, '');

            rl1.close();
            const rl2 = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl2.question('ŚÉÁŔĆĤ ṬÉŔḾ: ', (answer) => {
                query = answer;

                rquery = new RegExp(query.toLowerCase(), 'gi');
                letter = query[0].toLowerCase() + '/';

                console.log(URL + arcade + letter);
                rl2.close();
                crawlThis();
            })
        });

    }).catch((reason) => {
        reject(reason);
    });

}

function crawlThis() {
    let c = new Crawler({
        rateLimit: Math.floor(Math.random() * 1000),
        maxConnections: 1,
        rotateUA: UA_STRINGS,
        callback: function (error, res, done) {
            if (error) {
                console.log(error);
                process.exit(1);
            } else {
                let $ = res.$;
                let lista = $('div a').toArray();

                console.log('Búśćáńdó ' + query + ' éń: ' + $('title').text());

                if (lista.length > 0) {
                    let downloadList = [];

                    let i = 1;
                    lista.forEach((element, index) => {
                        if (element.attribs.href && element.children[0] && element.children[0].data) {
                            if (rquery && (element.children[0].data.match(rquery) || element.attribs.href.match(rquery))) {
                                console.log((i < 10 ? ' ' + (i) : i) + ' ' + element.children[0].data + ' * ' + '(' + element.attribs.href + ')');
                                downloadList.push({
                                    name: element.children[0].data,
                                    file: element.attribs.href
                                });
                                i++;
                            }
                        }
                    });

                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });

                    rl.question('ŔÓḾ #: ', (answer) => {

                        let romId = Number(answer) > -1 && answer <= downloadList.length ? downloadList[answer - 1].file.match(/\/[0-9]+\//)[0] : null;

                        if (!romId) {
                            console.log('Íńṿáĺíd óṕṭíöṇ!!1');
                            process.exit(1);
                        } else {
                            console.log(`Döẃńĺóädîṇǵ "${downloadList[answer - 1].name}"`);

                            let d = new Crawler({
                                rateLimit: Math.floor(Math.random() * 100),
                                maxConnections: 1,
                                rotateUA: UA_STRINGS,
                                referer: DOWNLOAD_URL + romId.replace(/\//g, ''),
                                callback: function (error, res, done) {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        let $ = res.$;
                                        let scripts = $('script').toArray();
                                        let downloadFile, fileName = '';
                                        console.log(DOWNLOAD_URL + romId.replace(/\//g, '') + ' éń: ' + $('title').text());

                                        scripts.forEach((script, index) => {
                                            if (script.children && script.children[0] && script.children[0].data) {
                                                if (index === 0) {
                                                    downloadFile = script.children[0].data.match(/action=\"(.*)\/\"/ig)[0];
                                                    fileName = slugify(downloadList[answer - 1].name) + '.zip';
                                                }
                                            }
                                        });

                                        if (downloadFile && downloadFile !== '') {

                                            downloadFile = downloadFile.replace(/action=\"|\"/g, '');

                                            var d2 = new Crawler({
                                                encoding: null,
                                                jQuery: false, // set false to suppress warning message.
                                                referer: DOWNLOAD_URL + romId.replace(/\//g, ''),
                                                callback: (err, res, done) => {
                                                    if (err) {
                                                        console.error(err.stack);
                                                    } else {
                                                        fs.createWriteStream(res.options.filename).write(res.body);
                                                    }
                                                    done();
                                                }
                                            });

                                            d2.queue({
                                                uri: downloadFile,
                                                filename: process.env.HOME + ROMS_DIR + arcade + fileName
                                            });
                                        }
                                    }
                                    done();
                                }
                            });
                            d.queue(DOWNLOAD_URL + romId.replace(/\//g, ''));
                        }
                        rl.close();
                    });

                } else {
                    console.log('Śíń ŕéśúĺtádóś');
                }
            }
            done();
        }
    });

    c.queue(URL + arcade + letter);
}