// Предзагрузка страницы, проверяет наличие WASM

document.addEventListener('DOMContentLoaded', _=>{
    if(typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
        document.getElementById('app').style.display = 'flex';
        document.getElementById('popups').style.display = 'block';
        document.getElementById('preload').style.display = 'none';
    }
    else{
        document.getElementById('wasm-warn').style.display = 'block';
    }
});