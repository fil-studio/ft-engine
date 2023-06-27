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

const LoadAudioFile = async (ctx:AudioContext, filePath:string):Promise<AudioBuffer> => {
	const response = await fetch(filePath);
	const arrayBuffer = await response.arrayBuffer();
	const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
	return audioBuffer;
}

export interface GeneratedAudio {
	context: AudioContext,
	buffer: AudioBuffer
}

export class AudioGenerator {
	static async getAudio(path: string): Promise<GeneratedAudio> {
		const context = new AudioContext();

		const buffer = await LoadAudioFile(context, path);

		return {
			context,
			buffer
		};
	}
}