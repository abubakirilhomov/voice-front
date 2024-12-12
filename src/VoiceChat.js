import React, { useRef, useEffect } from "react";
import { io } from "socket.io-client";

const VoiceChat = () => {
  const socket = useRef(null);
  const localStream = useRef(null);
  const peerConnections = useRef({});

  useEffect(() => {
    // Подключение к серверу
    socket.current = io("https://voice-server-qsaq.onrender.com");

    // Получение локального аудио
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      localStream.current = stream;

      // Воспроизведение локального аудио (опционально)
      const audioElement = document.createElement("audio");
      audioElement.srcObject = stream;
      audioElement.play();

      // Обработка подключения новых пользователей
      socket.current.on("user-connected", ({ userId }) => {
        if (!peerConnections.current[userId]) {
          const peer = new RTCPeerConnection();
          peerConnections.current[userId] = peer;

          // Добавляем треки
          stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
          });

          // Обработка ICE-кандидатов
          peer.onicecandidate = (event) => {
            if (event.candidate) {
              socket.current.emit("signal", {
                target: userId,
                signal: event.candidate,
              });
            }
          };

          // Получение и воспроизведение потоков других пользователей
          peer.ontrack = (event) => {
            const remoteAudio = document.createElement("audio");
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.play();
          };

          // Создание offer
          peer.createOffer().then((offer) => {
            peer.setLocalDescription(offer);
            socket.current.emit("signal", {
              target: userId,
              signal: offer,
            });
          });
        }
      });

      // Обработка сигналов
      socket.current.on("signal", async ({ sender, signal }) => {
        if (!peerConnections.current[sender]) {
          const peer = new RTCPeerConnection();
          peerConnections.current[sender] = peer;

          // Добавляем локальные треки
          stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
          });

          // Воспроизведение потоков других пользователей
          peer.ontrack = (event) => {
            const audioElement = document.createElement("audio");
            audioElement.srcObject = event.streams[0];
            audioElement.play();
          };

          // Обработка ICE-кандидатов
          peer.onicecandidate = (event) => {
            if (event.candidate) {
              socket.current.emit("signal", {
                target: sender,
                signal: event.candidate,
              });
            }
          };

          // Установка удалённого описания
          if (signal.type === "offer") {
            await peer.setRemoteDescription(new RTCSessionDescription(signal));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.current.emit("signal", {
              target: sender,
              signal: answer,
            });
          } else {
            peer.addIceCandidate(new RTCIceCandidate(signal));
          }
        }
      });

      // Обработка отключения пользователя
      socket.current.on("user-disconnected", ({ userId }) => {
        if (peerConnections.current[userId]) {
          peerConnections.current[userId].close();
          delete peerConnections.current[userId];
        }
      });
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  return <div>Voice Chat</div>;
};

export default VoiceChat;
