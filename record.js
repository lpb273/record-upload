

let recorder = null;
let stream = null;
let socket = null;
let requestQueue = [];
let responseQueue = [];

(async function initRecord() {
  stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
  recorder = new RecordRTCPromisesHandler(stream, {
    type: 'video',
    timeSlice: 1000,
    ondataavailable: function(blob) {
      requestQueue.push({
        id: requestQueue.length,
        data: blob
      });
      socket.send(requestQueue[requestQueue.length-1]);
    },
  });
  if(recorder) {
    socketIoClient();
  } else {
    throw new Error('recorder不存在');
  }
})();

function startRecord() {
  recorder.startRecording();
}

async function stopRecord() {
  await recorder.stopRecording(async () => {
    let blob = await recorder.getBlob();
    invokeSaveAsDialog(blob);
  });
}

function socketIoClient() {
  socket = new WebSocket("ws://127.0.0.1:3000");
  socket.onopen = function () {
    console.warn('connect');
  }
  socket.onclose = function() {
    console.warn('disconnect');
    recorder = null;
    stream = null;
    socket = null;
    requestQueue = [];
    responseQueue = [];
  };
  socket.onmessage = function(ev) {
    responseQueue.push(ev.data);
    console.warn(responseQueue.sort())
  };
}