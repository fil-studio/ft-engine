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

export interface AudioDataDescriptor {
	type: '2d' | '3d';
	data: AudioData | Audio3DData;
}

export interface AudioAddonData extends AddonData {
	instances: Record<string, AudioDataDescriptor>;
}
