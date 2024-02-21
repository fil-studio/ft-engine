import { AddonData } from "@ft-engine/core";
import { Vector3 } from "three";

// File and data saved for each file
export interface AudioFile {
	name: string,
	format: "wav" | "mp3"
}

// Data saved about each instance
export interface AudioData {
	fileId: string,
	innerRadius: number,
	outerRadius: number,
	position: Vector3
}

// All live data, files and instances
export interface AudioAddonData extends AddonData {
	data: Record<string, AudioFile>;
	instances: Record<string, AudioData>;
}

export interface Audio {
	data: AudioFile;
	context: AudioContext,
	buffer: AudioBuffer
}