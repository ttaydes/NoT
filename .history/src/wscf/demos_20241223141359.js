const WebSocket = require('ws');

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 8080 });

// 存储所有连接的客户端（可以使用对象或 Map 来管理每个客户端）
const clients = {};

// 处理连接请求
wss.on('connection', (ws, req) => {
    // 使用客户端的 UUID 或 IP 地址作为键，存储 WebSocket 实例
    const clientId = req.headers['sec-websocket-key'];  // 或使用 req.socket.remoteAddress 等

    // 将新的 WebSocket 连接存储在 `clients` 中
    clients[clientId] = ws;

    console.log(`New client connected: ${clientId}`);

    // 监听客户端发送的消息
    ws.on('message', (message) => {
        console.log(`Received message from ${clientId}: ${message}`);
    });

    // 监听客户端关闭连接
    ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        delete clients[clientId]; // 移除已断开连接的客户端
    });

    // 向客户端发送欢迎消息
    ws.send('Welcome to the WebSocket server!');
});

// 向特定客户端发送消息的函数
function sendMessageToClient(clientId, message) {
    const client = clients[clientId]; // 根据客户端的 ID 获取 WebSocket 实例
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(message); // 向该客户端发送消息
        console.log(`Message sent to ${clientId}: ${message}`);
    } else {
        console.log(`Client ${clientId} is not connected`);
    }
}

// 示例：服务器端定时给某个客户端发送消息
setInterval(() => {
    const clientId = Object.keys(clients)[0]; // 获取第一个客户端的 ID（只做演示）
    if (clientId) {
        sendMessageToClient(clientId, `Hello ${clientId}, this is a message from the server!`);
    }
}, 5000);
