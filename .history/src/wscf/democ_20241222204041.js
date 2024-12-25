const socket = new WebSocket('ws://localhost:3000');

// 打开连接
socket.addEventListener('open', () => {
    console.log('Connected to WebSocket server');
    socket.send('Hello, Server!');
});

// 接收消息
socket.addEventListener('message', (event) => {
    console.log('Message from server: ', event.data);
});
