export interface PluginData {
    type:string;
    data:Record<string, Object>;
}

export interface SectionData {
    id:string;
    data:Record<string, Object>;
    plugins?:Record<string, PluginData>;
}