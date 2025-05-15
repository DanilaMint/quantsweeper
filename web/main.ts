import { WasmHook, wasmInit } from './bridge';

async function run() {
    await wasmInit();
    new WasmHook();
}

document.addEventListener('DOMContentLoaded', run);