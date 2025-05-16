// Предзагрузка страницы, проверяет наличие WASM и запускает игру

document.addEventListener('DOMContentLoaded', _=>{
    if(typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
        document.getElementById('app').style.display = 'flex';
        document.getElementById('preload').style.display = 'none';
    }
    else{
        document.getElementById('wasm-warn').style.display = 'static';
    }
});