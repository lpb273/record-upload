class RecorderSendBySocket {
  constructor(url) {
    this.socketUrl = url;
    this.recorder = null;
    this.stream = null;
    this.socket = null;
    this.requestQueue = [];
    this.responseQueue = [];
    this.initRecorder();
  }
  async initRecorder() {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    this.recorder = new RecordRTCPromisesHandler(this.stream, {
      type: 'video',
      timeSlice: 1000,
      ondataavailable: blob => {
        console.warn(blob)
        this.requestQueue.push({
          id: requestQueue.length,
          data: blob
        });
        this.emit();
      },
    });
    if(this.recorder) {
      this.initWebSocket();
    } else {
      throw new Error('recorder不存在');
    }
  }
  initWebSocket() {
    this.socket = new WebSocket(this.socketUrl);
    this.connect();
    this.on();
    this.disConnect();
  }
  connect() {
    this.socket.onopen = () => {
      console.warn('connect');
    }
  }
  disConnect() {
    this.socket.onclose = () => {
      this.recorder = null;
      this.stream = null;
      this.socket = null;
      this.requestQueue = [];
      this.responseQueue = [];
    }
  }
  emit() {
    console.warn('emit',this.requestQueue)
    this.socket.send(this.requestQueue[this.requestQueue.length-1]);
  }
  on() {
    this.socket.onmessage = ev => {
      this.responseQueue.push(ev.data);
      console.warn(this.responseQueue.sort())
    }
  }
  startRecord() {
    this.recorder.startRecording();
  }
  stopRecord() {
    this.recorder.stopRecording();
  }
  getResponseData() {
    return this.responseQueue;
  }
}