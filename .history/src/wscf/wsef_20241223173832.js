const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());


const wslinkclient = []; //连接前后端ws 的实例



serverEF = app.listen(33456, '127.0.0.1', () => {
    console.log(`Server is running at http://127.0.0.1:33456`);
}); //用于前后端交流 


const wsEF = new WebSocket.Server({ serverEF })



function sendMessageToClient(userId, message) {
    const client = wslinkclient[userId];
    if (client && client.readyState === WebSocket.OPEN) {
        client.send.JSON.stringify({ fromlocaldev: message });
    } else {
        console.log(`Client ${userId} is not connected`);
    }
}// 像某个客户端发送消息

wsEF.on('connection', (wsef, req) => {  //前后端ws
    const fromlocaldev = [];
    const queryParams = url.parse(req.url, true).query;
    const userId = queryParams.userId;  // 提取客户端传递的 userId

    wslinkclient[userId] = wsef;//每个连接实例对应加入数组




    wsEF.addListener('message', (event) => {
        const localdevreqname = JSON.parse(event.data).localreqlinknames;
        const lcoaldevstatus = JSON.parse(event.data).status;

        if (lcoaldevstatus == "accept") {
            fromlocaldev.push(localdevreqname);
            res.status(200).json({ reqlocaldev: fromlocaldev })
        }
    });

    setInterval(() => {

        sendMessageToClient('frontws', fromlocaldev);
    }, 1000);

    ws.on('error', function error(err) {
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
        fromws.send(JSON.stringify({ reqlinkname: ip }));         //写明身份

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
        ws.close(); // 主动断开ws连接
        fromws.addEventListener('message', (event) => {
            const data = JSON.stringify(event.data);
            if (data.status == "closed") { } //监听对面是否关闭

            res.status(200).json({ LinkStatus: "closeok" });// 发送给前端 确认关闭
        });

    }



});

