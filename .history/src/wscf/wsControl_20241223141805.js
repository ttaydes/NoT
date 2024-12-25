const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

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

serverEF = app.listen(33451, '127.0.0.1', () => {
    console.log(`Server is running at http://127.0.0.1:33451`);
}); //用于前后端交流 

const ws = new WebSocket.Server({ server })
const wsEF = new WebSocket.Server({ serverEF })

// 本机对外的node ws接口 在ip：端口
ws.on('connection', (ws) => {


    const wsef = ws.WebSocket('ws://127.0.0.1:33451/userId=ws') //建立前后端的连接实例

    ws.addEventListener('message', (event) => {
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
});



wsEF.on('connection', (wsef, req) => {  //前后端ws
    const wslinkclient = [];
    const fromlocaldev = [];
    const clientId = req.headers['sec-websocket-key']; //每个客户端唯一标识 
    wslinkclient.push(wsed)


    wsEF.addListener('message', (event) => {
        const localdevreqname = JSON.parse(event.data.localreqlinknames);
        const lcoaldevstatus = JSON.parse(event.data.status);

        if (lcoaldevstatus == "accept") {
            fromlocaldev.push(localdevreqname);
            res.status(200).json({ reqlocaldev: fromlocaldev })
        }
        wslinkclient.forEach(client => {
            if (client !== wsef && client.readyState === WebSocket.OPEN) {
                client.send(`Broadcast message: ${message}`);
            }
        });

    });


});








app.get('/', (req, res) => {
    res.send("link......")
});
// 发送ws请求到local device
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

        ws.on('error', function error(err) {
            console.error('WebSocket error: ', err);
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

