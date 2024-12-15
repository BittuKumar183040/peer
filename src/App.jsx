import './styles/App.css';
import { useState, useRef } from 'react';
import Peer from 'simple-peer';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const selfVideo = useRef();
  const otherVideo = useRef();
  const connectionRef = useRef();
  const [signalData, setSignalData] = useState('');

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      selfVideo.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.log(err);
    }
  };

  const createPeerConnection = async (initiator) => {
    const stream = await startStream();
    const peer = new Peer({
      initiator,
      trickle: false,
      stream,
    });

    peer.on('signal', (data) => {
      setSignalData(JSON.stringify(data));
    });

    peer.on('stream', (otherStream) => {
      otherVideo.current.srcObject = otherStream;
    });

    peer.on('connect', () => {
      setIsConnected(true);
      console.log('Connected');
    });

    connectionRef.current = peer;
  };

  const handleReceiveSignal = () => {
    const parsedData = JSON.parse(signalData); // Parse the input signaling data
    connectionRef.current.signal(parsedData); // Signal the peer
  };

  return (
    <div id="parentDiv" className=" flex flex-col gap-5 m-4">
      <div className=" flex gap-3">
        <div className=" h-full w-96">
          <video autoPlay muted ref={otherVideo} />
        </div>
        <div className=" h-full w-32 bg-slate-300">
          <video autoPlay muted ref={selfVideo} />
        </div>
      </div>
      {!isConnected ? (
        <div className=" ">
          <div className=" flex gap-4">
            <button
              onClick={() => {
                createPeerConnection(true);
              }}
              className=" p-2 bg-slate-300 rounded-md px-8 w-fit h-fit shadow-md "
            >
              Connect
            </button>
            <button
              onClick={() => {
                createPeerConnection(false);
              }}
            >
              Join
            </button>
          </div>
          <textarea
            placeholder="Signal Data (paste here to connect)"
            value={signalData}
            onChange={(e) => setSignalData(e.target.value)}
            style={{ width: '100%', height: '100px' }}
          />
          <button onClick={handleReceiveSignal}>Submit Signal</button>
        </div>
      ) : (
        <p>Connected to Peer!</p>
      )}
    </div>
  );
}

export default App;
