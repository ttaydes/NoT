// 假设你希望在 URL 中传递一个名为 `userId` 的标识符
const userId = '12345';  // 这个可以是用户的 ID、UUID 或其他标识符
const ws = new WebSocket(`ws://127.0.0.1:33456/userId=ws`);

// 连接成功后，向服务器发送消息
ws.onopen = () => {
    console.log('Connected to the server');
    ws.send('Hello, Server!');
};

// 接收到消息时的处理
ws.onmessage = (event) => {
    console.log('Received message from server:', event.data);
};

// 连接关闭时的处理
ws.onclose = () => {
    console.log('Connection closed');
};
