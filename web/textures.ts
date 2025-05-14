export class Textures {
    static get CLOSED_CELL(): string {
        return require('!!raw-loader!../res/tiles/closed.svg').default;
    }

    static get SIMPLE_FLAG(): string {
        return require('!!raw-loader!../res/tiles/flag.svg').default;
    }

    static get QUANT_FLAG(): string {
        return require('!!raw-loader!../res/tiles/quant.svg').default;
    }

    static get OPENED_CELL(): string {
        return require('!!raw-loader!../res/tiles/opened.svg').default;
    }

    static get MINE_CELL(): string {
        return require('!!raw-loader!../res/tiles/mine.svg').default;
    }

    static get RIGHT_FLAG(): string {
        return require('!!raw-loader!../res/tiles/rightpos.svg').default;
    }
}