const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const url = require('url');
const fs = require('fs');
const { stringify } = require('querystring');

const app = express();

app.use(cors());
let connectdevice = []
let lastcconnectdevice = [] //上一次设备列表
const args = process.argv.slice(2);
const ip = args[0] || '127.0.0.1';  // node默认绑定 localhost
const port = args[1] || 33451;       // node 默认端口 33451
const wslinkclient = {}; //连接前后端ws 的实例
const clipboardLink = new Map(); //剪贴板连接实例
const transfileLink = new Map(); //文件传输连接实例
const wsToNameMap = new Map();  // WebSocket -> name
const nameToWsMap = new Map();  // name -> WebSocket

app.listen(3345, '127.0.0.1', () => {
    console.log(`EFServer is running at http://127.0.0.1:3345`);
}); // 前后端通信

const wsEF = new WebSocket.Server({ port: 33456 }) //默认wseF端口33456  wsef端口

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


    wsef.on('on', () => {
        console.log("efws连接成功");
    })
    wsef.on('message', (event) => {
        const evenddata = event.toString();
        const localdevreqname = JSON.parse(evenddata).localreqlinknames;
        const localreqlinkip = JSON.parse(evenddata).localreqlinkip;
        const localreqlinkport = JSON.parse(evenddata).localreqlinkport;
        const localdevstatus = JSON.parse(evenddata).status;
        const localreqlinktype = JSON.parse(evenddata).type;
        if (localreqlinktype == "clipboard") {
            const localreqlinkcontent = JSON.parse(evenddata).content;
            const c = JSON.stringify({ localreqlinknames: localdevreqname, localreqlinkip: localreqlinkip, localreqlinkport: localreqlinkport, type: 'clipboard', content: localreqlinkcontent });
            sendMessageToClient('clipboardws', c); //每秒推送给前端  
        }
        if (localreqlinktype == "transfile") {
            const transfilename = JSON.parse(evenddata).transfilename;
            const transfilesize = JSON.parse(evenddata).transfilesize;
            const transfileprogress = JSON.parse(evenddata).transprogress;
            const f = JSON.stringify({ transfilename: transfilename, transfilesize: transfilesize, transfileprogress: transfileprogress, type: 'transfile' });

            sendMessageToClient('transfilews', f); //每秒推送给前端  

        }
        if (localdevstatus == "accept") {
            const a = JSON.stringify({ localreqlinknames: localdevreqname, localreqlinkip: localreqlinkip, localreqlinkport: localreqlinkport, status: localdevstatus });

            sendMessageToClient('frontws', a); //每秒推送给前端  

        }
        else if (localdevstatus == "reject") {
            console.log("断开连接");
            const b = JSON.stringify({ localreqlinknames: localdevreqname, status: localdevstatus });

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
        nameToWsMap.set(connectDeviceIp, fromws)
        wsToNameMap.set(fromws, connectDeviceIp)
        connectdevice.push({ devicename: connectDeviceIp, end: 'c' });
        fromws.on('open', () => {
            fromws.send(JSON.stringify({
                reqlinkname: ip,
                reqlinkip: ip,
                reqlinkport: port
            }))
        }); //写明身份
        fromws.addEventListener('message', (event) => {
            const wsdata = event.data;
            const jsonwsdata = JSON.parse(wsdata); // 接收到对方的连接
            const reqlinknames = jsonwsdata.reqlinkname;
            //当服务端主动断开调用

            if (jsonwsdata.status == "reject") {
                wstoef.send(JSON.stringify({ localreqlinknames: reqlinknames, status: 'reject' })); //将接受的设备名 推送前端efws
            }

            if (jsonwsdata.status == "connected") {
                res.status(200).json({ LinkStatus: "connectok" }); // 发给我的前端验证 

            }
        });

        fromws.on('error', function error(err) {
            console.error('mywsWebSocket error: ', err);
        });


    }
    else if (connectStatus == "close") {


        const wsinstance = nameToWsMap.get(connectDeviceIp);
        if (wsinstance && wsinstance.readyState === WebSocket.OPEN) {
            try {
                console.log(connectdevice);
                if (connectdevice.find(client => client.devicename === connectDeviceIp && client.end === 's')) {

                    wsinstance.send(JSON.stringify({
                        reqlinkname: ip,
                        status: 'reject'
                    })); //当服务端主动断开的时候有用 作为服务端时暂无作用 但是消息也发过去了

                }

                setTimeout(() => {
                    wsinstance.close();
                    nameToWsMap.delete(connectDeviceIp);
                }, 100);


                res.status(200).json({ LinkStatus: "closeok" });

            } catch (error) {
                console.error("发送断开消息失败:", error);
                wsinstance.close();
                nameToWsMap.delete(connectDeviceIp);
                res.status(200).json({ LinkStatus: "closeok" });
            }
        } else {
            wstoef.send(JSON.stringify({
                localreqlinknames: connectDeviceIp,
                status: 'reject'
            }));
            res.status(404).json({ error: "No active connection found" });

        }
    }


});









