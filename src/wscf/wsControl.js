const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const url = require('url');

const app = express();

app.use(cors());
let connectdevice = []
let lastcconnectdevice = [] //上一次设备列表
const connectInstance = {}
const args = process.argv.slice(2);
const ip = args[0] || '127.0.0.1';  // node默认绑定 localhost
const port = args[1] || 33451;       // node 默认端口 33451
const wslinkclient = {}; //连接前后端ws 的实例
const wsToNameMap = new Map();  // WebSocket -> name
const nameToWsMap = new Map();  // name -> WebSocket
app.listen(3345, '127.0.0.1', () => {
    console.log(`Server is running at http://127.0.0.1:3345`);
}); // 前后端通信

const wsEF = new WebSocket.Server({ port: 33456 }) //默认wseF端口33456  //wsef端口

function sendMessageToClient(userId, message) {
    const client = wslinkclient[userId];
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ fromlocaldev: message }));
    } else {
        console.log(`Client ${userId} is not connected`);
    }
}// 像某个客户端发送消息

wsEF.on('connection', (wsef, req) => {  //前后端ws
    const queryParams = url.parse(req.url, true).query;
    const userId = queryParams.userId;  // 提取客户端传递的 userId
    console.log(userId + "加入了efws");
    wslinkclient[userId] = wsef;//每个本地ws 和EF连接实例对应加入数组


    wsef.on('on',()=>{
        console.log("efws连接成功");
    })
    wsef.on('message', (event) => {
        const evenddata = event.toString();
        const localdevreqname = JSON.parse(evenddata).localreqlinknames;
        const localreqlinkip = JSON.parse(evenddata).localreqlinkip;
        const localreqlinkport = JSON.parse(evenddata).localreqlinkport;
        const lcoaldevstatus = JSON.parse(evenddata).status;
        if (lcoaldevstatus == "accept") {
            const a = JSON.stringify({ localreqlinknames: localdevreqname, localreqlinkip: localreqlinkip, localreqlinkport: localreqlinkport,status: lcoaldevstatus});
      
            sendMessageToClient('frontws', a); //每秒推送给前端  
      
        }
        else if(lcoaldevstatus == "reject"){
            console.log("断开连接");
            const b = JSON.stringify({localreqlinknames: localdevreqname,status: lcoaldevstatus});
           
            sendMessageToClient('frontws', b); //每秒推送给前端  
         
        }
    });

    wsEF.on('error', function error(err) {
        console.error('efwserror: ', err);
    });
});




app.get('/tolocalws', (req, res) => {
    const connectDeviceIp = req.query.device_ip;
    const connectDevicePort = req.query.device_port;
    const connectStatus = req.query.connect_status;
    const wsurl = String(`ws://${connectDeviceIp}:${connectDevicePort}`);
    if (connectStatus == "open") {

        // 监听连接成功事件
        const fromws = new WebSocket(wsurl); // 与对方建立一个连接实例
        connectInstance[connectDeviceIp] = fromws

        fromws.on('open', () => {
            fromws.send(JSON.stringify({ 
                reqlinkname: ip,
                reqlinkip: ip,
                reqlinkport: connectDevicePort
            }))}); //写明身份

        fromws.addEventListener('message', (event) => {
            const wsdata = event.data;
            const jsonwsdata = JSON.parse(wsdata); // 接收到对方的连接


            if (jsonwsdata.status == "connected") {

                res.status(200).json({ LinkStatus: "connectok" }); // 发给我的前端验证 发送二者会话id

            }
        });

        fromws.on('error', function error(err) {
            console.error('mywsWebSocket error: ', err);
        });

        
    }
    else if (connectStatus == "close") {
        const ws = nameToWsMap.get(connectDeviceIp);
        if (ws) {
            ws.close(); // Properly close the WebSocket connection
        
            nameToWsMap.delete(connectDeviceIp);
            console.log("断开连接");
            res.status(200).json({ LinkStatus: "closeok" });
        } else {
            res.status(404).json({ error: "No active connection found" });
        }
    }


});









// 启动 Express 服务器
servers = app.listen(port, ip, () => {
    console.log(`Server is running at http://${ip}:${port}`);
});


const wstoef = new WebSocket('ws://127.0.0.1:33456/?userId=ws'); //建立前后端的连接实例
const ws = new WebSocket.Server({  server: servers })

// 本机对外的node ws接口 在ip：端口
ws.on('connection', (ws) => {

    ws.on('message', (event) => {
        const eventdata = event.toString()
        const reqlinknames = JSON.parse(eventdata).reqlinkname;  //接收对方”我是谁“
        const reqlinkip = JSON.parse(eventdata).reqlinkip;  //接收对方”我是谁“
        const reqlinkport = JSON.parse(eventdata).reqlinkport;  //接收对方”我是谁“
        const reqlinkstatus = JSON.parse(eventdata).status;  //接收对方”我是谁状态

        wsToNameMap.set(ws, reqlinknames);
        nameToWsMap.set(reqlinknames, ws);

        nameToWsMap.get(reqlinknames).send(JSON.stringify({ status: 'connected', devicename: reqlinknames })); //连接成功返回到对面                               
        
        connectdevice.push(reqlinknames);
        if (reqlinknames && lastcconnectdevice != connectdevice) {
            console.log("发送数据给efws");
            wstoef.send(JSON.stringify({ localreqlinknames: reqlinknames,localreqlinkip: reqlinkip,localreqlinkport: reqlinkport,status: 'accept' })); //将接受的设备名 推送前端efws
        }

        if(reqlinkstatus == "reject"){
            wstoef.send(JSON.stringify({ localreqlinknames: reqlinknames,status: 'reject' })); // 接收对面的断开 推送给efws
        }
        

    });

    // 连接关闭时从设备列表中移除该设备
    ws.on('close', () => {
        
        ws.send(JSON.stringify({ localreqlinknames: wsToNameMap.get(ws),status: 'reject' })); //被动断开发送给对面的ws
        wstoef.send(JSON.stringify({ localreqlinknames: wsToNameMap.get(ws),status: 'reject' })); //主动断开 发送自身的wsef
        connectdevice = connectdevice.filter(client => client !== ws); //设备会话从保存数组踢出去
    });
    ws.on('error', function error(err) {
        console.error('ws error: ', err);
    });
});





app.get('/', (req, res) => {
    res.send("link......")
});