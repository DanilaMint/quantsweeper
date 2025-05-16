import { Textures } from "./textures";
import { Signal } from "./signal";
import { CellManager } from "./cell-manager";
import { ToolType, GameConfig, Position, debugMessage } from "./static";

export class GUI {
    private readonly gameBoard: JQuery<HTMLElement>;
    private readonly scoreElement: JQuery<HTMLElement>;
    private readonly quantFlagCountElement: JQuery<HTMLElement>;
    private readonly overlayElement: JQuery<HTMLElement>;

    public readonly onToolChanged = new Signal<ToolType>();
    public readonly onCellInteract = new Signal<Position>();
    public readonly onNewGame = new Signal<GameConfig>();
    public readonly onMeasure = new Signal<void>();

    private cellManager: CellManager;
    private currentPopupId: string = '';
    private currentTool: ToolType = ToolType.Shovel;
    
    constructor() {
        this.gameBoard = $('#game-board');
        this.scoreElement = $('#score')
        this.quantFlagCountElement = $('#quant-flag-count');
        this.overlayElement = $('#overlay');

        this.cellManager = new CellManager(this.gameBoard);
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
        this.scoreElement.text(score);
    }

    public setQuantFlagCount(count: number): void {
        this.quantFlagCountElement.text(count);
    }

    public showPopup(id: string): void {
        const popup = $('#' + id);
        popup.css('display', 'block');
        this.overlayElement.css('display', 'block');
        this.currentPopupId = '#' + id;
    }

    public hidePopup(): void {
        const popup = $(this.currentPopupId);
        popup.css('display', 'none');
        this.overlayElement.css('display', 'none');
        this.currentPopupId = '#sus';
    }

    // Cell state methods
    public setCellRightFlag(x: number, y: number): void {
        this.cellManager.updateCellContent(x, y, Textures.RIGHT_FLAG);
    }

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
        this.cellManager.updateCellContent(x, y, Textures.MINE_CELL);
    }

    public setCellOpened(x: number, y: number, numerator: number, denominator: number = 12): void {
        this.cellManager.setCellFraction(x, y, numerator, denominator);
    }

    private setupEventListeners(): void {
        this.setupButtonListeners();
        this.setupToolListeners();
    }

    private setupButtonListeners(): void {
        $('#new-game').on('click', _ => this.showPopup('new-game-popup'));
        $('#measure').on('click', _ => this.onMeasure.emit());
        $('#start-game').on('click', _ => this.startNewGame());
    }

    private setupToolListeners(): void {
        $('#tool-shovel').on('click', _ => this.setTool(ToolType.Shovel));
        $('#tool-simple-flag').on('click', _ => this.setTool(ToolType.SimpleFlag));
        $('#tool-quant-flag').on('click', _ => this.setTool(ToolType.QuantFlag));
    }

    private startNewGame(): void {
        const config = this.getGameConfig();
        this.hidePopup();
        this.onNewGame.emit(config);
    }

    private updateToolButtons(): void {
        $('.tool-selector .button').each((_, btn) => {
            btn.classList.remove('active');
        });
        const activeButtonId = this.getActiveToolButtonId();
        $(activeButtonId).addClass('active');
    }

    private getActiveToolButtonId(): string {
        return {
            [ToolType.Shovel]: '#tool-shovel',
            [ToolType.SimpleFlag]: '#tool-simple-flag',
            [ToolType.QuantFlag]: '#tool-quant-flag'
        }[this.currentTool];
    }

    private getGameConfig(): GameConfig {
        const getValue = (id: string) => {
            const str = $(id).val()?.toString();
            return parseFloat(str || "");
        };

        return {
            width: getValue('#width'),
            height: getValue('#height'),
            groups: getValue('#groups'),
            candidates: getValue('#candidates')
        };
    }
}