const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());


let clients = []
const args = process.argv.slice(2);
const ip = args[0] || '127.0.0.1';  // 默认绑定 localhost
const port = args[1] || 33451;       // 默认端口 33451
function generateUniqueHash() {
    const uniqueHashId = uuidv4();  // 生成 UUID
    return uniqueHashId;
}

wss.on('connection', (ws, req) => {

    const fromLocalIp = req.local_ip;
    const uniqueDeviceId = uuidv4();  // 使用 UUID 生成唯一的连接ID

    clients.push(uniqueDeviceId);


    ws.send(JSON.stringify({ status: 'connected', hashid: uniqueHashId })); //连接成功回返回


    // 连接关闭时从设备列表中移除该设备
    ws.on('close', () => {
        clients = clients.filter(client => client !== ws);
    });

    // 发送连接成功信息
    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to WebSocket server!' }));
});
// 设置一个简单的路由
app.get('/', (req, res) => {

    res.send('Hello, Express server is running!');
    const ress = { message: "ok" };
    return res.json(ress);
});

// 启动 Express 服务器
app.listen(port, ip, () => {
    console.log(`Server is running at http://${ip}:${port}`);
});
