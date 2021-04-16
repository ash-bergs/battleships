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
io.on("connection", socket => {
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
    
    // tell the connecting client what player # they are 
    // this message is sent behind the scenes - but we can listen for it in our main program - app.js! //! see the app.js file, line 31
    socket.emit("player-number", playerIndex); 
    // basic syntax: socket.emit("message-title", data)
    //* .emit only communicates to the socket that connected 
    console.log(`Player ${playerIndex} has connected`); 
    
    // ignore player 3
    if (playerIndex === -1) return
    // this boolean indicates readiness - on start the player will not be ready (false)
    connections[playerIndex] = false; 
    
    // tell everyone what player number just connected 
    socket.broadcast.emit("player-connection", playerIndex); 
    //? .broadcast.emit broadcasts to all players
    //! see app.js where we receive the message in the startMultiPlayer() function, line 90

    // handle disconnections 
    socket.on("disconnect", () => {
        console.log(`Player ${playerIndex} disconnected`); 
        // reset connection
        connections[playerIndex] = null; 
        // tell everyone what player num just disconnected 
        socket.broadcast.emit("player-connection", playerIndex);
    })

    // handle playerReady 
    // in playGameMulti in app.js we're emitting a message when a user indicates they're ready to begin the game, //! line 373
    // here we're handling what happens when the message is emitted 
    socket.on("player-ready", () => {
        // remember, socket.emit only transmits locally, .broadcast.emit is needed to broadcast to all players 
        socket.broadcast.emit("enemy-ready", playerIndex); 
        connections[playerIndex] = true; 
    })

    // check player connections 
    socket.on("check-players", () => {
        const players = []; 
        for (const i in connections) {
            // at this point the connections array will hold two boolean values (that are updated when a user indicates they're ready and have placed all ships)
            connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]}); 
        }
        socket.emit("check-players", players); 
    })
})

