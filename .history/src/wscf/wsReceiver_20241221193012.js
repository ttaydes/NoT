// 引入 express 和 WebSocket
const express = require('express');
const WebSocket = require('ws');

// 创建 Express 应用
const app = express();

// 设置 WebSocket 服务器
const wss = new WebSocket.Server({ noServer: true });

// 存储 WebSocket 客户端连接
const clients = new Map();
// 定义端口


// WebSocket 连接处理
wss.on('connection', (ws, req) => {
    // 使用 URL 中的设备 ID 来标识每个连接
    const deviceId = req.url.split('?id=')[1]; // 获取 URL 中的设备 ID（假设设备通过 ?id=123 连接）

    // 将 WebSocket 与设备 ID 关联
    clients.set(deviceId, ws);

    // 监听客户端发送的消息（剪切板数据）
    ws.on('message', (message) => {
        console.log(`Received from ${deviceId}: ${message}`);

        // 广播剪切板内容给其他客户端
        for (let [otherDeviceId, client] of clients) {
            if (otherDeviceId !== deviceId) {
                client.send(message); // 将接收到的剪切板数据转发给其他客户端
            }
        }
    });

    // 监听连接关闭
    ws.on('close', () => {
        clients.delete(deviceId);
        console.log(`Connection closed for device ${deviceId}`);
    });
});

// 创建 HTTP 服务器以支持 WebSocket 升级
const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// 处理 WebSocket 升级请求
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// 接受发布服务的路由通知
app.get('/nodeAPI', (req, res) => {

    const pub_ip = req.query.ip
    const pub_port = req.query.port
    res.send(pub_ip, pub_port)


})
// 定义路由用于控制剪切板同步（例如，可以通过 HTTP 接口触发剪切板内容同步）
app.post('/syncClipboard', express.json(), (req, res) => {
    const { deviceId, clipboardContent } = req.body;

    // 如果设备在线，发送剪切板内容
    const client = clients.get(deviceId);
    if (client) {
        client.send(clipboardContent); // 将剪切板内容发送给对应的设备
        res.status(200).send('Clipboard synchronized');
    } else {
        res.status(404).send('Device not found');
    }
});

