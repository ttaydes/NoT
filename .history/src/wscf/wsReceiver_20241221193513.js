const http = require('http');
const WebSocket = require('ws');

// 获取命令行传入的端口和IP
const args = process.argv.slice(2);
const ip = args[0] || 'localhost';  // 默认值为 localhost
const port = args[1] || 3000;       // 默认值为 3000

// 创建一个 HTTP 服务器
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server running');
});

// 使用 WebSocket 库监听连接
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    ws.on('message', (message) => {
        console.log('Received:', message);
    });
});

server.listen(port, ip, () => {
    console.log(`Server is running at ws://${ip}:${port}`);
});
