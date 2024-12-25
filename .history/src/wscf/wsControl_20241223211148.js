const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();

app.use(cors());
let connectdevice = []
let lastcconnectdevice = [] //上一次设备列表


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





    ws.on('message', (event) => {

        const reqlinknames = JSON.parse(event.data).reqlinknamel;  //接收对方”我是谁“
        ws.send(JSON.stringify({ status: 'connected', devicename: reqlinknames })); //连接成功返回状态
        connectdevice.push(reqlinknames);



        // const wstoef = new WebSocket('ws://127.0.0.1:33456/?userId=ws'); //建立前后端的连接实例

        // wstoef.onopen = () => {
        //     console.log('Connected to the server');
        //     ws.send('Hello, Server!');
        // };

        // // 接收到消息时的处理
        // wstoef.onmessage = (event) => {
        //     console.log('Received message from server:', event.data);
        // };

        // // 连接关闭时的处理
        // wstoef.onclose = () => {
        //     console.log('Connection closed');
        // };

        if (connectdevice != lastcconnectdevice) {
            lastcconnectdevice = connectdevice
            wstoef.send(JSON.stringify({ localreqlinknames: connectdevice, status: 'accept' }));
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






app.get('/', (req, res) => {
    res.send("link......")
});