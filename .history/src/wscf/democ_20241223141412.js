const ws = new WebSocket('ws://localhost:8877');

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
