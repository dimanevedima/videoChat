const path = require('path');
const express = require('express');
const {version, validate} = require('uuid');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {cors:{origin:"*"}});

const ACTIONS = require('./src/socket/actions');
const PORT = process.env.PORT || 3001;



// список всех комнат
function getClientRooms(){
  const {rooms} = io.sockets.adapter; //список всех комнат
  //rooms это map
  // по дефолту сокет подключен к комнате с уникальным id
  // мы эти комнаты отсеиваем проверяя на v4 (генерацию id)
  // дефолтные показываться не будут
  return Array.from(rooms.keys()).filter(roomID => validate(roomID) && version(roomID) === 4);
//  return Array.from(rooms.keys());
};

// все клиенты будут знать о всех комнатах
// при подключении мы будем делиться о инфе комнат
// всем сокетам отправлять в случае добавления комнаты
function shareRoomsInfo() {
  io.emit(ACTIONS.SHARE_ROOMS, {
    rooms: getClientRooms()
  });
};

io.on('connection', socket => {
  console.log(socket.id);
  // const a = {
  //   name: 'Dima',
  //   age: 13
  // };
  // const {age: dimaAge} = a;
  // console.log(dimaAge); // 13
  shareRoomsInfo(); // при подключении будем шарить со всеми сокетами инфо о комнатах

  socket.on(ACTIONS.JOIN, config => { // когда пользователь будет присоединяться
    const {room: roomID} = config; // достаем room
    const {rooms: joinedRooms} = socket;
    // будем смотреть на те комнаты где есть уже наш сокет
    if(Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`);
    };
    // если не подключены получаем всех клиентов комнаты
    const cliens = Array.from(io.sockets.adapter.rooms.get(roomID) || []);
    cliens.forEach(clientID => {
      // каждому из клиентов отправляем наш экшн
      io.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: socket.id,
        createOffer: false  // не нужно создавать offer
      });
      // сокету отправляем id  всех клиентов
      socket.emit(ACTIONS.ADD_PEER, {
        peerID: clientID,
        createOffer: true
      });
      // так как только одна сторона должна создавать оффер будет создавать
      // та сторона которая подключается к комнате
    });
    // подключаемся к этой комнате
    socket.join(roomID);
    // делимся инфой о всех комнатах
    shareRoomsInfo();
  });

  function leaveRoom(){
    const {rooms} = socket; // все комнаты из текущего сокета

    Array.from(rooms)
        .forEach(roomID => {
          // все клиенты в этой комнате
          const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);
          // кажжому клиенту отправим экшн
          // чтоы он отключил этого пользователя
            clients.forEach(clientID => {
              io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
                peerID: socket.id,
              });
              // текущему сокету отправим ивент
              // самому себе отправим id клиентов
              socket.emit(ACTIONS.REMOVE_PEER, {
                peerID: clientID,
              });
            });
            // покинуть комнату
            socket.leave(roomID);
        });

        shareRoomsInfo();
  };
  // логика выхода из комнаты
  socket.on(ACTIONS.LEAVE, leaveRoom);
  socket.on('disconnecting', leaveRoom);
  // это была логика по комнатам

  // теперь логика SDP экшенов
  // когда приходит ice кандидат
  socket.on(ACTIONS.RELAY_ICE, ({peerID, iceCandidate}) => {
    // отправляем пиру 
    io.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
      peerID: socket.id,
      iceCandidate,
    });
  });
  // когда приходят стримы
  // когда приходят SDP данные мы получаем peerID и sessionDescription
  socket.on(ACTIONS.RELAY_SDP, ({peerID, sessionDescription}) => {
    // мы конкретному сокету отправляем Event SESSION_DESCRIPTION
    // он отправляется от нам (текущего пира)
    io.to(peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerID: socket.id,
      sessionDescription,
    });
  });

  // socket.on(ACTIONS.SHARE_ROOMS, () => {
  //   console.log('ОБНОВЛЕНИЕ!');
  //   socket.emit(ACTIONS.SHARE_ROOMS, {
  //     rooms: getClientRooms()
  //   });
  // })

});

server.listen(PORT, () => {
  console.log('Сервер запущен!');
});
