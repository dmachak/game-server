// This is the code that executes in the client, and sets up a simple communication
// between this client and other clients, acting via the server. 

var socket;
var gameRoom;

// Sent when a player joins a game from the gameRoom. References form elements from the sign-in.hbs partial.
// This is called when the page establishes a connection with the server. For this sample,
// the connection is done explicitly via a user action, but this could also be done when
// the page is being loaded. 
function connect() {
    console.log("connect");
    socket = new WebSocket('ws://localhost:80');

    // Connection opened
    
    // At the time we create the socket, we set up a listener so we can respond to when
    // the open event is triggered (which should be almost immediately. In this case,
    // we're sending a message with the "connect" message_type and a name that we can
    // be identified by.
    socket.addEventListener('open', function (event) {
        let message = {};
        message.message_type = 'join_game';
        message.player_name = document.getElementById('player_name').value;
        message.game_name = document.getElementById('game_name').value;
        var msg = JSON.stringify(message);
        console.log("sending: %s",  msg);
        socket.send(msg);
    });

    // We also set up a listener to respond to messages sent to this client from the
    // server. The event.data field is a String representation of a JSON object. We 
    // parse it into a JavaScript object. At this point the only messages were expecting
    // are those that represent a new state of the game. We take the values in this 
    // message and update markup on the page.
    socket.addEventListener('message', function (event) {
        console.log('Message from server ', event.data);
        let message = JSON.parse(event.data);
        gameRoom = message;
        updatePage(message);
    });
}

// Determines the name of the player on this page.
function thisPlayer() {
    return document.getElementById('player_name').value;
}

// Returns the name of the game we're playing. Currently this is set in a hidden
// element on the page. (although we could probably determine it from the URL.)
function thisGame() {
    return document.getElementById('game_name').value;
}

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
// Methods that handle refresh of the page
// Update the page html based on the new gameRoom model passed in from the server.
function updatePage(gameRoom) {
    console.log('Updating page for gameRoom');
    let players = gameRoom.game.players;
    updatePlayer(0, players[0]);
    updatePlayer(1, players[1]);
    updateMoveStatus(gameRoom);
    updateBoard(gameRoom);
}

// Updates the names of the players in this game. 
function updatePlayer(index, player) {
    if (player) {
        document.getElementById("player" + index).textContent = player.name;
        if (thisPlayer() === player.name) {
            hideSignIn();
        }
    }
}

// Once a player has joined we can hide the sign-in section.
function hideSignIn() {
    document.getElementById("sign-in").classList.add("hidden");
}

// Handles the section that displays either whose move it is, or displays the 
// result when the game has finished.
function updateMoveStatus(gameRoom) {
    document.getElementById("next-move").textContent = gameRoom.game.nextMove;
    if (gameRoom.game.gameOver) {
        addClass("move-area", "hidden");
        removeClass("result", "hidden");
        if (gameRoom.game.hasWinner) {
            removeClass("winner-declaration", "hidden");
            addClass("draw", "hidden");
            document.getElementById("winner").textContent = gameRoom.game.winner;
        }
    }
    if (thisPlayer() === gameRoom.game.nextMove) {
        addClass("move-status", "my-move");
        addClass("game-area", "my-move");
        removeClass("move-status", "waiting");
        removeClass("game-area", "waiting");
    } else {
        addClass("move-status", "waiting");
        addClass("game-area", "waiting");
        removeClass("move-status", "my-move");
        removeClass("game-area", "my-move");
    }
}

// helper function to add a CSS class to an element with the given id.
function addClass(id, className) {
    let classes = document.getElementById(id).classList;
    if (!classes.contains(className)) {
        classes.add(className);
    }
}

// helper function to remove a CSS class from an element with the given id.
function removeClass(id, className) {
    let classes = document.getElementById(id).classList;
    if (classes.contains(className)) {
        classes.remove(className);
    }
}

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
// tic-tac-toe specific logic. TODO: This will be moved to a different module at 
// some point. 

// This is the method that is called when a player makes a move. This constructs a 
// JSON object and sends the result to the server. 
function move(row, col) {
    if (thisPlayer() === gameRoom.game.nextMove) {
        // first check if legal move.
        if (gameRoom.game.board[row][col] === 'X' ||
            gameRoom.game.board[row][col] === 'O') {
            console.log("Space already taken.");
            return;
        }

        var message = {};
        message.message_type = 'game_move';
        message.player_name = thisPlayer();
        message.game_name = thisGame();
        message.move = {row: row, col: col};
        var msg = JSON.stringify(message);
        console.log("sending move: %s",  msg);
        socket.send(msg);
    }
}

// Updates the display on the board.
function updateBoard(gameRoom) {
    for (i = 0; i < 3; i++) {
        for (j = 0; j < 3; j++) {
            document.getElementById("square" + i + j).textContent = gameRoom.game.board[i][j];
        }
    }
}