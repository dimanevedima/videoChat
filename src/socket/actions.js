const ACTIONS = {
  JOIN: 'join',   // присоединиться к комнате
  LEAVE: 'leave', // покинуть
  SHARE_ROOMS: 'share-rooms', // поделиться комнатами
  ADD_PEER: 'add-peer', // будем создавать новое соеднинение между клиентами
  REMOVE_PEER: 'remove-peer',
  RELAY_SDP: 'relay-sdp', // предача медиа
  RELAY_ICE: 'relay-ice', // передача физ подключений
  ICE_CANDIDATE: 'ice-candidate', // реагировать на это
  SESSION_DESCRIPTION: 'session-description' // использовать сессию которая придет
};

module.exports = ACTIONS; // чтобы работал и в ноде
