import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ setSelfVideo, otherVideo }) => {
  const selfVideo = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        selfVideo.current.srcObject = stream;
        setSelfVideo(stream);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className=" flex gap-3">
      <div className=" h-full w-96">
        <video autoPlay muted ref={otherVideo} />
      </div>
      <div className=" h-full w-32 bg-slate-300">
        <video autoPlay muted ref={selfVideo} />
      </div>
    </div>
  );
};

export default VideoPlayer;
