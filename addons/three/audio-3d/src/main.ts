import { AddonData } from "@ft-engine/core";
import { Vector3 } from "three";

// Veure que falta aqui
export interface Audio3DData {
    uid: string,
    innerRadius: number,
    outerRadius: number,
    position: Vector3
}

export interface AudioAddonData extends AddonData {
    instances: Record<string, Audio3DData>
}
