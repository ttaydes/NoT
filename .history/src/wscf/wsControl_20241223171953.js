const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const url = require('url');

const app = express();

app.use(cors());
let connectdevice = [];
let lastconnectdevice = []; // 上一次设备列表
const wslinkclient = {}; // 用于存储 WebSocket 客户端实例

const args = process.argv.slice(2);
const ip = args[0] || '127.0.0.1'; // node 默认绑定 localhost
const port = args[1] || 33451; // node 默认端口 33451

// 启动 Express 服务器
const server = app.listen(port, ip, () => {
    console.log(`Server is running at http://${ip}:${port}`);
});

// 仅启动一个 WebSocket 服务器
const ws = new WebSocket.Server({ server });

// WebSocket 连接逻辑
ws.on('connection', (ws, req) => {
    const wsef = new WebSocket('ws://127.0.0.1:33451'); // 与前端服务建立 WebSocket 连接

    ws.on('message', (event) => {
        const { reqlinkname } = JSON.parse(event.data);  // 获取客户端发送的设备名称

        // 连接成功时返回状态和会话 ID
        ws.send(JSON.stringify({ status: 'connected', devicename: reqlinkname }));

        connectdevice.push(reqlinkname); // 将设备名称添加到连接设备列表

        // 如果设备列表发生变化，通知前端
        if (JSON.stringify(connectdevice) !== JSON.stringify(lastconnectdevice)) {
            lastconnectdevice = [...connectdevice];  // 更新上一次设备列表
            wsef.send(JSON.stringify({ localreqlinknames: connectdevice, status: 'accept' }));
        }
    });

    // 监听 WebSocket 关闭事件
    ws.on('close', () => {
        ws.send(JSON.stringify({ status: 'closed' }));
        connectdevice = connectdevice.filter(client => client !== ws); // 从设备列表中移除
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

// 向特定客户端发送消息
function sendMessageToClient(userId, message) {
    const client = wslinkclient[userId];
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ fromlocaldev: message }));
    } else {
        console.log(`Client ${userId} is not connected`);
    }
}

// 前后端 WebSocket 连接逻辑
const wsEF = new WebSocket.Server({ server });

wsEF.on('connection', (wsef, req) => {
    const queryParams = url.parse(req.url, true).query;
    const userId = queryParams.userId;  // 提取客户端传递的 userId

    wslinkclient[userId] = wsef; // 将前端 WebSocket 实例存储到客户端列表中

    wsef.on('message', (event) => {
        const { localreqlinknames, status } = JSON.parse(event.data);
        if (status === 'accept') {
            // 处理接收到的本地设备请求名称
            const fromlocaldev = [localreqlinknames];
            // 响应前端请求
            wsef.send(JSON.stringify({ reqlocaldev: fromlocaldev }));
        }
    });

    setInterval(() => {
        // 每秒向客户端发送设备列表
        sendMessageToClient('frontws', connectdevice);
    }, 1000);

    wsef.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

// Express 路由
app.get('/', (req, res) => {
    res.send("link......");
});

// 发送 WebSocket 请求到本地设备
app.get('/tolocalws', (req, res) => {
    const connectDeviceIp = req.query.device_ip;
    const connectDevicePort = req.query.device_port;
    const connectStatus = req.query.connect_status;
    const wsurl = `ws://${connectDeviceIp}:${connectDevicePort}`;

    if (connectStatus === "open") {
        const fromws = new WebSocket(wsurl); // 创建 WebSocket 实例连接到设备
        fromws.send(JSON.stringify({ reqlinkname: ip })); // 向设备发送请求

        fromws.on('message', (event) => {
            const wsdata = JSON.parse(event.data); // 解析接收到的 WebSocket 消息

            if (wsdata.status === "connected") {
                res.status(200).json({ LinkStatus: "connectok" }); // 返回连接状态给前端
            }
        });

        fromws.on('error', (err) => {
            console.error('WebSocket error:', err);
        });
    } else if (connectStatus === "close") {
        // 主动关闭 WebSocket 连接
        ws.close();
        res.status(200).json({ LinkStatus: "closeok" }); // 确认关闭操作
    }
});
