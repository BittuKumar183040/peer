import "./styles/App.css";
import { useState, useRef } from "react";
import Peer from "simple-peer";

const P2PVideoChat = () => {
  const [signalData, setSignalData] = useState(""); // For sharing signaling data
  const [isConnected, setIsConnected] = useState(false); // Connection status

  const myVideoRef = useRef();
  const peerVideoRef = useRef();
  const connectionRef = useRef();

  const startStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    myVideoRef.current.srcObject = stream;
    return stream;
  };

  const createPeerConnection = async (initiator) => {
    const stream = await startStream();
    const peer = new Peer({
      initiator,
      trickle: false, // Disable trickling to simplify data exchange
      stream,
    });

    peer.on("signal", (data) => {
      setSignalData(JSON.stringify(data)); // Output signal data to share
    });

    peer.on("stream", (peerStream) => {
      peerVideoRef.current.srcObject = peerStream;
    });

    peer.on("connect", () => {
      setIsConnected(true);
    });

    connectionRef.current = peer;
  };

  const handleReceiveSignal = () => {
    const parsedData = JSON.parse(signalData);
    connectionRef.current.signal(parsedData);
  };

  return (
    <div className=" m-4">
      <h1 className=" w-full text-center mb-2">P2P Video Chat</h1>
      <hr />
      <div className=" flex gap-6 my-10">
        <div className=" relative bg-slate-400">
          <video ref={peerVideoRef} autoPlay style={{ width: "300px" }} />
          <div className=" absolute top-0 left-0 bg-white rounded-sm px-4">
            <p>Other</p>
          </div>
        </div>
        <div className=" relative">
          <video
            ref={myVideoRef}
            autoPlay
            muted
            style={{ width: "100px", height: "100px" }}
          />
          <div className=" absolute top-0 left-0 bg-white rounded-sm px-4">
            <p>Self</p>
          </div>
        </div>
      </div>
      <div>
        {!isConnected ? (
          <>
            <div className=" flex gap-6">
              <button
                className=" p-2 bg-slate-500 rounded-md text-white px-6"
                onClick={() => createPeerConnection(true)}
              >
                Create Connection
              </button>
              <button
                className=" p-2 bg-slate-500 rounded-md text-white px-6"
                onClick={() => createPeerConnection(false)}
              >
                Join Connection
              </button>
            </div>
            <div className=" flex gap-5 flex-col">
              <textarea
                placeholder="Signal Data (paste here to connect)"
                value={signalData}
                onChange={(e) => setSignalData(e.target.value)}
                style={{ width: "100%", height: "100px" }}
              />
              <button
                className=" p-2 px-8 bg-gray-300 w-fit rounded-md text-black shadow-md border border-black"
                onClick={handleReceiveSignal}
              >
                Submit Signal
              </button>
            </div>
          </>
        ) : (
          <p>Connected to Peer!</p>
        )}
      </div>
      {signalData && (
        <div>
          <p>Share this Signal Data with your Peer:</p>
          <textarea
            readOnly
            value={signalData}
            style={{ width: "100%", height: "100px" }}
          />
        </div>
      )}
    </div>
  );
};

export default P2PVideoChat;
