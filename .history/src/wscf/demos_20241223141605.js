const WebSocket = require('ws');
const url = require('url');

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 8080 });

// 存储所有连接的客户端
const clients = {};

wss.on('connection', (ws, req) => {
    // 从 URL 查询参数中获取 userId
    const queryParams = url.parse(req.url, true).query;
    const userId = queryParams.userId;  // 提取客户端传递的 userId

    console.log(`Client connected with userId: ${userId}`);

    // 将 WebSocket 对象与 userId 关联
    clients[userId] = ws;

    // 监听客户端发送的消息
    ws.on('message', (message) => {
        console.log(`Received message from ${userId}: ${message}`);
    });

    // 监听客户端断开连接
    ws.on('close', () => {
        console.log(`Client disconnected: ${userId}`);
        delete clients[userId];  // 从 clients 中移除该客户端
    });

    // 向客户端发送欢迎消息
    ws.send(`Welcome, ${userId}`);
});

// 向特定客户端发送消息的函数
function sendMessageToClient(userId, message) {
    const client = clients[userId];
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(message);
        console.log(`Message sent to ${userId}: ${message}`);
    } else {
        console.log(`Client ${userId} is not connected`);
    }
}

// 示例：向某个客户端发送消息
setInterval(() => {
    // 假设我们要给 userId 为 '12345' 的客户端发送消息
    sendMessageToClient('12345', 'Hello, this is a message from the server!');
}, 5000);
