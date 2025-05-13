import { ToolType, Position, GameConfig, debugMessage, toolTypeAsString } from "./static";
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
        const result = {...config};
        result.width = Math.min(Math.max(Math.round(result.width), 5), 30);
        result.height = Math.min(Math.max(Math.round(result.height), 5), 30);
        result.groups = Math.min(Math.max(result.groups, 1), 100);

        const minCandidates = result.groups;
        const maxCandidates = Math.min(result.groups * 4, 100); // Ограничиваем и groups*4, и 1.0
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

    private processTileOpening(pos: Position): void {
        const mine = this.__openTile(pos);
        if (!mine) {
            const result = this.field!.multiOpenTiles(pos.x, pos.y);
            const parsed = JSON.parse(`[${result}]`) as Position[];
        
            this.openedTiles.push(...parsed);
            this.openedTiles = this.getUniquePositions(this.openedTiles);
            this.updateProbabilities();
        }
    }

    private __openTile(pos: Position): boolean {
        this.openedTiles.push(pos);
        this.field.openTile(pos.x, pos.y);
        
        if (this.field!.getTileProb(pos.x, pos.y) >= 12) {
            this.gui.setCellMine(pos.x, pos.y);
            this.gameOver();
            return true;
        }
        
        this.updateProbabilities();
        return false;
    }

    private gameOver(): void {
        this.isGameOver = true;
    }

    private toggleFlag(pos: Position): void {
        debugMessage(`Setting flag to (${pos.x}, ${pos.y})`);
        if (!this.field || this.firstClick || this.isGameOver) return;

        const status = this.field.getTileStatus(pos.x, pos.y);
        debugMessage(status);
        if (status === undefined) return;

        switch (status) {
            case TileStatus.Opened:
                return;

            case TileStatus.Flag:
                this.removeFlag(pos);
                break;

            case TileStatus.QuantFlag:
                this.removeQuantFlag(pos);
                break;

            case TileStatus.None:
                this.addFlag(pos);
                break;
        }
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

    private measureQuantFlags(): void {
        if (!this.field) return;

        this.field.measureQuantFlags();
        this.resetQuantFlags();
        this.updateProbabilities();
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
}