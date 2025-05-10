import { TileStatus } from "../pkg/quantswepeer";

export enum ToolType {
    Shovel,
    SimpleFlag,
    QuantFlag
}

export interface TileData {
    status: TileStatus;
    probability: number;
    measured: boolean;
}

export interface GameConfig {
    width: number;
    height: number;
    groups: number;
    candidates: number;
}

export interface Position {
    x: number;
    y: number;
}

export const positionFromJSON = (data: any): Position => ({
    x: data.x,
    y: data.y
});