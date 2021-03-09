'use strict'

function init() {
// Provides a simple example of a game server that manages a game of tic-tac-toe.
// This server shows a simple communication pattern where moves pushed to the server 
// by one client update the state of the game and push the new state of the game
// out to all the other connected clients. 

// Set up the required packages. ws provides the WebSocket support, express
// provides the server and routing that allows serving up static resources.
const fs = require('fs');
const SocketServer = require('ws').Server;
const express = require('express');
const handlebars = require('express-handlebars');
const Game = require('../game-tictactoe').TicTacToeGame;
const gameRooms = new Map();

var rawTemplate = fs.readFileSync('./test.hbs', "utf8");
var processedTemplate = handlebars.compile(rawTemplate);


//init Express
var app = express();

//init the Express Router
var router = express.Router();
var port = process.env.PORT || 3000;

//tell the Express app to use the handlebars engine. hbs refers to the
//file extension of the handlebars templates, which is then mapped to the
//handlebars instance in the Express rendering engine.
app.set('view engine', 'hbs');
app.engine('hbs', handlebars({
    layoutsDir: __dirname + '/../../views/layouts',
    partialsDir: __dirname + '/../../views/partials',
    extname: 'hbs',
    defaultLayout: 'index',
}));

// Init the express router.  all files under the public folder will be served
// up by the express app router.
// e.g. http://localhost/client.html will serve up public/client.html
app.use("/", router);
app.use(express.static('public'));
app.use(express.urlencoded());

// Anything routed here goes to a specific game room. :gameName from the URL gets
// exposed in the request params. 
app.get("/game/:gameName", function(req, res) {
    let gameName = req.params.gameName;
    let gameRoom = gameRooms.get(gameName);

    console.log("Loading Game %s, %s", gameRoom.name, gameRoom.gameState.getGameState());

    res.render("game-room", {gameRoom: gameRoom, myPartialAsVariable: processedTemplate({})});
})

app.post("/create_game", function(req, res) {
    let gameName = req.body.game_name;
    console.log("create_game action invoked.");
    console.log("Player Name: " + req.body.player_name);
    console.log("Game Name: " + gameName);
    let gameRoom = new GameRoom(gameName, new Game());
    gameRooms.set(gameName, gameRoom);

    res.redirect("/game/" + req.body.game_name);
})

// This starts the server listening on the given port.
var server = app.listen(port, function () {
    console.log('node.js static server listening on port: ' + port + ", with websockets listener")
})

// Now that we have a server, we can pass this to the WebSocketServer, which
// will handle requests coming in using the ws:// protocol.
const wss = new SocketServer({ server });

// init Websocket ws and handle incoming connect requests.
// this function is called when a new connection is 
// established with the server. At this point we register a callback with the websocket
// client object in order to handle messages that are sent after the initial connection.
wss.on('connection', function connection(client) {
    console.log("connection ...");

    // set the callback for when a message comes in.
    client.on('message', function incoming(msg) {
        // The message coming in is a JSON string that we need to parse into a JS object.
        // Each message has message_type and name fields. The message_type tells us how
        // to handle the message, and the player_name field tells us who it's coming from,
        // and the game_name tells us which game this is for.
        var message = JSON.parse(msg);
        console.log("received message: " + msg);
        
        if (message.message_type == 'join_game') {
            console.log("Player %s joining game %s.", message.player_name, message.game_name);
            let gameRoom = gameRooms.get(message.game_name);
            if (!maybeReconnect(message, client, gameRoom)) {
                gameRoom.addPlayer(new Player(message.player_name, client));
            }
            updateClients(gameRoom);
        } else if (message.message_type == 'game_move') {
            console.log("Player %s making move %s.", message.player_name, message.move);
            let gameRoom = gameRooms.get(message.game_name);
            gameRoom.game.move(message.player_name, message.move);
            updateClients(gameRoom);
        }
    });
});

/*
  Checks to see if this user has already joined, but has a stale socket associated
  with the player. This could happen if the browser tab was reloaded after having
  established a connection.
 */
function maybeReconnect(message, client, gameRoom) {
    gameRoom.getPlayers().forEach(function(player, index) {
        if (player && player.name === message.player_name) {
            player.socket = client;
            return true;
        }
    });
    return false;
}

// Sends the gameRoom state to each of the players in the game.
function updateClients(gameRoom) {
    let message = JSON.stringify(gameRoom.toClientJSON());
    gameRoom.getPlayers().forEach(function(player, index) {
        if (player && player.socket) {
            player.socket.send(message);
        }
    });
}
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
// Generic Game-related classes that can be moved to another module at some point.
const PRE_GAME = "pre_game";
const ACTIVE_GAME = "active";
const POST_GAME = "post_game";

// TODO: GameState is meant to represent where in the game we are. At this point, most of
// this is in the Game object itself, but we can move that to the GameState object instead.
function GameState() {
    this.state = PRE_GAME;
    this.active = false;
    this.preGame = true;
};

GameState.prototype.nextMove = function(player) {
    this.nextMove = player.name;
}

GameState.prototype.getGameState = function() {
    return this.state;
}

// Each of the classes on the server have a toClientJSON() method that returns a
// simple object that can be serialized to sent to the client. This should not contain
// any functions and should only have fields that the client needs.
GameState.prototype.toClientJSON = function() {
    return {
        state: this.state,
        active: this.active,
        preGame: this.preGame,
        nextMove: this.nextMove,
    };
}

const PLAYER_STATE_WAITING = 'waiting';
const PLAYER_STATE_ACTIVE = 'active';

// The Player class contains information about the Player in the game.
// TODO: need to factor out the marker field since that is specific to the 
// tic-tac-toe game. 
function Player(name, socket) {
    this.name = name;
    this.socket = socket;
    this.state = PLAYER_STATE_ACTIVE;
    this.marker = "";
}

// Client representation. Note that we don't include the socket field.
Player.prototype.toClientJSON = function() {
    return {
        name: this.name,
        state: this.state,
    };
}

// A GameRoom represents the whole page that hosts a particular game. This includes
// the Game board itself as well as other parts such info about the Players, whose turn
// it is, etc..
function GameRoom(name, game) {
    this.name = name;
    this.gameState = new GameState();
    this.game = game;
}

GameRoom.prototype.addPlayer = function(player) {
    this.game.addPlayer(player);
}

GameRoom.prototype.getPlayers = function() {
    return this.game.getPlayers();
}

GameRoom.prototype.toClientJSON = function() {
    return {
        name: this.name,
        gameState: this.gameState.toClientJSON(),
        game: this.game.toClientJSON(),
        marker: this.marker,
    };
}

module.exports.init = init;