class SocketIoClient {
  constructor() {
    this.socket = null,
    this.currentInstance = null,
    this.requestDataQueue = [],
    this.responseDataQueue = []
  }
  init() {
    return new Promise(async (resolve,reject) => {
      this.socket = io("ws://127.0.0.1:3000/");
      if(this.socket) {
        await this.connect();
        resolve(this.currentInstance);
      } else {
        reject('error');
      }
    })
  }
  connect() {
    this.socket.on("connect", (socket) => {
      this.currentInstance = socket.handshake.headers;
    });
  }
  disconnect() {
    this.socket.on("disconnect", () => {
      console.log(socket.id);
    });
  }
  emit(data) {
    this.consumeQueue.push(data);
    this.socket.emit('xdf', this.consumeQueue.pop());
  }
  on(event) {
    socket.on(event, (arg1, arg2, arg3) => {
      console.log(arg1);
      console.log(arg2);
      console.log(arg3);
    });
  }
}

export default new SocketIoClient();