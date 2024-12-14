import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const App = () => {
  const socket = useRef(null);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [stream, setStream] = useState(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    // Подключение к серверу WebSocket
    socket.current = io("http://localhost:5000"); // Укажите ваш сервер

    // Получение списка пользователей
    socket.current.on("users", (userList) => {
      setUsers(userList);
    });

    // Обработка сигналов WebRTC
    socket.current.on("signal", async ({ sender, signal }) => {
      if (!peerConnection.current) {
        createPeerConnection(sender);
      }

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(signal)
      );

      if (signal.type === "offer") {
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.current.emit("signal", {
          target: sender,
          signal: peerConnection.current.localDescription,
        });
      }
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const createPeerConnection = (target) => {
    peerConnection.current = new RTCPeerConnection();
    stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("signal", {
          target,
          signal: event.candidate,
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      const remoteAudio = document.getElementById("remote-audio");
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.play();
    };
  };

  const startCall = async (target) => {
    if (!peerConnection.current) {
      createPeerConnection(target);
    }

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.current.emit("signal", {
      target,
      signal: offer,
    });
  };

  const selectUser = (user) => {
    setCurrentUser(user);
    if (!stream) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((localStream) => {
        setStream(localStream);
        const localAudio = document.getElementById("local-audio");
        localAudio.srcObject = localStream;
        localAudio.play();
      });
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Список пользователей */}
      <div style={{ flex: 1, borderRight: "1px solid #ccc", padding: "10px" }}>
        <h3>Пользователи</h3>
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => selectUser(user)}
            style={{
              cursor: "pointer",
              padding: "10px",
              backgroundColor: currentUser?.id === user.id ? "#f0f0f0" : "transparent",
            }}
          >
            {user.name || `Пользователь ${user.id}`}
          </div>
        ))}
      </div>

      {/* Кабинет пользователя */}
      <div style={{ flex: 2, padding: "10px" }}>
        {currentUser ? (
          <>
            <h3>Кабинет: {currentUser.name || `Пользователь ${currentUser.id}`}</h3>
            <button onClick={() => startCall(currentUser.id)}>Позвонить</button>
          </>
        ) : (
          <p>Выберите пользователя из списка</p>
        )}
      </div>

      {/* Аудио для локального и удалённого стримов */}
      <audio id="local-audio" style={{ display: "none" }}></audio>
      <audio id="remote-audio" style={{ display: "none" }}></audio>
    </div>
  );
};

export default App;
