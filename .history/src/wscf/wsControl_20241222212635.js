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
app.listen(port, ip, () => {
    console.log(`Server is running at http://${ip}:${port}`);
});


server = app.listen(port, '127.0.0.1', () => {
    console.log(`Server is running at http://${ip}:${port}`);
});
const ws = new WebSocket.Server({ server })
const wssFE = new WebSocket.Server({ noServer: true });





// 本级对外的node ws接口
ws.on('connection', (ws) => {

    const uniqueDeviceId = uuidv4();  // 使用 UUID 生成唯一的连接ID
    connectdevice.push(uniqueDeviceId);
    ws.send(JSON.stringify({ status: 'connected', hashid: uniqueHashId })); //连接成功返回状态与设备唯一 uuid
    // 连接关闭时从设备列表中移除该设备


    ws.on('close', () => {
        connectdevice = connectdevice.filter(client => client !== ws);
    });
});



app.get('/', (req, res) => {
    res.send("link......")
});
// 发送ws请求到local device
app.get('/tolocalws', (req, res) => {
    const connectDeviceIp = req.query.device_ip;
    const connectDevicePort = req.query.device_port;
    const connectStaues = req.query.connect_status;
    res.send("yes")
    if (connectStaues == "open") {
        console.log("1yes")
        const ws = new WebSocket(`ws://${connectDeviceIp}:${connectDevicePort}/wsfe`); // 与对方建立一个连接实例

        // 监听连接成功事件


        ws.on('error', function error(err) {
            console.error('WebSocket error: ', err);
        });
    }


    else if (connectStaues == "close") {

        ws.close()  // 主动断开ws连接
    }



});

app.get('/fromlocalws', (req, res) => {


});
