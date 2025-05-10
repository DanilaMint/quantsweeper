import { Game, initWasm, GUI } from "./game";


async function run() {
    await initWasm();
    
    const gameBoard = <HTMLElement>document.getElementById('game-board');
    const scoreElement = <HTMLElement>document.getElementById('score');
    const quantFlagCountElement = <HTMLElement>document.getElementById('quant-flag-count');
    const popupElement = <HTMLElement>document.getElementById('popup');
    const overlayElement = <HTMLElement>document.getElementById('overlay');

    const gui = new GUI(
        gameBoard, scoreElement, quantFlagCountElement, popupElement, overlayElement
    );

    const game = new Game(gui);
}

document.addEventListener('DOMContentLoaded', run);