// 启动 Express 服务器
servers = app.listen(port, ip, () => {
    console.log(`node open Server is running at http://${ip}:${port}`);
});


const wstoef = new WebSocket('ws://127.0.0.1:33456/?userId=ws'); //建立前后端的连接实例
const ws = new WebSocket.Server({ server: servers })
const fileBuffers = {}; // file buffer array

// 本机对外的node ws接口 在ip：端口
ws.on('connection', (ws) => {

    ws.on('message', (event) => {
        console.log("收到对方的ws");
        const eventdata = event.toString()
        const reqlinknames = JSON.parse(eventdata).reqlinkname;
        const reqlinkip = JSON.parse(eventdata).reqlinkip;
        const reqlinkport = JSON.parse(eventdata).reqlinkport;

        const reqlinktype = JSON.parse(eventdata).type; // 消息类型 clipboard or filetrans

        const clipboarddata = JSON.parse(eventdata).content;

        if (reqlinktype == "clipboard") {
            clipboardLink.set(reqlinknames, ws);
            wstoef.send(JSON.stringify({ localreqlinknames: reqlinknames, localreqlinkip: reqlinkip, localreqlinkport: reqlinkport, type: 'clipboard', content: clipboarddata })); //将接受的设备名 推送前端efws
            console.log("发送剪切板数据给efws");
        }
        else if (reqlinktype == "transfile") {
            console.log("收到对方的file ws");

            const filemetadata = JSON.parse(eventdata).metadata;

            const currentChunk = filemetadata.currentChunk;
            const currentFileName = filemetadata.fileName;
            const currentFileSize = filemetadata.fileSize;
            const currentFileType = filemetadata.fileType;
            const currentFilelasttime = filemetadata.filelastModifiedDate
            const filechunk = Buffer.from(JSON.parse(eventdata).chunks, "base64");

            const fileprogress = Math.round(((currentChunk + 1) / filemetadata.chunkNum) * 100);
            wstoef.send(JSON.stringify({ type: "transfile", transfilename: currentFileName, transfilesize: currentFileSize, transprogress: fileprogress })); //将文件数据发送
            // transfiletype: currentFileType, transfiletime: currentFilelasttime

            if (!fileBuffers[currentFileName]) {

                fileBuffers[currentFileName] = { cn: filemetadata.chunkNum, ck: [] };

            }

            fileBuffers[currentFileName].ck[currentChunk] = filechunk;

            ws.send(JSON.stringify({ type: 'ack', chunk: currentChunk + 1 }));


            if (fileBuffers[currentFileName].ck.length == fileBuffers[currentFileName].cn) {

                const fileData = Buffer.concat(fileBuffers[currentFileName].ck);
                fs.writeFileSync(`../../save/files/${currentFileName}`, fileData);
                console.log(`${currentFileName} 上传完成`);

            }

        }

        else if (reqlinktype == undefined) {
            wsToNameMap.set(ws, reqlinknames);
            nameToWsMap.set(reqlinknames, ws);
            nameToWsMap.get(reqlinknames).send(JSON.stringify({ status: 'connected', devicename: reqlinknames })); //连接成功返回到对面                               

            connectdevice.push({ devicename: reqlinknames, end: 's' });
        }


        if (reqlinknames && lastcconnectdevice != connectdevice) {
            console.log("发送数据给efws");
            wstoef.send(JSON.stringify({ localreqlinknames: reqlinknames, localreqlinkip: reqlinkip, localreqlinkport: reqlinkport, status: 'accept' })); //将接受的设备名 推送前端efws
        }






    });

    // 当客户端端主动断开触发
    ws.on('close', () => {
        const deviceName = wsToNameMap.get(ws);
        if (deviceName) {
            wstoef.send(JSON.stringify({ localreqlinknames: deviceName, status: 'reject' })); //将接受的设备名 推送前端efws
            // 清理映射
            wsToNameMap.delete(ws);
            nameToWsMap.delete(deviceName);
        }

        connectdevice = connectdevice.filter(client => client.devicename !== deviceName);
    });
    ws.on('error', function error(err) {
        console.error('ws error: ', err);

        const deviceName = wsToNameMap.get(ws);
        if (deviceName) {
            wstoef.send(JSON.stringify({
                localreqlinknames: deviceName,
                status: 'reject'
            }));

            // 清理映射
            wsToNameMap.delete(ws);
            nameToWsMap.delete(deviceName);
            connectdevice = connectdevice.filter(client => client.devicename !== deviceName);
        }
    });
});





app.get('/', (req, res) => {
    res.send("link......")
});