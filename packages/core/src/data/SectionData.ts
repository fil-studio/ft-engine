export interface AddonData {
    type:string;
    data:Record<string, Object>;
}

export interface SectionData {
    id:string;
    data:Record<string, Object>;
    addons?:Record<string, AddonData>;
}