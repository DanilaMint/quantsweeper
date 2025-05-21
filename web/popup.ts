export class PopupManager {
    private readonly popups = {
        newGame: $('#popup-new-game'),
        howToPlay: $('#popup-instruction')
    };

    constructor() {
        this.initHandles();
    }

    private initHandles(): void {
        this.popups.howToPlay.on('click', () => this.closePopup());
    }

    public closePopup(): void {
        Object.values(this.popups).forEach(p => p.removeClass('active'));
    }

    public showNewGamePopup(): void {
        this.popups.newGame.addClass('active');
    }

    public showHowToPlayPopup(): void {
        this.popups.howToPlay.addClass('active');
    }
}
