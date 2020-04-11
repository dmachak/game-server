'use strict'

class TicTacToeGame {
    constructor() {
        console.log("Creating Game of Tic Tac Toe");
        this.board = [[,,], [,,], [,,]];
        this.hasWinner = false;
        this.isDraw = false;
        this.winner = "";
        this.nextMove = "";
        this.gameOver = false;
        this.numMoves = 0;
    }

    toClientJSON() {
        return {
            board: this.board,
            hasWinner: this.hasWinner,
            isDraw: this.isDraw,
            gameOver: this.gameOver,
            winner: this.winner,
            nextMove: this.nextMove,
            players: [
                this.player1 ? this.player1.toClientJSON() : {},
                this.player2 ? this.player2.toClientJSON() : {},
            ]
        }
    }

    getPlayers() {
        return [this.player1, this.player2];
    }

    getPlayer(playerName) {
        if (playerName === this.player1.name) {return this.player1;}
        if (playerName === this.player2.name) {return this.player2;}
        return null;
    }

    // This is the method that gets invoked when a player from one of the clients makes a move.
    // The state of the board is updated and we then check the board to see if there is a winner
    // or if the game ends in a draw.
    move(playerName, move) {
        let player = this.getPlayer(playerName);
        if (this.nextMove === player.name) {
            this.board[move.row][move.col] = player.marker;
            this.numMoves++;
            this.checkState();
            if (!this.gameOver) {
                this.nextMove = this.nextMove == this.player1.name ? this.player2.name : this.player1.name;
            } else {
                this.nextMove = "";
            }
        }
    }

    addPlayer(player) {
        if (!this.player1) {
            this.player1 = player;
            player.marker = "X";
            console.log("Adding player %s as player1.", player.name);
        } else if (!this.player2) {
            this.player2 = player;
            player.marker = "O";
            console.log("Adding player %s as player2.", player.name);
            this.nextMove = this.player1.name;
        } else {
            console.log("Couldn't add player %s, game full.", player.name);
        }
    }

    // Checks for each of the possible end-states in the game. Either one player has 
    // filled a row, column, or diagonal, or all 9 squares are filled with no winner.
    checkState() {
        
        // check rows
        for (var i = 0; i < 3; i++) {
            if (this.board[i][0] && this.board[i][0] === this.board[i][1] && this.board[i][0] === this.board[i][2]) {
                this.setWinner(this.board[i][0]);
                return;
            }
        }

        // check cols
        for (var i = 0; i < 3; i++) {
            if (this.board[0][i] && this.board[0][i] === this.board[1][i] && this.board[0][i] === this.board[2][i]) {
                this.setWinner(this.board[0][i]);
                return;
            }
        }

        // check diagonals
        if (this.board[0][0] && this.board[0][0] === this.board[1][1] && this.board[0][0] === this.board[2][2]) {
            this.setWinner(this.board[0][0]);
            return;
        }

        if (this.board[0][2] && this.board[0][2] === this.board[1][1] && this.board[0][2] === this.board[2][0]) {
            this.setWinner(this.board[0][2]);
            return;
        }

        if (this.numMoves == 9) {
            this.isDraw = true;
            this.gameOver = true;
        }
    }

    setWinner(marker) {
        this.hasWinner = true;
        this.gameOver = true;
        this.winner = marker === this.player1.marker ? this.player1.name : this.player2.name;
    }
}

module.exports.TicTacToeGame = TicTacToeGame;