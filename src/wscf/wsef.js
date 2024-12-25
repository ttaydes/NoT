const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const url = require('url');

const app = express();

app.use(cors());
const connectInstance = {}
const args = process.argv.slice(2);

const ip = args[0];  // node默认绑定 localhost

const wslinkclient = {}; //连接前后端ws 的实例



const wsEF = new WebSocket.Server({ port: 33456 })  // 创建wsef对象



function sendMessageToClient(userId, message) {
    const client = wslinkclient[userId];
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ fromlocaldev: message }));
    } else {
        console.log(`Client ${userId} is not connected`);
    }
}// 像某个客户端发送消息

wsEF.on('connection', (wsef, req) => {  //前后端ws
    const queryParams = url.parse(req.url, true).query;
    const userId = queryParams.userId;  // 提取客户端传递的 userId
    console.log(userId + "加入了efws");
    wslinkclient[userId] = wsef;//每个连接实例对应加入数组


    wsef.on('on',()=>{
        console.log("efws连接成功");
    })
    wsef.on('message', (event) => {
        const evenddata = event.toString();
        const localdevreqname = JSON.parse(evenddata).localreqlinknames;
        const localreqlinkip = JSON.parse(evenddata).localreqlinkip;
        const localreqlinkport = JSON.parse(evenddata).localreqlinkport;
        const lcoaldevstatus = JSON.parse(evenddata).status;
        if (lcoaldevstatus == "accept") {
            const a = JSON.stringify({ localreqlinknames: localdevreqname, localreqlinkip: localreqlinkip, localreqlinkport: localreqlinkport});
            setInterval(() => {

                sendMessageToClient('frontws', a); //每秒推送给前端  
            }, 1000);
        }
    });

    wsEF.on('error', function error(err) {
        console.error('efwserror: ', err);
    });
});

app.get('/tolocalws', (req, res) => {
    const connectDeviceIp = req.query.device_ip;
    const connectDevicePort = req.query.device_port;
    const connectStatus = req.query.connect_status;
    const wsurl = String(`ws://${connectDeviceIp}:${connectDevicePort}`);
    if (connectStatus == "open") {

        // 监听连接成功事件
        const fromws = new WebSocket(wsurl); // 与对方建立一个连接实例
        connectInstance[connectDeviceIp] = fromws
        fromws.on('open', () => {
            fromws.send(JSON.stringify({ 
                reqlinkname: ip,
                reqlinkip: ip,
                reqlinkport: connectDevicePort
            }))}); //写明身份

        fromws.addEventListener('message', (event) => {
            const wsdata = event.data;
            const jsonwsdata = JSON.parse(wsdata); // 接收到对方的连接


            if (jsonwsdata.status == "connected") {

                res.status(200).json({ LinkStatus: "connectok" }); // 发给我的前端验证 发送二者会话id

            }
        });

        fromws.on('error', function error(err) {
            console.error('mywsWebSocket error: ', err);
        });

        
    }
    else if (connectStatus == "close") {
        connectInstance[connectDeviceIp].close();
        res.status(200).json({ LinkStatus: "closeok" });// 发送给前端 确认关闭
    }



});

