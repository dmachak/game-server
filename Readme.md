# ws-sample

Provides an example of a simple  game-server that handles a game of tic-tac-toe
The state of the game is managed on the server, and the updated board is pushed to
each client after a move. Communication happens over web-sockets. 

## Prerequisite
You will first need to install node.js/npm if you haven't already. Please see
https://nodejs.org/en/download/package-manager/

## Build it
Use npm in order to download the require dependencies specified in the
package.json. From within this directory: 
    > npm install
    
## Run it
    > PORT=80 node game-server.js
    
In a browser, open http://localhost/lobby.html
(or a different port if the port was overridden.)

Enter a Player Name and Game Name and click "Create Game". You will be
redirected to the game room. Enter your name can click Join.

In another tab, open the same game URL as the first tab (http://localhost/game/(gameName)).
Enter another name and click Join.

At this point you now have a live game of tic-tac-toe happening in the two browser tabs.
Keep making moves in each tab until the game is over. 

You can see logging on both the server side and in the client web consoles in order to
see which messages are being passed back and forth.


## TODO for game-server
- Refactor code into modules.
- Separate game-specific code out into differnet module
- CSS improvements in game board.
- Button to start new game after game is over
