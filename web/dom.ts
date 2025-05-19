import { ToolType } from "../pkg/quantswepeer";
import { GameConfig } from "./types";
import { PopupManager } from "./popup";

export class DOMManager {
    private readonly onCollapse: () => void;
    private readonly onToolChanging: (tool: ToolType) => void;
    private readonly onStartingGame: (config: GameConfig) => void;

    private readonly tools: Record<ToolType, JQuery<HTMLElement>>;
    private readonly quantFlags: JQuery<HTMLElement>;
    public readonly popupManager: PopupManager;

    private static readonly TOOL_IDS = {
        [ToolType.Shovel]: '#tool-shovel',
        [ToolType.SimpleFlag]: '#classic-flag',
        [ToolType.QuantFlag]: '#quant-flag',
    };

    constructor(
        onCollapse: () => void,
        onToolChanging: (tool: ToolType) => void,
        onStartingGame: (config: GameConfig) => void
    ) {
        this.onCollapse = onCollapse;
        this.onToolChanging = onToolChanging;
        this.onStartingGame = onStartingGame;

        this.tools = {
            [ToolType.Shovel]: $(DOMManager.TOOL_IDS[ToolType.Shovel]),
            [ToolType.SimpleFlag]: $(DOMManager.TOOL_IDS[ToolType.SimpleFlag]),
            [ToolType.QuantFlag]: $(DOMManager.TOOL_IDS[ToolType.QuantFlag]),
        };

        this.quantFlags = $('#quant-flag-count');
        this.popupManager = new PopupManager();

        this.initializeEventHandlers();
    }

    public setQuantFlags(value: number): void {
        this.quantFlags.text(value.toString());
    }

    public readGameConfig(): GameConfig {
        const getNumericInputValue = (id: string): number => {
            const value = $(`#${id}`).val();
            return Number(value);
        };

        return {
            width: getNumericInputValue('width'),
            height: getNumericInputValue('height'),
            groups: getNumericInputValue('groups'),
            candidates: getNumericInputValue('candidates'),
        };
    }

    private initializeEventHandlers(): void {
        this.setupToolHandlers();
        this.setupButtonHandlers();
    }

    private setupToolHandlers(): void {
        Object.entries(this.tools).forEach(([toolType, element]) => {
            element.on('click', () => this.handleToolChange(Number(toolType) as ToolType));
        });
    }

    private setupButtonHandlers(): void {
        $('#collapse').on('click', () => this.onCollapse());
        $('#new-game').on('click', () => this.popupManager.showNewGamePopup());
        $('#start-game').on('click', () => this.handleGameStart());
        $('#instruction.btn').on('click', () => this.popupManager.showHowToPlayPopup());
        $('');
    }

    private handleToolChange(tool: ToolType): void {
        console.log(`Changing tool to ${ToolType[tool]}`);
        this.deactivateAllTools();
        this.activateTool(tool);
        this.onToolChanging(tool);
    }

    private deactivateAllTools(): void {
        Object.values(this.tools).forEach(tool => tool.removeClass('active'));
    }

    private activateTool(tool: ToolType): void {
        this.tools[tool].addClass('active');
    }

    private handleGameStart(): void {
        this.popupManager.closePopup();
        const config = this.readGameConfig();
        this.onStartingGame(config);
    }
}
