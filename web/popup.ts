export class PopupManager {
    private readonly newGamePopup : JQuery<HTMLElement>;
    private readonly howToPlayPopup : JQuery<HTMLElement>;

    constructor() {
        this.newGamePopup = $('#popup-new-game');
        this.howToPlayPopup = $('#popup-instruction');
        this.initHandles();
    }

    private initHandles(): void {
        this.howToPlayPopup.on('click', _ => this.closePopup());
        $(document).on('keydown', e => {
            if (e.key === 'Escape') this.closePopup();
        });
    }

    public closePopup(): void {
        this.newGamePopup.removeClass('active');
        this.howToPlayPopup.removeClass('active');
    }

    public showNewGamePopup(): void {
        this.newGamePopup.addClass('active');
    }

    public showHowToPlayPopup(): void {
        this.howToPlayPopup.addClass('active');
    }
}