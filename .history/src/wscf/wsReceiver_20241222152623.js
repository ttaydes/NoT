const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();

const port = 3345;
const address = '::';  // 使用链路本地地址，确保接口正确

app.use(cors());
app.get('/', (req, res) => {
    res.send("Hello from Express!");
});

// 使用 express.listen() 启动服务器
app.listen(port, address, () => {
    console.log(`Server running at http://${address}:${port}/`);
});
