import Game from "./game.js";

const cvs = document.getElementById("game-canvas");
const ctx = cvs.getContext("2d");

const GAME_WIDTH = 500;
const GAME_HEIGHT = 700;

export const game = new Game(cvs, ctx, GAME_WIDTH, GAME_HEIGHT);

game.setup();

import "./ui-logic.js";
