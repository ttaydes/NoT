const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');



const wssFE = new WebSocket.Server({ noServer: true });

const app = express();

const port = 7788;
const address = '127.0.0.1';

app.use(cors());

wssFE.on('connection', (ws, req) => {

    const fromLocalIp = req.local_ip;
    const uniqueDeviceId = uuidv4();  // 使用 UUID 生成唯一的连接ID

    connectdevice.push(uniqueDeviceId);


    ws.send(JSON.stringify({ status: 'connected', hashid: uniqueHashId })); //连接成功返回状态与设备唯一 uuid


    // 连接关闭时从设备列表中移除该设备
    ws.on('close', () => {
        connectdevice = connectdevice.filter(client => client !== ws);
    });
});

// 使用 express.listen() 启动服务器
app.listen(port, address, () => {
    console.log(`Server running at http://[${address}]:${port}/`);
});
