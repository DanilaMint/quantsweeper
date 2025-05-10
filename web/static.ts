import { TileStatus } from "../pkg/quantswepeer";

// Глобальный интерфейс для доступа из консоли
declare global {
    interface Window {
        __DEBUG_MODE__: boolean;
        enableDebugMode: () => void;
        disableDebugMode: () => void;
    }
}

export enum ToolType {
    Shovel,
    SimpleFlag,
    QuantFlag
}

export interface TileData {
    status: TileStatus;
    probability: number;
    measured: boolean;
}

export interface GameConfig {
    width: number;
    height: number;
    groups: number;
    candidates: number;
}

export interface Position {
    x: number;
    y: number;
}

export const toolTypeAsString = (t: ToolType) => {
    switch (t) {
        case ToolType.Shovel: return "showel";
        case ToolType.SimpleFlag: return "flag";
        case ToolType.QuantFlag: return "quant flag";
    }
};

// Экспортируемая переменная для доступа из других модулей
export let __DEBUG_MODE__ = false;

export const enableDebugMode = () => {
    __DEBUG_MODE__ = true;
    window.__DEBUG_MODE__ = true;
    console.log("[DEBUG] Debug mode enabled");
};

export const disableDebugMode = () => {
    __DEBUG_MODE__ = false;
    window.__DEBUG_MODE__ = false;
    console.log("[DEBUG] Debug mode disabled");
};

// Привязка к глобальному объекту
if (typeof window !== 'undefined') {
    window.__DEBUG_MODE__ = __DEBUG_MODE__;
    window.enableDebugMode = enableDebugMode;
    window.disableDebugMode = disableDebugMode;
}

export const debugMessage = (msg: any) => {
    if (__DEBUG_MODE__) {
        console.log("[DEBUG]", msg);
    }
};