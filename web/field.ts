export class FieldManager {
    private readonly field = $('#game-field');
    
    constructor(private readonly onTileInteract: (x: number, y: number) => void) {}

    private getTile(x: number, y: number): JQuery<HTMLElement> {
        return $(`.tile[x="${x}"][y="${y}"]`);
    }

    private setTileContent(x: number, y: number, numerator: number, denominator = 1): void {
        const content = numerator === 0 ? '' : 
                      denominator === 1 ? numerator.toString() : 
                      `${numerator}/${denominator}`;
        this.getTile(x, y).text(content);
    }

    private updateTileClasses(x: number, y: number, add: string[], remove: string[] = []): void {
        const tile = this.getTile(x, y);
        tile.removeClass(remove.join(' ')).addClass(add.join(' '));
    }

    public createBoard(width: number, height: number): void {
        const tileSize = Math.min((Math.min($('.game-frame').height(), $('.game-frame').width()) - 8) / height, 35);
        this.field.empty().append(
            Array.from({ length: height }, (_, y) => 
                $('<div class="tile-row"></div>').append(
                    Array.from({ length: width }, (_, x) =>
                        $(`<div class="tile tile-closed" x="${x}" y="${y}"></div>`)
                            .on('click', () => this.onTileInteract(x, y))
                    )
                )
            )
        );
        this.field.css('--tile-size', `${tileSize}px`)
    }

    public resetTile(x: number, y: number): void {
        this.updateTileClasses(x, y, ['tile'], ['tile-closed', 'tile-opened', 'tile-flag', 'tile-quant', 'tile-mine', 'right-flag']);
    }

    public setTileClosed(x: number, y: number): void {
        this.updateTileClasses(x, y, ['tile', 'tile-closed']);
    }

    public setTileOpened(x: number, y: number, numerator = 0, denominator = 1): void {
        this.updateTileClasses(x, y, ['tile', 'tile-opened']);
        this.setTileContent(x, y, numerator, denominator);
    }

    public setTileMine(x: number, y: number): void {
        this.updateTileClasses(x, y, ['tile', 'tile-opened', 'tile-mine']);
    }

    public setTileFlag(x: number, y: number): void {
        this.updateTileClasses(x, y, ['tile', 'tile-closed', 'tile-flag']);
    }

    public setTileRightFlag(x: number, y: number): void {
        this.updateTileClasses(x, y, ['tile', 'tile-closed', 'right-flag']);
    }

    public setTileQuantFlag(x: number, y: number): void {
        this.updateTileClasses(x, y, ['tile', 'tile-closed', 'tile-quant']);
    }
}
