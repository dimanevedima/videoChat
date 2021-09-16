import React from 'react';
import {useParams} from 'react-router';

import useWebRTC, {LOCAL_VIDEO} from '../../hooks/useWebRTC';

// разметка
// ['1', '2', '3', '4', '5'] => [['1','2'], ['3','4'], ['5']]
function layout(clientsNumber = 1) {
  const pairs = Array.from({length: clientsNumber})
      .reduce((acc, next, index, arr) => {
    if(index % 2 === 0){
       acc.push(arr.slice(index, index + 2));
    }
    return acc;
  }, []);

  const rowsNumber = pairs.length;
  const height = `${100/rowsNumber}%`;

  return pairs.map((row, index, arr) => {

    if(index === arr.length - 1 && row.length === 1){
      return [{
        width: '100%',
        height,
      }];
    }
    return row.map(() => ({
      width: '50%',
      height,
    }));
  }).flat();
};

export default function Room() {
  // когда пользователь заходит на страничку ROOM у него вызывается useParams
  // для получения id комнаты из url параметров
  // передаем id комнаты useWebRTC
  // там он захватывает экран и начинает его транслировать
  // добавляется новый клиент
  // на это реагирует рендер
  // он рисует один видео элемент
  // и внутри useWebRTC мы на localVideoElement отправляем наш сигнал из localMediaStream
  // localMediaStream свой видео элемент
  // т.е мы будем видеть сами мебя
  const {id: roomID} = useParams();
  // получем медиастримы включая себя с выкл звуком
  const {clients, provideMediaRef} = useWebRTC(roomID);
  console.log(clients);
  // отрендерим всех клиентов
  // тег video
  // autoPlay автопроизведение
  // playsInline автопроизведение на мобильныйх устройствах
  // muted если clientID равен LOCAL_VIDEO чтобы не двоилось
  // создали ref
  // provideMediaRef передаем туда clientId
  // provideMediaRef экспортируем из useWebRTC

  const videoLayout = layout(clients.length);
  return(
    <div style = {{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        height: '100vh'
      }}>
    {  clients.map((clientID, index) => {
        return (
          <div key = {clientID} style = {videoLayout[index]}>
              <video
                width = '100%'
                height = '100%'
                ref ={instance => {
                  provideMediaRef(clientID, instance)
                }}
                  autoPlay
                  playsInline
                  muted = {clientID === LOCAL_VIDEO}
                />
          </div>
        )
      })}
    </div>
  );
}
