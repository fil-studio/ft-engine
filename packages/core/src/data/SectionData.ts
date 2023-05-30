export interface PluginData {
    type:string;
    data:Record<string, any>;
}

export interface SectionData {
    id:string;
    data:Record<string, Object>;
    plugins?:PluginData[];
}