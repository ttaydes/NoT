// deviceA.js (设备 A)
const WebSocket = require('ws');

// 设备 B 的 IP 地址和 WebSocket 端口
const deviceB_IP = 'ws://127.0.0.1:8888';  // 设备 B 的 IP 地址和端口

// 连接设备 B 的 WebSocket 服务
const ws = new WebSocket(deviceB_IP);

ws.on('connection', () => {
    console.log('设备A成功连接到设备B');

    // 发送消息到设备 B
    ws.send('Hello from 设备A!');
});

ws.on('message', (message) => {
    console.log(`从设备B收到消息: ${message}`);
});
