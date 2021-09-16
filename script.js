// создали инстанс пир конекшена
const peerConnection = new RTCPeerConnection();
// создали data channel с помощью которого мы обмениваемся сообщениями
const dataChannel = peerConnection.createDataChannel('test');
//добавим два ивента лисенера на этот канал
// сработает когда канал будет открыт для связи
dataChannel.onopen = () => console.log('Channel open');
// срабаетвает каждый раз при получнеии сообщения
dataChannel.onmessage = e => console.log('Message', e.data);
// после того как мы создали dataChannel и настроили его
// добавим метод onicecandidate срабатывающий каждый раз когда появится новый кандидат при подключении
// в е получает все данные о клиенте к которому хочет подключиться
// и мы должны отправить другой стороне
// должны отправить другой стороне тому к кому хотим подключиться
// но здесь мы залогаем локал дескрипшн, те данные уоторые хотим передавать
peerConnection.onicecandidate = e => console.log('icecandidate',
JSON.stringify(peerConnection.localDescription));
// создадим офер на подключение к другому браузеру
const offer = await peerConnection.createOffer();
// установим его в наш локал дескрипшн
peerConnection.setLocalDescription(offer);

// во втором браузере

const peerConnection = new RTCPeerConnection();
const offer = {скопировать данные из браузера 1}
const offer = {"type":"offer","sdp":"v=0\r\no=- 4226888108038737788 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=candidate:111704799 1 udp 2113937151 dd416234-74d5-454d-9af4-340d7728414e.local 58057 typ host generation 0 network-cost 999\r\na=ice-ufrag:it+J\r\na=ice-pwd:lQSDLXbOcH6TdzvwvLWEs5Ic\r\na=ice-options:trickle\r\na=fingerprint:sha-256 26:EF:EA:83:71:B5:08:52:04:95:08:03:13:99:14:99:39:7F:6F:EB:AC:0D:49:EE:4C:3B:19:7A:89:14:2A:AE\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n"};

// после этого нам надо будет также реагировать на нового кандидата
peerConnection.onicecandidate = e => console.log('icecandidate',
JSON.stringify(peerConnection.localDescription));

peerConnection.setRemoteDescription(offer);
//Отреагируем еа изменее dataChannel
let dataChannel;
// на имзенение дата канала
peerConnection.ondatachannel = event => {
  dataChannel = event.channel;
  dataChannel.onopen = () => console.log('Channel opened!');
  dataChannel.onmessage = e =>console.log('Message', e.data);
}

// Создадим ответ другой стороне
const answer = await peerConnection.createAnswer();
peerConnection.setLocalDescription(answer);

// передаем ансвер другой стороне


// в браузере 1
const answer  = {"type":"answer","sdp":"v=0\r\no=mozilla...THIS_IS_SDPARTA-91.0.2 4873944169122736428 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=sendrecv\r\na=fingerprint:sha-256 D8:62:95:70:CF:75:7A:BF:6C:B1:F8:F0:1A:E6:D1:49:1B:F4:D2:27:34:09:AD:AC:5E:A0:BE:95:6B:AB:6F:AC\r\na=group:BUNDLE 0\r\na=ice-options:trickle\r\na=msid-semantic:WMS *\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=candidate:0 1 UDP 2122252543 796da4e1-dde2-4f65-9186-19b1e565df32.local 60621 typ host\r\na=candidate:1 1 TCP 2105524479 796da4e1-dde2-4f65-9186-19b1e565df32.local 9 typ host tcptype active\r\na=sendrecv\r\na=end-of-candidates\r\na=ice-pwd:15e34f9b98bcb70e5c54326d0472d9e3\r\na=ice-ufrag:d014718b\r\na=mid:0\r\na=setup:active\r\na=sctp-port:5000\r\na=max-message-size:1073741823\r\n"}

peerConnection.setRemoteDescription(answer);
