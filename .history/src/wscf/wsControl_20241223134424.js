const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
let connectdevice = []
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

    const uniqueDeviceId = uuidv4();  // 使用 UUID 生成唯一的连接ID
    connectdevice.push(uniqueDeviceId);
    ws.send(JSON.stringify({ status: 'connected', uuid: uniqueDeviceId })); //连接成功返回状态与唯一 会话uuid


    ws.addEventListener('message', (event) => {
        if (connectdevice) {
            ws.WebSocket('ws://127.0.0.1:33451') //建立前后端的连接实例
            const reqlinknames = JSON.parse(event.data).reqlinknamel;
            while (1) {
                ws.send(JSON.stringify({ localreqlinknames: reqlinknames, status: 'accept' }));
            }
        }

    });

    // 连接关闭时从设备列表中移除该设备
    ws.on('close', () => {
        ws.send(JSON.stringify({ status: 'closed' }));

        connectdevice = connectdevice.filter(client => client !== ws);
    });
});

app.get('/fromlocaldevice', (req, res) => {


    wsEF.on('connection', (wsef) => {

        const fromlocaldev = [];
        wsEF.addListener('message', (event) => {
            const localdevreqname = JSON.parse(event.data.localreqlinknames);
            const lcoaldevstatus = JSON.parse(event.data.status);

            if (lcoaldevstatus == "accept") {
                fromlocaldev.push(localdevreqname);
                res.status(200).json({ reqlocaldev: fromlocaldev })
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

                res.status(200).json({ LinkStatus: "connectok", uniqueDeviceId: jsonwsdata.uniqueDeviceId }); // 发给我的前端验证

            }
        });

        ws.on('error', function error(err) {
            console.error('WebSocket error: ', err);
        });
    }


    else if (connectStatus == "close") {
        ws.close(); // 主动断开ws连接
        res.status(200).json({ LinkStatus: "closeok" });

    }



});

app.get('/fromlocalws', (req, res) => {


});
