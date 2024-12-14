import React, { useState } from "react";

const Register = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();

    // Базовая проверка на заполненность полей
    if (!name || !username || !password) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    // Отправка данных на сервер (замените URL на ваш API-эндпоинт)
    fetch("https://voice-server-qsaq.onrender.com/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, username, password }),
    })
      .then((response) => {
        if (response.ok) {
          alert("Регистрация прошла успешно!");
        } else {
          alert("Ошибка при регистрации");
        }
      })
      .catch((error) => {
        console.error("Ошибка:", error);
        alert("Произошла ошибка");
      });
  };

  return (
    <form className="w-full h-screen flex flex-col justify-center items-center" onSubmit={handleRegister}>
      <h2 className="text-3xl">Регистрация</h2>
      <div className="flex flex-col w-full max-w-[40%]">
        <label>Имя:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Введите имя"
          className="border-2 px-2 py-2 rounded"
        />
      </div>
      <div className="flex flex-col w-full max-w-[40%]">
        <label>Юзернейм:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Введите юзернейм"
          className="border-2 px-2 py-2 rounded"
        />
      </div>
      <div className="flex flex-col w-full max-w-[40%]">
        <label>Пароль:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введите пароль"
          className="border-2 px-2 py-2 rounded"
        />
      </div>
      <button className="btn btn-primary px-24 mt-10" type="submit">Зарегистрироваться</button>
    </form>
  );
};

export default Register;