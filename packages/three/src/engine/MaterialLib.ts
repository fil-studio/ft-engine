import { initMaterial } from "@fils/vfx";
import { Color, MeshPhongMaterial, MeshStandardMaterial, Texture, Vector2 } from "three";
import { MeshUnlitMaterial } from "./MeshUnlitMaterial";
import { TextureLib } from "./TextureLib";

export type MaterialProperty = number|boolean|string|Color|Texture|Vector2;
export type MaterialDataProperty = number|boolean|string|Object;

export type MaterialDefinition = {
    type:string;
    data:Record<string,MaterialProperty>; // depends on material type. can be extended
}

export type SceneMaterial = MeshUnlitMaterial|MeshPhongMaterial|MeshStandardMaterial;

const ObjectMaterialDefault = new MeshUnlitMaterial({
    name: 'Not assigned',
    color: 0xff00ff
});

const MaterialDefaults = {
    Unlit: new MeshUnlitMaterial(),//initMaterial(new MeshUnlitMaterial()) as MeshUnlitMaterial,
    Phong: initMaterial(new MeshPhongMaterial()) as MeshPhongMaterial,
    Standard: initMaterial(new MeshStandardMaterial()) as MeshStandardMaterial
}

export function getMaterialProperty(value:MaterialProperty):MaterialDataProperty {
    if(value instanceof Color) {
        const color = value as Color;
        return color.getHexString();
    } else if(value instanceof Texture && value != null) {
        return value.uuid;
    } else {
        return value;
    }
}

export function getMaterialDefaults(mat:SceneMaterial):SceneMaterial {
    if(mat instanceof MeshUnlitMaterial) return MaterialDefaults.Unlit;
    else if (mat instanceof MeshPhongMaterial) return MaterialDefaults.Phong;
    return MaterialDefaults.Standard;
}

/**
 * Compares two material properties of same type
 * @param value1 Material property one
 * @param value2 Material property two
 * @returns true if equal, false otherwise
 */
export function compareMaterialValues(value1:MaterialProperty, value2:MaterialProperty):boolean {
    if(typeof value1 !== typeof value2) {
        console.warn("Properties must be of same type!");
        return false;
    }
    if(value1 instanceof Color) {
        if(!(value2 instanceof Color)) {
            console.warn("Properties must be of same type!");
            return false;
        }
        return value1.equals(value2);
    } else if(value1 instanceof Texture) {
        if(!(value2 instanceof Texture)) {
            console.warn("Properties must be of same type!");
            return false;
        }
        return value1 === value2;
    } else if(value1 instanceof Vector2) {
        if(!(value2 instanceof Vector2)) {
            console.warn("Properties must be of same type!");
            return false;
        }
        return value1.equals(value2);
    }

    return value1 === value2;
}

const blackList = ['uuid', '_listeners', 'userData', 'defines', 'version', 'onBeforeCompile', 'shader'];
export function getMaterialData(mat:SceneMaterial):Record<string,MaterialProperty> {
    const data = {};
    const defaults = getMaterialDefaults(mat);

    for(const key in mat) {

        if(blackList.indexOf(key) > -1) continue;

        if(!compareMaterialValues(mat[key], defaults[key])) {
            data[key] = getMaterialProperty(mat[key]);
        }
    }

    return data;
}

export function setMaterialProperties(mat:SceneMaterial, props:MaterialDefinition, textureLibrary:TextureLib) {
    const data = props.data;

    const def = getMaterialDefaults(mat);
    for(const key in data) {
        if(def[key] === null || def[key] instanceof Texture) {
            mat[key] = textureLibrary.textures[data[key] as string];
        } else if(def[key] instanceof Color) {
            const col = mat[key] as Color;
            col.set(`#${data[key]}`);
        } else if (def[key] instanceof Vector2) {
            const v2 = mat[key] as Vector2;
            v2.set(data[key]['x'], data[key]['y']);
        } else {
            mat[key] = data[key];
        }
    }
}

/**
 * Standard Material Library.
 * Supports: unlit, phong, pbr
 */
export class MaterialLib {
    materials: Record<string, SceneMaterial> = {};
    type:string = "MaterialLibrary"

    constructor(){
        // console.log('Material Library initiated');
    }

    get default():SceneMaterial {
        return ObjectMaterialDefault;
    }

    getMaterialInstance(uuid:string, mat:MaterialDefinition, textureLibrary:TextureLib):SceneMaterial {
        let m:SceneMaterial;
        if(mat.type === "MeshBasicMaterial") {
            m = new MeshUnlitMaterial();//initMaterial(new MeshUnlitMaterial()) as MeshUnlitMaterial;
        } else if(mat.type === "MeshPhongMaterial") {
            m = initMaterial(new MeshPhongMaterial()) as MeshPhongMaterial;
        } else {
            m = initMaterial(new MeshStandardMaterial()) as MeshStandardMaterial;
        }
        m.uuid = uuid;
        setMaterialProperties(m, mat, textureLibrary);

        return m;
    }

    addMaterial(uuid:string, mat:MaterialDefinition, textureLibrary:TextureLib) {
        console.log(`Adding Material: ${uuid}`);

        if(this.materials[uuid]) {
            return console.warn(`Material ${uuid} already defined!`);
        }

        this.materials[uuid] = this.getMaterialInstance(uuid, mat, textureLibrary);
    }

    getMaterial(uuid:string):SceneMaterial {
        if(this.materials[uuid]) return this.materials[uuid];

        return this.default;
    }
}