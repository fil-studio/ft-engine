import { AddonData } from "@ft-engine/core";
import { Vector3 } from "three";
export interface AudioData {
    uid: string,
    pan: number,
    volume: number
}
export interface Audio3DData extends AudioData {
    innerRadius: number,
    outerRadius: number,
    position: Vector3
}

export interface AudioAddonData extends AddonData {
    instances: Record<string, AudioData | Audio3DData>
}
