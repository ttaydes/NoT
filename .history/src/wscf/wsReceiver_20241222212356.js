const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();

const port = 3345;
const address = '127.0.0.1';

app.use(cors());


const ws = new WebSocket("ws://127.0.0.1:33451/wsfe");
socket.addEventListener('message', (event) => {
    console.log('Message from server: ', event.data);

});