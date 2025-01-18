const express = require('express');
const WebSocket = require('ws');

const app = express();
const port = 3000;

// 创建 HTTP 服务
const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 当有客户端连接时触发
wss.on('connection', (ws) => {
    console.log('A new client connected');

    // 监听客户端消息
    ws.on('message', (message) => {
        console.log('received: %s', message);

        // 发送消息给客户端
        ws.send(`Hello, you sent: ${message}`);
    });

    // 发送欢迎消息给新连接的客户端
    ws.send('Welcome to WebSocket server');
});

// 在 Express 路由中处理其他 HTTP 请求
app.get('/', (req, res) => {
    res.send('WebSocket server is running');
});
