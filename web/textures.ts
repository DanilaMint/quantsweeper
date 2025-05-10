export class Textures {
    private static readonly BASE_CELL_STYLE = 
        `<rect x="1" y="1" width="28" height="28" rx="2" fill="#0000" stroke="#999" stroke-width="1"/>`;

    private static wrapSvg(content: string): string {
        return `<svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
    }

    static get CLOSED_CELL(): string {
        return this.wrapSvg(this.BASE_CELL_STYLE);
    }

    static get SIMPLE_FLAG(): string {
        return this.wrapSvg(`${this.BASE_CELL_STYLE}
            <path d="M10 25L10 5L20 10L10 15" fill="red" stroke-width="2" stroke="red"/>
        `);
    }

    static get QUANT_FLAG(): string {
        return this.wrapSvg(`${this.BASE_CELL_STYLE}
            <ellipse cx="0" cy="0" rx="12" ry="4.5" fill="#0000" stroke-width="1.3" stroke="#5C54C4" 
                transform="rotate(45),translate(21.21 0)"/>
            <ellipse cx="0" cy="0" rx="12" ry="4.5" fill="#0000" stroke-width="1.3" stroke="#5C54C4" 
                transform="rotate(-45),translate(0 21.21)"/>
            <circle cx="15" cy="15" r="2.5" fill="#5C54C4"/>
        `);
    }

    static get OPENED_CELL(): string {
        return this.wrapSvg(`${this.BASE_CELL_STYLE} fill="#eee"`);
    }

    static get MINE_CELL(): string {
        return this.wrapSvg(`
            <circle cx="14" cy="14" r="8" fill="#111"/>
            <path d="M14 14L14 3M14 14L3 14M14 14L25 14M14 14L14 25
                   M14 14L6 6M14 14L22 6M14 14L6 22M14 14L22 22" 
                  stroke-width="2" stroke="#111"/>
        `);
    }
}