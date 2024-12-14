import React, { useState } from "react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Базовая проверка на заполненность полей
    if (!username || !password) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    // Отправка данных на сервер (замените URL на ваш API-эндпоинт)
    fetch("https://voice-server-qsaq.onrender.com/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        if (response.ok) {
          alert("Вход выполнен успешно!");
        } else {
          alert("Неверные данные для входа");
        }
      })
      .catch((error) => {
        console.error("Ошибка:", error);
        alert("Произошла ошибка");
      });
  };

  return (
    <form className="w-full h-screen flex flex-col justify-center items-center" onSubmit={handleLogin}>
      <h2 className="text-3xl">Вход</h2>
      <div className="flex flex-col w-full max-w-[30%]">
        <label>Юзернейм:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Введите юзернейм"
          className="py-2 px-2 border-2 rounded"
        />
      </div>
      <div className="flex flex-col w-full max-w-[30%]">
        <label>Пароль:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введите пароль"
          className="py-2 px-2 border-2 rounded"
        />
      </div>
      <button className="btn btn-primary px-24 mt-10" type="submit">Войти</button>
    </form>
  );
};

export default Login;