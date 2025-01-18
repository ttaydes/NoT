const http = require('http');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();


const port = 8080;
const address = 'fe80::100d:e867:aa1f:2550%en1';  // 链路本地地址
const iface = 'eth0'; // 网络接口



app.use(cors());
app.get('/', (req, res) => {
    res.send("11111")

});


http.createServer((req, res) => {
    res.write('Hello World');
    res.end();
}).listen(port, address, () => {
    console.log(`Server running at http://[${address}]%${iface}:${port}/`);
});
