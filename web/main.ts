import { WasmHook, wasmInit } from './bridge';
import { initLanguage } from './lang';

async function run() {
    await wasmInit();
    await initLanguage();
    new WasmHook();
}

document.addEventListener('DOMContentLoaded', run);