import { debugMessage, GameConfig } from './static';
import init, { GameEngine, TileStatus, ToolType } from '../pkg/quantswepeer.js';
import { GUI } from "./gui";

const gcd = (a : number, b : number) => {if (!b) {return a;}return gcd(b, a % b)};

export class WasmHook {
    private engine : GameEngine;
    private gui : GUI;

    constructor() {
        this.engine = new GameEngine();
        this.gui = new GUI();
        this.handleMethods();
        this.gui.showPopup('new-game-popup');
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
        result.height = Math.min(Math.max(Math.round(result.height || defaults.height), 5), 30);
        result.groups = Math.min(Math.max(result.groups || defaults.groups, 1), 100);

        const minCandidates = result.groups;
        const maxCandidates = Math.min(result.groups * 4, 100);
        result.candidates = Math.min(
            Math.max(result.candidates || defaults.candidates, minCandidates),
            maxCandidates
        );

        return result;
    }

    private handleMethods() {
        this.gui.onNewGame.connect(config => {
            debugMessage(config);
            config = this.validateConfig(config);
            debugMessage(config);
            this.engine.startNewGame(
                config.width, 
                config.height, 
                config.groups / 100, 
                config.candidates / 100
            );
            this.gui.createGameBoard(config.width, config.height);
            this.renderField();
        });
        this.gui.onCellInteract.connect(pos => {
            this.engine.handleTileInteraction(pos.x, pos.y);
            this.renderField();
        });
        this.gui.onMeasure.connect(() => {
            this.engine.collapseQuantFlags();
            this.renderField();
        });
        this.gui.onToolChanged.connect(tool => {
            this.engine.changeTool(tool);
        });
    }

    private renderField(): void {
        if (!this.engine.hasFieldNow) return;

        this.gui.setQuantFlagCount(this.engine.getQuantFlagCount);

        for (let y = 0; y < this.engine.fieldHeight; y++) {
            for (let x = 0; x < this.engine.fieldWidth; x++) {
                switch (this.engine.getTileStatus(x, y)) {
                    case TileStatus.None:
                        this.gui.setCellClosed(x, y);
                        break;
                    case TileStatus.Flag: 
                        if (this.engine.isGameOver && this.engine.isTileMine(x, y)) this.gui.setCellRightFlag(x, y);
                        else this.gui.setCellSimpleFlag(x, y);
                        break;
                    case TileStatus.QuantFlag:
                        this.gui.setCellQuantFlag(x, y); 
                        break;
                    case TileStatus.Opened:
                        if (this.engine.isTileMine(x, y)) this.gui.setCellMine(x, y);
                        else {
                            const frac = this.reduceFrac(this.engine.getProbabilityAroundTile(x, y));
                            debugMessage(frac);
                            this.gui.setCellOpened(x, y, frac.num, frac.den);
                        };
                        break;
                }
            }
        }
    }

    private reduceFrac(num : number, den : number = 12): {num : number, den : number} {
        const x = gcd(num, den);
        return {num : num / x, den : den / x};
    }
}

export const wasmInit = init;