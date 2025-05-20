//import { debugMessage, GameConfig } from './static';
import init, { GameEngine, TileStatus, ToolType } from '../pkg/quantswepeer.js';
import { DOMManager } from './dom';
//import { GUI } from "./gui";

import { FieldManager } from './field';
import { GameConfig } from './types';

function debugMessage(msg : string): void {
    if (true) console.log(msg);
}

const gcd = (a : number, b : number) => {if (!b) {return a;}return gcd(b, a % b)};

export class WasmHook {
    private engine : GameEngine;
    //private gui : GUI;
    private field: FieldManager;
    private dom : DOMManager

    constructor() {
        this.engine = new GameEngine();
        this.field = new FieldManager((x : number, y : number) => {
            this.engine.handleTileInteraction(x, y);
            this.renderField();
        });

        const onCollapse = () => {
            this.engine.collapseQuantFlags();
            this.renderField();
        };

        const onNewGame = config => {
            debugMessage(config);
            config = this.validateConfig(config);
            debugMessage(config);
            this.engine.startNewGame(
                config.width, 
                config.height, 
                config.groups / 100, 
                config.candidates / 100
            );
            this.field.createBoard(config.width, config.height);
            this.dom.popupManager.closePopup();
            this.renderField();
        }

        this.dom = new DOMManager(onCollapse, tool => this.engine.changeTool(tool), onNewGame);
        this.dom.popupManager.showNewGamePopup();
    }
    
    private validateConfig(config: GameConfig): GameConfig {
        const defaults: GameConfig = {
            width: 10,      // стандартное значение ширины
            height: 10,     // стандартное значение высоты
            groups: 10,      // стандартное количество групп
            candidates: 20   // стандартное количество кандидатов
        };

        const result: GameConfig = { ...defaults, ...config };

        // Проверка и корректировка числовых значений
        result.width = Math.min(Math.max(Math.round(result.width || defaults.width), 5), 30);
        result.height = Math.min(Math.max(Math.round(result.height || defaults.height), 5), 22);
        result.groups = Math.min(Math.max(result.groups || defaults.groups, 1), 100);

        const minCandidates = result.groups;
        const maxCandidates = Math.min(result.groups * 4, 100);
        result.candidates = Math.min(
            Math.max(result.candidates || defaults.candidates, minCandidates),
            maxCandidates
        );

        return result;
    }

    private renderField(): void {
        if (!this.engine.hasFieldNow) return;

        this.dom.setQuantFlags(this.engine.getQuantFlagCount);

        for (const coord of this.engine.fieldChanges) {
            const x = coord.x;
            const y = coord.y;
            this.field.resetTile(x, y);
            switch (this.engine.getTileStatus(x, y)) {
                case TileStatus.None:
                    this.field.setTileClosed(x, y);
                    break;
                case TileStatus.Flag: 
                    if (this.engine.isGameOver && this.engine.isTileMine(x, y)) this.field.setTileRightFlag(x, y);
                    else this.field.setTileFlag(x, y);
                    break;
                case TileStatus.QuantFlag:
                    this.field.setTileQuantFlag(x, y);
                    break;
                case TileStatus.Opened:
                    if (this.engine.isTileMine(x, y)) this.field.setTileMine(x, y);
                    else {
                        const frac = this.reduceFrac(this.engine.getProbabilityAroundTile(x, y));
                        this.field.setTileOpened(x, y, frac.num, frac.den);
                    };
                    break;
            }
        }
    }

    private reduceFrac(num : number, den : number = 12): {num : number, den : number} {
        const x = gcd(num, den);
        return {num : num / x, den : den / x};
    }
}

export const wasmInit = init;