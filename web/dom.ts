import { ToolType } from "../pkg/quantswepeer";
import { GameConfig } from "./types";
import { PopupManager } from "./popup";

export class DOMManager {
    private static readonly TOOL_IDS = {
        [ToolType.Shovel]: '#tool-shovel',
        [ToolType.SimpleFlag]: '#classic-flag',
        [ToolType.QuantFlag]: '#quant-flag',
    };

    private readonly tools: Record<ToolType, JQuery<HTMLElement>>;
    private readonly quantFlags = $('#quant-flag-count');
    private readonly links = $('#label');
    public readonly popupManager = new PopupManager();

    constructor(
        private readonly onCollapse: () => void,
        private readonly onToolChanging: (tool: ToolType) => void,
        private readonly onStartingGame: (config: GameConfig) => void
    ) {
        this.tools = Object.fromEntries(
            Object.entries(DOMManager.TOOL_IDS).map(([type, id]) => 
                [Number(type), $(id)] as [ToolType, JQuery<HTMLElement>]
            )
        ) as Record<ToolType, JQuery<HTMLElement>>;

        this.initializeEventHandlers();
    }

    public setQuantFlags(value: number): void {
        this.quantFlags.text(value.toString());
    }

    public readGameConfig(): GameConfig {
        const getNum = (id: string) => Number($(`#${id}`).val());
        return {
            width: getNum('width'),
            height: getNum('height'),
            groups: getNum('groups'),
            candidates: getNum('candidates'),
        };
    }

    private initializeEventHandlers(): void {
        this.setupToolHandlers();
        this.setupButtonHandlers();
        this.setupLinkHandler();
    }

    private setupToolHandlers(): void {
        Object.entries(this.tools).forEach(([type, element]) => 
            element.on('click', () => this.handleToolChange(Number(type) as ToolType))
        );
    }

    private setupLinkHandler(): void {
        this.links.on('click', () => this.popupManager.showLinksPopup());
    }

    private setupButtonHandlers(): void {
        $('#collapse').on('click', () => this.onCollapse());
        $('#new-game').on('click', () => this.popupManager.showNewGamePopup());
        $('#start-game').on('click', this.handleGameStart.bind(this));
        $('#instruction.btn').on('click', () => this.popupManager.showHowToPlayPopup());
    }

    private handleToolChange(tool: ToolType): void {
        console.log(`Changing tool to ${ToolType[tool]}`);
        Object.values(this.tools).forEach(t => t.removeClass('active'));
        this.tools[tool].addClass('active');
        this.onToolChanging(tool);
    }

    private handleGameStart(): void {
        this.popupManager.closePopup();
        this.onStartingGame(this.readGameConfig());
    }
}
