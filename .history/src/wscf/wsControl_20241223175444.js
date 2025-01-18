const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
let connectdevice = []
let lastcconnectdevice = [] //上一次设备列表

const wslinkclient = []; //连接前后端ws 的实例

const args = process.argv.slice(2);
const ip = args[0] || '127.0.0.1';  // node默认绑定 localhost
const port = args[1] || 33451;       // node 默认端口 33451



// 启动 Express 服务器
server = app.listen(port, ip, () => {
    console.log(`Server is running at http://${ip}:${port}`);
});



const ws = new WebSocket.Server({ server })

// 本机对外的node ws接口 在ip：端口
ws.on('connection', (ws) => {


    const wsef = new WebSocket('ws://127.0.0.1:33456/userId=ws') //建立前后端的连接实例
    wsef.on('open', () => {
        console.log('Connected to frontend WebSocket server');
    });

    ws.on('message', (event) => {
        const reqlinknames = JSON.parse(event.data).reqlinknamel;  //接收对方”我是谁“

        ws.send(JSON.stringify({ status: 'connected', devicename: reqlinknames })); //连接成功返回状态与唯一 会话uuid

        connectdevice.push(reqlinknames);

        if (connectdevice != lastcconnectdevice) {
            lastcconnectdevice = connectdevice

            wsef.send(JSON.stringify({ localreqlinknames: connectdevice, status: 'accept' }));
        }

    });

    // 连接关闭时从设备列表中移除该设备
    ws.on('close', () => {
        ws.send(JSON.stringify({ status: 'closed' }));

        connectdevice = connectdevice.filter(client => client !== ws); //设备会话从保存数组踢出去
    });
    ws.on('error', function error(err) {
        console.error('ws error: ', err);
    });
});


function sendMessageToClient(userId, message) {
    const client = wslinkclient[userId];
    if (client && client.readyState === WebSocket.OPEN) {
        client.send.JSON.stringify({ fromlocaldev: message });
    } else {
        console.log(`Client ${userId} is not connected`);
    }
}// 像某个客户端发送消息





app.get('/', (req, res) => {
    res.send("link......")
});