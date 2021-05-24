const nodemailer = require('nodemailer');
const request = require('request');

const conf = require('./conf.json');

console.log(new Date(), 'info', 'Monitor Started');
let currentTime = new Date().getTime();

//Sender's email addreee
const fromAddress = conf.fromAddress;
//Sender's email authorization code
const authorization = conf.authorization;
//SMTP host
const SMTPHost = conf.SMTPHost;
//SMTP port
const SMTPPort = conf.SMTPPort;
//Recipient's email address
const toAddress = conf.toAddress;
//Blockchain rpc url
const rpc = conf.rpc;
//Monitoring interval, unit: second
const interval = conf.interval;

const clientId = conf.clientId;
const clientSecret = conf.clientSecret;
let refreshToken = conf.refreshToken;
let accessToken = conf.accessToken;
// hashrate critical point, unit: H/s
let criticalPoint = conf.criticalPoint;
// hashrate risky level
let riskyLevel = conf.riskyLevel;

let id = 0;
let currentHeight = 0;
let lastHeight = 0;
let currentHashrate = 0;
let lastHashrate = 0;
const sendEmail = (type) => {
    let mailConf = {
        host: SMTPHost,
        port: SMTPPort,
        secure: true   // true for 465, false for other ports
    };
    if (conf.OAuth2) {
        mailConf.auth = {
            type: 'OAuth2',
            clientId: clientId,
            clientSecret: clientSecret
        }
    } else {
        mailConf.auth = {
            user: fromAddress,  // generated ethereal user
            pass: authorization // generated ethereal password
        }
    }

    const transporter = nodemailer.createTransport(mailConf);

    let html = '';
    switch (type) {
        case 101:
            html = '<h3>CTXC Height Monitor</h3>'
                + '<p>No new block synced within ' + (interval / 60) + ' minutes.</p>'
                + '<p>Current block height: ' + currentHeight + '</p>'
                + '<p>Last block height: ' + lastHeight + '</p>';
            break;
        case 201:
            html = '<h3>CTXC Hashrate Monitor</h3>'
                + '<p>Hashrate drops to the critical point within ' + (interval / 60) + ' minutes.</p>'
                + '<p>Current block height: ' + currentHeight + '</p>'
                + '<p>Current Hashrate: ' + currentHashrate.toFixed(3) + ' H/s</p>';
            break;
        case 202:
            html = '<h3>CTXC Hashrate Monitor</h3>'
                + '<p>Hashrate drops to the risky level within ' + (interval / 60) + ' minutes.</p>'
                + '<p>Current block height: ' + currentHeight + '</p>'
                + '<p>Current Hashrate: ' + currentHashrate.toFixed(3) + ' H/s</p>'
                + '<p>Last Hashrate: ' + lastHashrate.toFixed(3) + ' H/s</p>';
            break;
    }
    const subject = 'CTXC Monitor Notification';

    let mailOptions = {
        from: fromAddress, // sender address
        to: toAddress, // list of receivers
        subject: subject, // Subject line
        html: html
    };
    if (conf.OAuth2) {
        mailOptions.auth = {
            user: fromAddress,
            refreshToken: refreshToken,
            accessToken: accessToken
        }
    }
    return new Promise(function (resolve, reject) {

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(new Date(), 'error', 'email send err:', [error]);
                reject('email send err.');
            } else {
                console.log(new Date(), 'info', 'email send success');
                resolve('success');
            }
        })
    });
};
const getGmailToken = (type) => {
    var data = {
        refresh_token: refreshToken,
        token_uri: "https://oauth2.googleapis.com/token"
    };
    var options = {
        method: 'POST',
        url: 'https://developers.google.com/oauthplayground/refreshAccessToken',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    };
    return new Promise(function (resolve, reject) {

        request.post(options, function (err, response, body) {
            if (!err && response.statusCode === 200) {
                var tem = JSON.parse(body);
                accessToken = tem.access_token;
                resolve(type)
            } else {
                console.log(new Date(), 'error', 'get accessToken err.');
                reject('get accessToken err.');
            }
        })
    });

};
const getHeight = () => {
    var data = {
        jsonrpc: '2.0',
        method: 'ctxc_blockNumber',
        params: [],
        id: id++
    };
    var options = {
        method: 'POST',
        url: rpc,
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    };
    return new Promise(function (resolve, reject) {
        request.post(options, function (err, response, body) {
            if (!err && response.statusCode === 200) {
                var tem = JSON.parse(body);
                currentHeight = parseInt(tem.result);
                console.log(new Date(), 'info', 'get block number success. Heigth: ', currentHeight);
                resolve(currentHeight)
            } else {
                console.log(new Date(), 'error', 'get block number err.');
                reject('get block number err.');
            }
        })
    });
};

