import freeice from 'freeice';

import {useState, useEffect, useRef, useCallback} from 'react';

import socket from '../socket';
import useStateWithCallback from './useStateWithCallback';
const ACTIONS = require('../socket/actions');

// создадим id нашего пользователя
export const LOCAL_VIDEO = 'LOCAL_VIDEO';

export default function useWebRTC(roomID){

  const [clients, updateClients] = useStateWithCallback([]); // все доступные клиенты
  // надо особый сет стейт c колбеком
  // надо реагировать на изменение стейта, изменения в  localMediaStream и  peerMediaElements
  // т.е когда новые пользователи надо мутировать этот объект

  // addNewClient функция как updateClients только с условием
  //то что у нас пользователя не будет в clients
  const addNewClient = useCallback((newClient, cb) => {
    // если в клиентах нет нового клиента
    // вызываем updateClients
    if(!clients.includes(newClient)){
      updateClients(list => [...list, newClient], cb);
    }
  }, [clients, updateClients]);

  // Все пир конекшены связынные с другими коннекшенами
  //так как коннекшн мутабельеый объект нельзя в стейт
  const peerConnections = useRef({});
  const localMediaStream = useRef(null); // ссылку на плеер/ видео элемент
  const peerMediaElements = useRef({
      [LOCAL_VIDEO] : null,
  }); // ссылка на все пир медиа элементы на страницы

 // логика ADD_PEER
 // для разделения логики добавим новый useEffect
  useEffect(() => {
    // что мы будем делатькогда добавится новый пир
    // извлекаем peerID createOffer
    // в каких то случаях надо создавать офер
    // в каких то нет
    async function handleNewPeer({peerID, createOffer}){
      // если пирid есть peerConnections (мы уже подключены)
      if(peerID in peerConnections.current) {
        return console.warn('Already connected to peer ' + peerID);
      };
      // если нет то создаем новый пир коннекшн
      peerConnections.current[peerID] = new RTCPeerConnection({
        // freeice пакет адресов бесплатных STUN серверов
        iceServers: freeice(),
      });
      // хендлим ивент onicecandidate
      // когда унас новый кандидат желает подключиться
      // мы сами создаем офер или ансфер
      peerConnections.current[peerID].onicecandidate = event => {
        // транслируем наши данные клиентам
        if (event.candidate){
          socket.emit(ACTIONS.RELAY_ICE, {
            peerID,
            iceCandidate: event.candidate,
          });
        }
      };

      // надо обработать ontrack
      // т.е когда к нам приходят новый трек мы извлекаем стримы
      let tracksNumber = 0;
      peerConnections.current[peerID].ontrack = ({streams: [remoteStream]}) => {
        tracksNumber++;
        // tracksNumber если нам пришло и видео и аудио
        if(tracksNumber === 2){
          addNewClient(peerID, () => {
            // добавляем remoteStream
            // мы начинаем транслировать ввидео элементе который создался для этого peerID
            // котороый нарисовался на нашей страничке этот remoteStream
            peerMediaElements.current[peerID].srcObject = remoteStream;
          });
        }
      };

      // берем localMediaStream и добавляем в peerConnections
      localMediaStream.current.getTracks().forEach(track => {
        peerConnections.current[peerID].addTrack(track, localMediaStream.current);
      });

      // если надо создавать оффер
      // т.е мы сторона которая подключилась

      if(createOffer){
        // создать оффер
        const offer = await peerConnections.current[peerID].createOffer();
        // установить его как setLocalSescriptions
        // АВТОМАТИЧЕСКИ СРАБОТАЕТ onicecandidate
        // отправит на сервер то что желает подключиться новый кандидат
        // а также отправяться SDP данные
        // они добавились здесь: localMediaStream.current.getTracks().forEach(track => {...
        await peerConnections.current[peerID].setLocalDescription(offer);
        // отправить этот оффер (SDP данные)
        socket.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: offer,
        });
      }

    };
    socket.on(ACTIONS.ADD_PEER, handleNewPeer);
  }, []);

  // реагируем на поступление новой сессии и iceCandidate на клиенте
  // SESSION_DESCRIPTION и RELAY_ICE

  //1. SESSION_DESCRIPTION
  useEffect(() => {
    //setRemoteMedia
    //получает peerID
    async function setRemoteMedia({peerID, sessionDescription: remoteDescription}) {
      // и устанавливает remoteDescription
      await peerConnections.current[peerID].setRemoteDescription(
        // конмтруктор для поддержки браузеров
        new RTCSessionDescription(remoteDescription)
      );

      if(remoteDescription.type === 'offer') {
        // создаем ответ
        const answer = await peerConnections.current[peerID].createAnswer();
        // установить setLocalDescription
        await peerConnections.current[peerID].setLocalDescription(answer);
        // переслать опять на RELAY_SDP
        socket.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: answer,
        });
      }
    }

    socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
  }, []);

  //2. RELAY_ICE
  useEffect(() => {
    socket.on(ACTIONS.ICE_CANDIDATE, ({peerID, iceCandidate}) => {
      peerConnections.current[peerID].addIceCandidate(
        new RTCIceCandidate(iceCandidate)
      )
    });
  }, []);

  // эффект при отключении от комнаты
  // нужно остановить видео и удалить кандидатов

  useEffect(() =>{
    const handleRemovePeer = ({peerID}) => {
      // если peerID есть
      // тогда мы его закрываем
      if(peerID in peerConnections.current[peerID]) {
        peerConnections.current[peerID].close();
      }
      // и удаляем
      delete  peerConnections.current[peerID];
      delete  peerMediaElements.current[peerID];
      // вызываем updateClients не тот с колбеком а напрямую из useStateWithCallback
      updateClients(list => list.filter(client => client !== peerID));
    };

    socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer);
  }, []);


// реагируем на изменение комнаты и делаем следующее
  useEffect(() => {
      // здесь логика
      // начинаем захват экрана
      async function startCapture() {
        // захватим наш медиа контент
        localMediaStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: 1280,
            height: 720,
          }
        });

          // поле захвата экрана
          // вызовим  addNewClient
          // и реагируем колбеком т.е что будет после добавления нового клиента
          // он трендериться
          // внутри рендера мы запишем в список peerMediaElements с ключом LOCAL_VIDEO
        addNewClient(LOCAL_VIDEO, () => {
          // достанем LOCAL_VIDEO
          const localVideoElement = peerMediaElements.current[LOCAL_VIDEO]; // html тег видео
          // если такой есть установим громкость 0
          //
          if(localVideoElement) {
            localVideoElement.volume = 0;
            // тот localMediaStream который мы захватили с камерыимикрофона
            // мы передаем навидео элемент который мы отрисовали
            // (добавили всписок клиентов он добавится в
            // const [clients, updateClients] = useStateWithCallback([]);)
            // и мы отреагируем на него внутри нашего компонента Room
            localVideoElement.srcObject = localMediaStream.current;
          }
        });
      }
      startCapture()
      // вызываем сокет  совершаем экшн
        .then(() => socket.emit(ACTIONS.JOIN, {room: roomID})) // захват экрана
          .catch(e => console.error('Error getting userMedia', e));


          // логика выхода
          // когдакмпонент демонтируется
    return () => {
      localMediaStream.current.getTracks().forEach(track => track.stop());
      socket.emit(ACTIONS.LEAVE);
    }


  }, [roomID]);

    // принимает id и html элемент
    // добавлять в peerMediaElements эту ноду
  const provideMediaRef = useCallback((id, node) => {
    peerMediaElements.current[id] = node;
  }, [])

  return {clients, provideMediaRef};
}
