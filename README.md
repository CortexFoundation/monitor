# monitor
## Installation
### Pre-requisites:
system: ubuntu18.04+

node engine: v10.24.1 or later

npm: 6.14.12 or later

Install node

```
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
```
reset terminal

```
nvm install v10
```

### Install
```
git clone https://github.com/CortexFoundation/monitor.git
cd monitor
npm install
```
### Config

```
vim conf.json
```
set email address, authorization, SMTP host and port, rpc, interval

SMTP config exmple: conf.exampl1.json

gmail config exmple: conf.example2.json

### Gmail config guide

#### enable SMTP

login gmail

Settings -> See all settings -> Forwarding and POP/IMAP -> Enable IMAP -> Save Changes

#### Create project

[Goole Cloud Resourc Manager](https://console.cloud.google.com/cloud-resource-manager)

CREATE PROJECT -> Project name -> CREATE

#### Get clientId and clientSecret

[Goole CloudPlatform Dashboard](https://console.cloud.google.com/home/dashboard)

choose the project created above, go to [APIs overview](https://console.cloud.google.com/apis/dashboard)

OAuth consent screen -> Exernal -> CREATE -> App name -> User support email -> Developer contact information 

-> SAVE AND CONTINUE -> SAVE AND CONTINUE -> test users -> add users -> the gmail to send the email 

-> SAVE AND CONTINUE

Credentials -> CREATE CREDENTIALS -> OAuth client ID -> Application type -> Web Application -> Authorised redirect URIs 

-> ADD URL -> https://developers.google.com/oauthplayground -> CREATE

copy Client ID and Client Secret to config.json

#### Get refreshToken and accessToken

[OAuth 2.0 Playground](https://developers.google.com/oauthplayground)

In the top right corner, click the settings icon, check "Use your own OAuth credentials" and paste your Client ID and Client Secret.

Step 1,  Select Gmail API v1 -> https://mail.google.com/ -> Authorize APIs

Step 2, Exchange authorization code for tokens, copy Refresh token and Access token to config.json

### Run
```
node server.js 
```
##  Command line 
```
curl -X POST --data '{"jsonrpc":"2.0","method":"ctxc_blockNumber","params":[],"id":83}'  127.0.0.1:8545  -H "Content-Type: application/json"
```


