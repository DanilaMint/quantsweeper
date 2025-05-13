import { Game, initWasm } from "./game";


async function run() {
    await initWasm();
    const game = new Game();
}

document.addEventListener('DOMContentLoaded', run);