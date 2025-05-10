import { Textures } from "./textures";
import { Signal } from "./signal";
import { CellManager } from "./cell-manager";
import { ToolType, GameConfig, Position, debugMessage } from "./static";

export class GUI {
    public readonly onToolChanged = new Signal<ToolType>();
    public readonly onCellInteract = new Signal<Position>();
    public readonly onNewGame = new Signal<GameConfig>();
    public readonly onMeasure = new Signal<void>();

    private cellManager: CellManager;
    private currentPopupId: string = '';
    private currentTool: ToolType = ToolType.Shovel;
    
    constructor(
        private readonly gameBoard: HTMLElement,
        private readonly scoreElement: HTMLElement,
        private readonly quantFlagCountElement: HTMLElement,
        private readonly popupElement: HTMLElement,
        private readonly overlayElement: HTMLElement
    ) {
        this.cellManager = new CellManager(gameBoard);
        this.setupEventListeners();
    }

    public setTool(tool: ToolType): void {
        this.currentTool = tool;
        this.onToolChanged.emit(tool);
        this.updateToolButtons();
    }

    public createGameBoard(width: number, height: number): void {
        this.cellManager.createBoard(width, height, (x, y) => 
            this.onCellInteract.emit({ x, y })
        );
    }

    public setScore(score: number): void {
        this.scoreElement.textContent = score.toString();
    }

    public setQuantFlagCount(count: number): void {
        this.quantFlagCountElement.textContent = count.toString();
    }

    public showPopup(id: string): void {
        const popup = document.getElementById(id) as HTMLElement;
        popup.style.display = 'block';
        this.overlayElement.style.display = 'block';
        this.currentPopupId = id;
    }

    public hidePopup(): void {
        const popup = document.getElementById(this.currentPopupId) as HTMLElement;
        popup.style.display = 'none';
        this.overlayElement.style.display = 'none';
        this.currentPopupId = '';
    }

    // Cell state methods
    public setCellClosed(x: number, y: number): void {
        this.cellManager.updateCellContent(x, y, Textures.CLOSED_CELL);
    }

    public setCellSimpleFlag(x: number, y: number): void {
        this.cellManager.updateCellContent(x, y, Textures.SIMPLE_FLAG);
    }

    public setCellQuantFlag(x: number, y: number): void {
        this.cellManager.updateCellContent(x, y, Textures.QUANT_FLAG);
    }

    public setCellMine(x: number, y: number): void {
        debugMessage(`Cell to mine: x=${x}; y=${y}`);
        this.cellManager.updateCellContent(x, y, Textures.MINE_CELL);
    }

    public setCellOpened(x: number, y: number, numerator: number, denominator: number = 12): void {
        this.cellManager.setCellFraction(x, y, numerator, denominator);
    }

    public updateCellFraction(x: number, y: number, numerator: number, denominator: number = 12): void {
        this.cellManager.updateCellFraction(x, y, numerator, denominator);
    }

    private setupEventListeners(): void {
        this.setupButtonListeners();
        this.setupToolListeners();
    }

    private setupButtonListeners(): void {
        document.getElementById('new-game')?.addEventListener('click', 
            () => this.showPopup('new-game-popup'));
        
        document.getElementById('measure')?.addEventListener('click', 
            () => this.onMeasure.emit());
        
        document.getElementById('start-game')?.addEventListener('click', 
            () => this.startNewGame());
    }

    private setupToolListeners(): void {
        document.getElementById('tool-shovel')?.addEventListener('click', 
            () => this.setTool(ToolType.Shovel));
        
        document.getElementById('tool-simple-flag')?.addEventListener('click', 
            () => this.setTool(ToolType.SimpleFlag));
        
        document.getElementById('tool-quant-flag')?.addEventListener('click', 
            () => this.setTool(ToolType.QuantFlag));
    }

    private startNewGame(): void {
        const config = this.getGameConfig();
        this.hidePopup();
        this.onNewGame.emit(config);
    }

    private updateToolButtons(): void {
        document.querySelectorAll('.tool-selector .button').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButtonId = this.getActiveToolButtonId();
        document.getElementById(activeButtonId)?.classList.add('active');
    }

    private getActiveToolButtonId(): string {
        return {
            [ToolType.Shovel]: 'tool-shovel',
            [ToolType.SimpleFlag]: 'tool-simple-flag',
            [ToolType.QuantFlag]: 'tool-quant-flag'
        }[this.currentTool];
    }

    private getGameConfig(): GameConfig {
        const getValue = (id: string): number => {
            const element = document.getElementById(id) as HTMLInputElement;
            return parseFloat(element.value);
        };

        return {
            width: getValue('width'),
            height: getValue('height'),
            groups: getValue('groups'),
            candidates: getValue('candidates')
        };
    }
}