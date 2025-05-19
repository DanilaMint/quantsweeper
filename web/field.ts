export class FieldManager {
    private readonly field : JQuery<HTMLElement>;
    private onTileInteract : ( x : number, y : number ) => void;

    constructor(onTileInteract : ( x : number, y : number ) => void) {
        this.field = $('#game-field');
        this.onTileInteract = onTileInteract;
    }

    private getTile(x : number, y : number): JQuery<HTMLElement> {
        return $(`.tile[x="${x}"][y="${y}"]`);
    }

    private setTileFraction(x : number, y : number, numerator : number, denominator : number): void {
        let content = '';
        if (numerator != 0) {
            if (denominator == 1) {
                content = numerator.toString();
            }
            else {
                content = `${numerator}/${denominator}`;
            }
        }
        this.getTile(x, y).text(content);
    }

    public createBoard(width : number, height : number): void {
        this.field.html('');
        for (let y = 0; y < height; y++) {
            const row = $('<div class="tile-row"></div>');
            for (let x = 0; x < width; x++) {
                const tile = $(`<div class="tile tile-closed" x="${x}" y="${y}"></div>`);
                tile.on('click', _ => this.onTileInteract(x, y));

                row.append(tile);
            }
            this.field.append(row);
        }
    }

    public clearTile(x : number, y : number): void {
        const tile = this.getTile(x, y);
        tile.removeClass();
        tile.addClass('tile');
    }

    public setTileClosed(x : number, y : number): void {
        const tile = this.getTile(x, y);
        tile.addClass('tile-closed');
    }

    public setTileOpened(x : number, y : number, numerator : number = 0, denominator : number = 1): void {
        const tile = this.getTile(x, y);
        tile.addClass('tile-opened');
        this.setTileFraction(x, y, numerator, denominator);
    }

    public setTileMine(x : number, y : number): void {
        const tile = this.getTile(x, y);
        tile.addClass('tile-opened');
        tile.addClass('tile-mine');
    }

    public setTileFlag(x : number, y : number): void {
        const tile = this.getTile(x, y);
        tile.addClass('tile-closed');
        tile.addClass('tile-flag');
    }

    public setTileRightFlag(x : number, y : number): void {
        const tile = this.getTile(x, y);
        tile.addClass('tile-closed');
        tile.addClass('right-flag');
    }

    public setTileQuantFlag(x : number, y : number): void {
        const tile = this.getTile(x, y);
        tile.addClass('tile-closed');
        tile.addClass('tile-quant');
    }
}
