import { debugMessage } from "./static";
import { Textures } from "./textures";

export class CellManager {
    constructor(private readonly gameBoard: JQuery<HTMLElement>) {
        debugMessage(`CellManager: Constructor called", ${this.gameBoard}`);
    }

    public createBoard(width: number, height: number, onClick: (x: number, y: number) => void): void {
        debugMessage(`createBoard: Start ${ width}, ${height }`);
        this.clearBoard();
        this.setBoardDimensions(width, height);
        this.populateBoard(width, height, onClick);
        debugMessage("createBoard: Finished");
    }

    private clearBoard(): void {
        debugMessage("clearBoard: Clearing the board");
        this.gameBoard.html('');
    }

    private setBoardDimensions(width: number, height: number): void {
        debugMessage(`setBoardDimensions: Setting dimensions ${ width}, ${height }`);
        this.gameBoard.css('grid-template-columns', `repeat(${width}, 30px)`);
        this.gameBoard.css('grid-template-rows', `repeat(${height}, 30px)`);
    }

    private populateBoard(width: number, height: number, onClick: (x: number, y: number) => void): void {
        debugMessage(`populateBoard: Populating cells ${ width}, ${height }`);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                debugMessage(`populateBoard: Creating cell (${x}, ${y})`);
                this.createCell(x, y, onClick);
            }
        }
    }

    private createCell(x: number, y: number, onClick: (x: number, y: number) => void): void {
        debugMessage(`createCell: Creating cell ${x}, ${y}`);
        const cell = $(`<div class="cell" data-x="${x}" data-y="${y}">${Textures.CLOSED_CELL}</div>`);
        cell.on('click', () => {
            debugMessage(`createCell: Clicked on cell (${x}, ${y})`);
            onClick(x, y);
        });
        this.gameBoard.append(cell); // Исправил .add() на .append(), т.к. .add() не добавляет в DOM
        debugMessage(`createCell: Cell added to the board ${cell}`);
    }

    public updateCellContent(x: number, y: number, content: string): void {
        debugMessage(`updateCellContent: Updating cell", ${x}, ${y}, ${content}`);
        const cell = this.getCellElement(x, y);
        if (!cell.length) {
            debugMessage(`updateCellContent: Cell not found!", ${x}, ${y}`);
            return;
        }
        cell.html(content);
    }

    public setCellFraction(x: number, y: number, numerator: number, denominator: number = 12): void {
        debugMessage(`setCellFraction: Setting fraction, ${x}, ${y}, ${numerator}, ${denominator}`);
        const cell = this.getCellElement(x, y);
        if (!cell.length) {
            debugMessage(`setCellFraction: Cell not found! ${x}, ${y}`);
            return;
        }

        cell.addClass('opened');
        cell.html(Textures.OPENED_CELL);

        if (numerator > 0) {
            const fractionElement = this.createFractionElement(numerator, denominator);
            cell.append(fractionElement); // Исправил .add() на .append()
            debugMessage(`setCellFraction: Fraction added ${ fractionElement }`);
        }
    }

    private createFractionElement(numerator: number, denominator: number): JQuery<HTMLElement> {
        debugMessage(`createFractionElement: Creating fraction ${ numerator}/${denominator}`);
        return $(`<div class='cell-fraction'>${numerator}/${denominator}</div>`);
    }

    private getCellElement(x: number, y: number): JQuery<HTMLElement> {
        const selector = `.cell[data-x="${x}"][data-y="${y}"]`;
        const cell = this.gameBoard.find(selector);
        debugMessage(`getCellElement: Finding cell (${x}, ${y}, ${selector}, ${cell} }`);
        return cell;
    }
}