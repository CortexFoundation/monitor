# monitor
## Installation
### Pre-requisites:
node engine: v10.24.1 or later

npm: 6.14.12 or later

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

### Run
```
node server.js 
```
##  Command line 
```
curl -X POST --data '{"jsonrpc":"2.0","method":"ctxc_blockNumber","params":[],"id":83}'  127.0.0.1:8545  -H "Content-Type: application/json"
```
