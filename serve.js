const app = require('express')()
const httpServer = require("http").createServer(app);

const io = require("socket.io")(httpServer, {
  cors: true
});

app.get('/', function(req, res){
  res.send('<h1>Welcome Socket Server</h1>');
});

io.on("connection", (socket) => {
  socket.on("xdf", (data) => {
    socket.emit("xdf", {
      id: data.id,
      data: '我是转写内容'
    });
  });
  socket.on("disconnecting", (reason) => {
    socket.emit("xdf", reason);
  });
  socket.on("disconnect", reason => {
    socket.emit("xdf", reason);
  })
});

httpServer.listen(3000);