const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());


let device-from - locals =[]
// 获取命令行传入的参数
const args = process.argv.slice(2);
const ip = args[0] || '127.0.0.1';  // 默认绑定 localhost
const port = args[1] || 33451;       // 默认端口 33451
function generateUniqueHash() {
    const uniqueHashId = uuidv4();  // 生成 UUID
    return uniqueHashId;
}

wss.on('connection', (ws, req) => {

    const fromLocalIp = req.local_ip;
    const timeNow = Date.now()
    // 连接时将设备添加到客户端列表
    clients.push(ws);

    // 设备连接成功后，监听剪切板消息或文件传输
    ws.on('message', (message) => {
        console.log('Received:', message);
        // 处理接收到的剪切板数据或文件内容
    });

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
