import {v4} from 'uuid'; // генерация уникальных id

import React, {useState, useEffect, useRef} from 'react';
import { useHistory } from "react-router-dom";

import socket from '../../socket';

const ACTIONS = require('../../socket/actions');

export default function Main() {
  // история 
  const history = useHistory();
  // логика на клиенте
  const [rooms, updateRooms] = useState([]);

  const rootNode = useRef();
  // при входе на страницу будем подписываться на ивент
  useEffect(() => {
    socket.on(ACTIONS.SHARE_ROOMS, ({rooms = []} = {}) => {
      if (rootNode.current){
        updateRooms(rooms);
      }
      //updateRooms(rooms);
      //console.log(rooms);
    });
    // socket.emit(ACTIONS.SHARE_ROOMS, ({rooms}) => {
    //     updateRooms(rooms);
    // })
  //  console.log(rooms);
    //console.log(socket);
  }, []);


  return(
    <div ref = {rootNode}>
      <h1>Available rooms</h1>

      <button onClick = {() => history.push(`/room/${v4()}`)}>Create New Room</button>

      <ul>
        {rooms.map(roomID => (
          <li key = {roomID}>
            {roomID}
            <button onClick = {() => history.push(`/room/${roomID}`)}>JOIN ROOM</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
