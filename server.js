const express = require('express'); 
const path = require('path'); 
// the Server class and all its functionality comes to us from the Node HTTP module, which is why we bring it in here 
const http = require('http'); 
const PORT = process.env.PORT || 5500; 
const socketio = require('socket.io'); 
const { Socket } = require('dgram');

const app = express(); 

// http module creates Server instance
const server = http.createServer(app); 

const io = socketio(server); 

// set the static folder to be served - the code we created in JS, HTML and CSS 
app.use(express.static(path.join(__dirname, "public"))); 

// start server 
server.listen(PORT, () => console.log(`Server running on ${PORT}`)); 

//* we're going to keep track of 2 connections (it's a 2 player game, after all) 
// a third person connection will have to wait, or play in single player mode 
const connections = [null, null]; 

// handle a socket connection request from web client
// in order to get a connection to socket server, we need to make modifications to the public files 
// specifically, we added this script tag to the index.html, below style tag => <script src="/socket.io/socket.io.js"></script> 
io.on('connection', socket => {
    // find an available player #
    let playerIndex = -1; 
    // looping through the available 2 connections
    for (const i in connections) {
        // if either of the 2 connections is null (initial state) (no player is occupying that 'slot')
        if (connections[i] === null){
            // assign the player index to whatever connections index was free 
            playerIndex = i; 
            // & break the loop
            break;
        }
        //* if there are no available connections, nothing will happen and playerIndex will remain -1 
    }

    // ignore player 3
    //* if playerIndex is still negative one, return from the function - we're not doing anything else 
    if (playerIndex === -1) return

    // tell the connecting client what player # they are 
    // basic syntax: socket.emit("message-title", data)
    // this message is sent behind the scenes - but we can listen for it in our main program - app.js! //! see the app.js file, line 31
    socket.emit("player-number", playerIndex); 

    console.log(`Player ${playerIndex} has connected`); 
})

