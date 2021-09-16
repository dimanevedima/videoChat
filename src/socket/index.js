import {io} from 'socket.io-client';

const  options = { // объект с настройками
  "force new connection": true,
  reconnectionAttempts: "Infinity", // чтобы веб сервер постоянно переподключался
  timeout: 10000,
  tranports: ["websocket"] // чтобы мог работать раздоменно
};

const socket = io('http://localhost:3001', options);

export default socket;
