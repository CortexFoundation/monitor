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
//Monitoring interval, unit: minutes
const interval = conf.interval;

const clientId = conf.clientId;
const clientSecret = conf.clientSecret;
const refreshToken = conf.refreshToken;
let accessToken = conf.accessToken;


let id = 0;
let currentHeight = 0;
let lastHeight = 0;
function sendEmail() {
    let mailConf = {
        host: SMTPHost,
        port: SMTPPort,
        secure: true   // true for 465, false for other ports
    }
    if (conf.OAuth2) {
        mailConf.auth = {
            type: 'OAuth2',
            clientId: clientId,
            clientSecret: clientSecret
        }
    }
    else {
        mailConf.auth = {
            user: fromAddress,  // generated ethereal user
            pass: authorization // generated ethereal password
        }
    }

    const transporter = nodemailer.createTransport(mailConf);


    const html = '<h3>CTXC Height Monitor</h3>'
        + '<p>No new block synced within ' + interval + ' minutes.</p>'
        + '<p>Current block height: ' + currentHeight + '</p>'
        + '<p>Last block height: ' + lastHeight + '</p>';
    const subject = 'CTXC Monitor Notification';

    var mailOptions = {
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
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(new Date(), 'error', 'email send err:', [error]);
        } else {
            console.log(new Date(), 'info', 'email send success');
        }
    });
}
function getGmailToken() {
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
    request.post(options, function (err, response, body) {
        if (!err && response.statusCode === 200) {
            var tem = JSON.parse(body);
            accessToken = tem.access_token;
            sendEmail();
        } else {
            console.log(new Date(), 'error', 'get block number err.');
            // process.exit();
        }
    });
}
function checkHeight() {
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
    request.post(options, function (err, response, body) {
        if (!err && response.statusCode === 200) {
            var tem = JSON.parse(body);
            currentHeight = parseInt(tem.result);
            console.log(new Date(), 'info', 'get block number success. Heigth: ', currentHeight);
            if (currentHeight <= lastHeight || id == 2) {
                console.log(new Date(), 'info', 'No new block synced.');
                if (conf.OAuth2) {
                    getGmailToken();
                } else {
                    sendEmail();
                }
            }
            lastHeight = currentHeight;
        } else {
            console.log(new Date(), 'error', 'get block number err.');
            // process.exit();
        }
    });
    setTimeout(function () {
        checkHeight();
    }, interval * 1000)
}
function init() {
    checkHeight();
}

init();

