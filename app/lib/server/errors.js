// Помилка з HTTP-кодом: сервер віддає її клієнту у вигляді { error: "текст" }.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
