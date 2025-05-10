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