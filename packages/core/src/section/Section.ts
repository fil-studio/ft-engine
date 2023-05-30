import { PluginData, SectionData } from "../data/SectionData";

export interface SectionDataListener {
	onSectionDataImported(data: Record<string, Object>, plugins?: Record<string, PluginData>);
}

/**
 * Section class
 * A section is a block that shows up in the menu
 * uid: formatted id for server storage
 * data: Pairs of ids and data objects
 */
export class Section {
	protected uid: string;
	data: Record<string, Object> = {};
	private listeners: Array<SectionDataListener> = [];
	private imported: boolean = false;
    plugins: Record<string, PluginData> = {};

	constructor(id: string) {
		this.uid = id;
	}

	get id(): string {
		return this.uid;
	}

	addDataListener(lis: SectionDataListener) {
		if (this.listeners.indexOf(lis) === -1) {
			this.listeners.push(lis);
		}
	}

	removeDataListener(lis: SectionDataListener) {
		this.listeners.splice(this.listeners.indexOf(lis), 1);
	}

	import(s: SectionData) {
		if (s.id !== this.uid) return console.warn('Wrong Section!');
		if (this.imported) return console.warn('Section already imported!');
		this.imported = true;
		this.data = s.data;
        this.plugins = s.plugins;
		this.onImport();
	}
	export(): SectionData {
		return {
			id: this.uid,
			data: this.data,
            plugins: this.plugins
		}
	}

	protected onImport() {
		for (const lis of this.listeners) {
            const sec = this.export();
			lis.onSectionDataImported(sec.data, sec.plugins);
		}
	}
}
