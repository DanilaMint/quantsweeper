export class FieldManager {
    private readonly field: JQuery<HTMLElement>;
    private readonly onTileInteract: (x: number, y: number) => void;

    constructor(onTileInteract: (x: number, y: number) => void) {
        this.field = $('#game-field');
        this.onTileInteract = onTileInteract;
    }

    private getTile(x: number, y: number): JQuery<HTMLElement> {
        return $(`.tile[x="${x}"][y="${y}"]`);
    }

    private setTileContent(x: number, y: number, numerator: number, denominator: number = 1): void {
        const content = numerator === 0 ? '' : 
                      denominator === 1 ? numerator.toString() : 
                      `${numerator}/${denominator}`;
        
        this.getTile(x, y).text(content);
    }

    private updateTileClasses(x: number, y: number, classesToAdd: string[], classesToRemove: string[] = []): void {
        const tile = this.getTile(x, y);
        tile.removeClass(classesToRemove.join(' '));
        tile.addClass(classesToAdd.join(' '));
    }

    public createBoard(width: number, height: number): void {
        this.field.empty();
        
        const rows = Array.from({ length: height }, (_, y) => 
            $('<div class="tile-row"></div>').append(
                Array.from({ length: width }, (_, x) => 
                    $(`<div class="tile tile-closed" x="${x}" y="${y}"></div>`)
                        .on('click', () => this.onTileInteract(x, y))
                )
            )
        );

        this.field.append(rows);
    }

    public resetTile(x: number, y: number): void {
        this.updateTileClasses(x, y, ['tile'], ['tile-closed', 'tile-opened', 'tile-flag', 'tile-quant', 'tile-mine', 'right-flag']);
    }

    public setTileClosed(x: number, y: number): void {
        this.updateTileClasses(x, y, ['tile', 'tile-closed']);
    }

    public setTileOpened(x: number, y: number, numerator: number = 0, denominator: number = 1): void {
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