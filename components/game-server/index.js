'use strict'

// This code is currently unused. TODO: move all generic game-server code here.

var gameFactory;
var games = new Map();

function init(gf) {
    gameFactory = gf;
}

function createGame(name) {
    console.log("Creating game %s", name);
    games.set(name, gameFactory.createGame(name));
}

module.exports.init = init;
module.exports.createGame = createGame;