const getHashrate = (currentHeight)=> {
    // lastHeight = 3860296;
    var data = {
        jsonrpc: '2.0',
        method: 'ctxc_getBlockByNumber',
        params: ['0x' + currentHeight.toString(16), true],
        id: id++
    };
    var options = {
        method: 'POST',
        url: rpc,
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    };
    return new Promise(function (resolve, reject) {

        request.post(options, function (err, response, body) {
            if (!err && response.statusCode === 200) {
                var tem = JSON.parse(body);
                // console.log(new Date(), tem);
                currentHashrate = parseInt(tem.result.difficulty) / 13.5;
                console.log(new Date(), 'info', 'get hashrate success. hashrate: ', currentHashrate.toFixed(3));
                resolve(currentHashrate)
            } else {
                console.log(new Date(), 'error', 'get hashrate err.');
                reject('get hashrate err.');
            }
        })
    });
};

const checkHashrate = (currentHashrate) => {
    return new Promise(function (resolve, reject) {
        if (currentHashrate <= criticalPoint||id==2) {
            console.log(new Date(), 'info', 'Hashrate drops to the critical point');
            resolve(201);
        } else if (currentHashrate <= lastHashrate * riskyLevel / 100||id==4) {
            console.log(new Date(), 'info', 'Hashrate drops to the risky level');
            lastHashrate = currentHashrate;
            resolve(202);
        } else {
            reject(0);
        }
    });
};

const checkHeight = async(currentHeight) => {
    return new Promise(function (resolve, reject) {
        if (currentHeight < lastHeight||id==3) {
            console.log(new Date(), 'info', 'No new block synced');
            lastHeight = currentHeight;
            resolve(101);
        } else {
            lastHeight = currentHeight;
            reject(0);
        }
    });
};

function init() {
    getHeight()
        .then(async(currentHeight)=> {
            await checkHeight(currentHeight)
                .then((type)=> {
                    if (conf.OAuth2) {
                        getGmailToken(type)
                            .then((type)=> {
                                sendEmail(type)
                                    .then(()=> {
                                    })
                                    .catch(()=> {
                                    })
                            })
                            .catch(()=> {
                            })
                    } else {
                        sendEmail(type)
                            .then(()=> {
                            })
                            .catch(()=> {
                            })
                    }
                })
                .catch((err)=> {
                });
            getHashrate(currentHeight)
                .then((currentHashrate)=> {
                    checkHashrate(currentHashrate)
                        .then((type)=> {
                            if (conf.OAuth2) {
                                getGmailToken(type)
                                    .then((type)=> {
                                        sendEmail(type)
                                            .then(()=> {
                                            })
                                            .catch(()=> {
                                            })
                                    })
                                    .catch(()=> {
                                    })
                            } else {
                                sendEmail(type)
                                    .then(()=> {
                                    })
                                    .catch(()=> {
                                    })
                            }
                        })
                        .catch((err)=> {
                        })
                })
                .catch((err)=> {
                })
        })
        .catch((err)=> {
        });
    setTimeout(function () {
        init();
    }, interval * 1000)
}

init();
