import { ToolType, Position, GameConfig, debugMessage, toolTypeAsString, __DEBUG_MODE__ } from "./static";
import init, { ExternalField, TileStatus } from '../pkg/quantswepeer.js';
import { GUI } from "./gui";

export const initWasm = init;

export class Game {
    private readonly gui : GUI;

    private field: ExternalField | null = null;
    private quantFlags: number = 0;
    private openedTiles: Position[] = [];
    private quantedTiles: Position[] = [];
    private firstClick: boolean = true;
    private config: GameConfig | null = null;
    private isGameOver: boolean = true;
    private currentTool: ToolType = ToolType.Shovel;

    constructor() {
        this.gui = new GUI();
        debugMessage(`Initializing game...`);
        this.initializeEventHandlers();
        this.loadField();
    }

    private initializeEventHandlers(): void {
        debugMessage('Creating event handlers...');
        this.gui.onNewGame.connect(config => this.startNewGame(config));
        this.gui.onCellInteract.connect(pos => this.handleTileInteraction(pos));
        this.gui.onMeasure.connect(() => this.measureQuantFlags());
        this.gui.onToolChanged.connect(tool => this.changeTool(tool));
    }

    private changeTool(tool : ToolType): void {
        debugMessage(`Change tool to ${toolTypeAsString(tool)}`);
        this.currentTool = tool;
    }

    private startNewGame(config: GameConfig): void {
        this.config = this.validateConfig(config);
        debugMessage(`{width: ${this.config.width}, height: ${this.config.height}, groups: ${this.config.groups}, candidates: ${this.config.candidates}}`);
        this.initializeGameState(this.config);
        this.gui.createGameBoard(this.config.width, this.config.height);
        this.gui.setQuantFlagCount(this.quantFlags);
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
            Math.max(result.candidates || minCandidates, minCandidates),
            maxCandidates
        );

