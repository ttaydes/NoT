const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
app.use(cors());


let device-from - locals =[]
// 获取命令行传入的参数
const args = process.argv.slice(2);
const ip = args[0] || '127.0.0.1';  // 默认绑定 localhost
const port = args[1] || 33451;       // 默认端口 33451

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
