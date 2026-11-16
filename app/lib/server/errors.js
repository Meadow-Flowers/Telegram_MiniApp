// Помилка з HTTP-кодом: сервер віддає її клієнту у вигляді { error: "текст", code }.
// code потрібен, коли інтерфейсу треба відрізнити випадок (наприклад, «limit» — вичерпано ліміт).
export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
