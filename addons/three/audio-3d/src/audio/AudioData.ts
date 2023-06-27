import { AddonData } from "@ft-engine/core";
import { Vector3 } from "three";

export interface AudioFile {
	name: string,
	format: "wav" | "mp3"
}
export interface AudioData {
	innerRadius: number,
	outerRadius: number,
	position: Vector3
}

export interface AudioDataDescriptor {
	fileId: string;
	data: AudioData;
}

export interface AudioAddonData extends AddonData {
	data: Record<string, AudioFile>;
	instances: Record<string, AudioDataDescriptor>;
}
