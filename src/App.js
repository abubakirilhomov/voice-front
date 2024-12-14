import React, { useRef, useState, useEffect } from "react";
import io from "socket.io-client";

const VoiceChat = () => {
  const [users, setUsers] = useState([]); // Connected users
  const [localStream, setLocalStream] = useState(null); // Local media stream
  const [remoteStream, setRemoteStream] = useState(null); // Remote media stream
  const [target, setTarget] = useState(null); // Target user to connect with

  const socket = useRef(null);
  const peerConnection = useRef(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }, // Public STUN server
    ],
  };

  useEffect(() => {
    // Initialize Socket.IO connection
    socket.current = io("https://voice-server-qsaq.onrender.com");

    // Receive connected users
    socket.current.on("users", (connectedUsers) => {
      setUsers(connectedUsers.filter((u) => u.id !== socket.current.id)); // Exclude self
    });

    // Handle incoming signal
    socket.current.on("signal", async ({ sender, signal }) => {
      if (signal.type === "offer") {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.current.emit("signal", { target: sender, signal: answer });
      } else if (signal.type === "answer") {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal));
      }
    });

    // Get user media
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        setLocalStream(stream);
      })
      .catch((err) => console.error("Error accessing media devices:", err));

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const startConnection = (targetId) => {
    setTarget(targetId);

    // Create PeerConnection
    peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream to the connection
    localStream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream);
    });

    // Handle remote stream
    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("signal", {
          target: targetId,
          signal: event.candidate,
        });
      }
    };

    // Create an offer
    peerConnection.current
      .createOffer()
      .then((offer) => {
        return peerConnection.current.setLocalDescription(offer);
      })
      .then(() => {
        socket.current.emit("signal", {
          target: targetId,
          signal: peerConnection.current.localDescription,
        });
      })
      .catch((err) => console.error("Error creating offer:", err));
  };

  return (
    <div>
      <h1>Voice Chat</h1>
      <h2>Connected Users</h2>
      {users.map((user) => (
        <button key={user.id} onClick={() => startConnection(user.id)}>
          Call User {user.id}
        </button>
      ))}

      <h2>Local Audio</h2>
      {localStream && <audio autoPlay muted ref={(ref) => ref && (ref.srcObject = localStream)} />}

      <h2>Remote Audio</h2>
      {remoteStream && <audio autoPlay ref={(ref) => ref && (ref.srcObject = remoteStream)} />}
    </div>
  );
};

export default VoiceChat;
