var app = require('express')();
var http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});



http.listen(3000, () => {
    console.log('listening on *:3000');
  });

  const usersList = {}
  const roomsList = ['General']

  io.on('connection', (socket) => {  
    const handshakeData = socket.request;
    const username = handshakeData._query['user'];
    console.log(`New user logged in : ${username}`);
    if(!usersList[username]) {
        usersList[username] = socket.id;
        socket.join("General");
        io.sockets.emit('users-changed',Object.keys(usersList));
        io.sockets.emit('room-created', roomsList );
    }
    
    socket.on('disconnect', () => {
        delete usersList[username];
        io.sockets.emit('users-changed',Object.keys(usersList));
        console.log('user disconnected');
      });
    
    socket.on('check-user-exists', (username) => {
        socket[usersList[username]].emit("sup");
    })

    socket.on('message', (data) => {
        console.log(`Message sent: ${username}, ${ data.message }, ${data.room}`);
        io.sockets.to(data.room).emit('message-broadcast', {username: username, message: data.message , room: data.room});
    });

    socket.on('typing', (data) => {
        console.log(`User is typing: ${username}, ${ data.message }, ${data.room}`);
        io.sockets.to(data.room).emit('user-typing' , {username: data.username, typing: data.typing});
    });

    socket.on('create-room', function (room) {
        console.log(`Creating new room: ${room}`);
        if(!roomExists(room)) {
            roomsList.push(room);
            io.sockets.emit('room-created', roomsList );
        }
    });

    socket.on('join-room', function (room) {
        if(roomExists(room)) {
            socket.leaveAll();
            socket.join(room);
        }
    });
});

function roomExists(roomName) {
    if(roomsList.includes(roomName)) return true;
    return false;
}