        return result;
    }

    private initializeGameState(config: GameConfig): void {
        debugMessage(`Initializing game stats...`);
        this.config = config;
        this.field = new ExternalField(config.width, config.height);
        this.quantFlags = Math.round(config.width * config.height * config.groups * 0.013);
        this.openedTiles = [];
        this.quantedTiles = [];
        this.firstClick = true;
        this.isGameOver = false;
    }

    private openTile(pos: Position): void {
        if (!this.field || !this.config) return;

        if (this.firstClick) {
            this.generateField(pos);
            this.firstClick = false;
        }

        this.processTileOpening(pos);
    }

    private generateField(pos: Position): void {
        this.field!.generate(
            pos.x,
            pos.y,
            this.config!.groups / 100,
            this.config!.candidates / 100
        );
    }

    private gameOver(): void {
        this.isGameOver = true;
    }

    private removeFlag(pos: Position): void {
        this.gui.setCellClosed(pos.x, pos.y);
        this.field!.setTileStatus(pos.x, pos.y, TileStatus.None);
    }

    private removeQuantFlag(pos: Position): void {
        this.quantFlags++;
        this.quantedTiles = this.quantedTiles.filter(p => !this.isSamePosition(p, pos));
        this.gui.setQuantFlagCount(this.quantFlags);
        this.gui.setCellClosed(pos.x, pos.y);
        this.field!.setTileStatus(pos.x, pos.y, TileStatus.None);
    }

    private addFlag(pos: Position): void {
        if (this.currentTool === ToolType.QuantFlag && this.quantFlags > 0) {
            this.addQuantFlag(pos);
        } else if (this.currentTool === ToolType.SimpleFlag) {
            this.addSimpleFlag(pos);
        }
    }

    private addQuantFlag(pos: Position): void {
        this.quantFlags--;
        this.quantedTiles.push(pos);
        this.gui.setQuantFlagCount(this.quantFlags);
        this.gui.setCellQuantFlag(pos.x, pos.y);
        this.field!.setTileStatus(pos.x, pos.y, TileStatus.QuantFlag);
    }

    private addSimpleFlag(pos: Position): void {
        this.gui.setCellSimpleFlag(pos.x, pos.y);
        this.field!.setTileStatus(pos.x, pos.y, TileStatus.Flag);
    }

    private updateProbabilities(): void {
        if (!this.field) return;

        for (const tile of this.openedTiles) {
            const probability = this.field.getProbabilityAround(tile.x, tile.y);
            this.gui.setCellOpened(tile.x, tile.y, probability);
        }
    }

    private resetQuantFlags(): void {
        for (const tile of this.quantedTiles) {
            this.gui.setCellClosed(tile.x, tile.y);
        }
        this.quantedTiles = [];
    }

    private loadField(): void {
        this.gui.showPopup('new-game-popup');
    }

    private getUniquePositions(positions: Position[]): Position[] {
        return positions.filter((tile, index, self) =>
            index === self.findIndex(t => t.x === tile.x && t.y === tile.y)
        );
    }

    private isSamePosition(a: Position, b: Position): boolean {
        return a.x === b.x && a.y === b.y;
    }

    private printAllField() {
        if (__DEBUG_MODE__) console.clear();
        if (!this.field) return;
        for (let y = 0; y < this.field.height; y++) {
            for (let x = 0; x < this.field.width; x++) {
                debugMessage(`(${x}, ${y}): Tile(prob=${this.field.getTileProb(x, y)}/12, group=${this.field.getTileGroup(x, y)}, measured=${this.field.hasTileMeasured(x, y)}, status=${this.field.getTileStatus(x, y)})`);
            }
        }
    }

    private handleTileInteraction(pos: Position): void {
        if (!this.field || this.isGameOver) return;

        switch (this.currentTool) {
            case ToolType.Shovel:
                this.openTile(pos);
                break;
            case ToolType.SimpleFlag:
            case ToolType.QuantFlag:
                this.toggleFlag(pos);
                break;
        }
        if (!this.isGameOver) {
            this.printAllField();
            this.renderField();
        }
    }

    private processTileOpening(pos: Position): void {
        const mine = this.__openTile(pos);
        if (!mine) {
            const result = this.field!.multiOpenTiles(pos.x, pos.y);
            const parsed = JSON.parse(`[${result}]`) as Position[];

            this.openedTiles.push(...parsed);
            this.openedTiles = this.getUniquePositions(this.openedTiles);
        }
        this.checkGameState();
        this.renderField();
    }

    private __openTile(pos: Position): boolean {
        this.openedTiles.push(pos);
        

        if (this.field!.openTile(pos.x, pos.y)) {
            this.gameOver();
            this.gui.setCellMine(pos.x, pos.y);
            return true;
        }

        this.renderField();
        return false;
    }

    private toggleFlag(pos: Position): void {
        if (!this.field || this.firstClick || this.isGameOver) return;

        const status = this.field.getTileStatus(pos.x, pos.y);
        if (status === undefined) return;

        switch (status) {
            case TileStatus.Opened:
                return;

            case TileStatus.Flag:
                this.field!.setTileStatus(pos.x, pos.y, TileStatus.None);
                break;

            case TileStatus.QuantFlag:
                this.quantFlags++;
                this.quantedTiles = this.quantedTiles.filter(p => !this.isSamePosition(p, pos));
                this.gui.setQuantFlagCount(this.quantFlags);
                this.field!.setTileStatus(pos.x, pos.y, TileStatus.None);
                break;

            case TileStatus.None:
                if (this.currentTool === ToolType.QuantFlag && this.quantFlags > 0) {
                    this.quantFlags--;
                    this.quantedTiles.push(pos);
                    this.gui.setQuantFlagCount(this.quantFlags);
                    this.field!.setTileStatus(pos.x, pos.y, TileStatus.QuantFlag);
                } else if (this.currentTool === ToolType.SimpleFlag) {
                    this.field!.setTileStatus(pos.x, pos.y, TileStatus.Flag);
                }
                break;
        }
        
        this.checkGameState();
        this.renderField(); // Обновляем отображение после изменения флагов
    }

    private measureQuantFlags(): void {
        if (!this.field || this.isGameOver) return;

        this.field.measureQuantFlags();
        this.quantedTiles = [];
        this.renderField(); // Обновляем отображение после измерения
        this.checkGameState();
    }

    private renderField(): void {
        if (!this.field) return;

        // Обновляем счетчик квантовых флагов
        this.gui.setQuantFlagCount(this.quantFlags);

        // Отрисовываем все клетки
        for (let y = 0; y < this.field.height; y++) {
            for (let x = 0; x < this.field.width; x++) {
                const status = this.field.getTileStatus(x, y);

                switch (status) {
                    case TileStatus.Opened:
                        if (this.field.getTileProb(x, y) >= 12) {
                            this.gui.setCellMine(x, y);
                        }
                        else {
                            this.gui.setCellOpened(x, y, this.field.getProbabilityAround(x, y));
                        }
                        break;
                    
                    case TileStatus.QuantFlag:
                        this.gui.setCellQuantFlag(x, y);
                        break;

                    case TileStatus.None:
                        this.gui.setCellClosed(x, y);
                        break;

                    case TileStatus.Flag:
                        debugMessage(`Rendering flag: game_over=${this.isGameOver}, Prob= ${this.field.getTileProb(x, y)}`)
                        if (this.isGameOver && this.field.getTileProb(x, y) >= 12) {
                            debugMessage('RIGHT Flag!');
                            this.gui.setCellRightFlag(x, y);
                        }
                        else {
                            debugMessage('Simple Flag!');
                            this.gui.setCellSimpleFlag(x, y);
                        }
                }
            }
        }

        // В дебаг-режиме выводим дополнительную информацию
        if (__DEBUG_MODE__) {
            this.printDebugInfo();
        }
    }

    private printDebugInfo(): void {
        //console.clear();
        if (!this.field) return;

        for (let y = 0; y < this.field.height; y++) {
            for (let x = 0; x < this.field.width; x++) {
                debugMessage(`(${x}, ${y}): Tile(prob=${this.field.getTileProb(x, y)}/12, ` +
                    `group=${this.field.getTileGroup(x, y)}, ` +
                    `measured=${this.field.hasTileMeasured(x, y)}, ` +
                    `status=${this.field.getTileStatus(x, y)})`);
            }
        }
    }

    private checkGameState(): void {
        if (this.field.isWinStatus()) {
            this.gameOver();
        }
    }
}