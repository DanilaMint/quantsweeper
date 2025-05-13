import { debugMessage } from "./static";
import { Textures } from "./textures";

export class CellManager {
    constructor(private readonly gameBoard: HTMLElement) {}

    public createBoard(width: number, height: number, onClick: (x: number, y: number) => void): void {
        this.clearBoard();
        this.setBoardDimensions(width, height);
        this.populateBoard(width, height, onClick);
    }

    private clearBoard(): void {
        this.gameBoard.innerHTML = '';
    }

    private setBoardDimensions(width: number, height: number): void {
        this.gameBoard.style.gridTemplateColumns = `repeat(${width}, 30px)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${height}, 30px)`;
    }

    private populateBoard(width: number, height: number, onClick: (x: number, y: number) => void): void {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                this.createCell(x, y, onClick);
            }
        }
    }

    private createCell(x: number, y: number, onClick: (x: number, y: number) => void): void {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = x.toString();
        cell.dataset.y = y.toString();

        const cellContent = document.createElement('div');
        cellContent.className = 'cell-content';
        cellContent.innerHTML = Textures.CLOSED_CELL;

        cell.appendChild(cellContent);
        cell.addEventListener('click', () => onClick(x, y));
        this.gameBoard.appendChild(cell);
    }

    public updateCellContent(x: number, y: number, content: string): void {
        debugMessage(`updateCellContent(x: ${x}, y: ${y}, content: ${content})`);
        const cellContent = this.getCellContentElement(x, y);
        debugMessage(`cellContent = ${cellContent}`);
        if (cellContent) {
            cellContent.innerHTML = content;
        }
    }

    public setCellFraction(x: number, y: number, numerator: number, denominator: number = 12): void {
        const cell = this.getCellElement(x, y);
        if (!cell) return;

        cell.classList.add('opened');
        const cellContent = this.getCellContentElement(x, y);
        
        if (cellContent) {
            cellContent.innerHTML = Textures.OPENED_CELL;
            
            if (numerator > 0) {
                this.createFractionElement(cellContent, numerator, denominator);
            }
        }
    }

    private createFractionElement(parent: HTMLElement, numerator: number, denominator: number): void {
        const fractionElement = document.createElement('div');
        fractionElement.className = 'cell-fraction';
        fractionElement.textContent = `${numerator}/${denominator}`;
        parent.appendChild(fractionElement);
    }

    public updateCellFraction(x: number, y: number, numerator: number, denominator: number = 12): void {
        const fractionElement = this.getFractionElement(x, y);
        
        if (fractionElement) {
            fractionElement.textContent = `${numerator}/${denominator}`;
        } else {
            this.setCellFraction(x, y, numerator, denominator);
        }
    }

    private getCellElement(x: number, y: number): HTMLElement | null {
        return this.gameBoard.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    }

    private getCellContentElement(x: number, y: number): HTMLElement | null {
        return this.getCellElement(x, y)?.querySelector('.cell-content') ?? null;
    }

    private getFractionElement(x: number, y: number): HTMLElement | null {
        return this.getCellElement(x, y)?.querySelector('.cell-fraction') ?? null;
    }
}

// signal.ts
export class Signal<T = void> {
    private handlers: Array<(data: T) => void> = [];

    public connect(handler: (data: T) => void): void {
        this.handlers.push(handler);
    }

    public emit(data: T): void {
        this.handlers.forEach(handler => handler(data));
    }

    public disconnectAll(): void {
        this.handlers = [];
    }
}