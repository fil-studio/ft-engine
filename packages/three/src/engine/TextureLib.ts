import { Texture, TextureLoader, Vector2, WebGLRenderer } from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

export interface TextureDefinition {
    uuid:string;
    data:Record<string,TextureProperty>;
    format:"jpg"|"png"|"webp";
    ktx:KTXData;
}

export type KTXData = {
    enabled:boolean;
    generated:boolean;
    clevel:number;
    qlevel:number;
}

export type TextureProperty = boolean|number|string|Vector2;

export const TextureDefaults = new Texture();

export const tLoader = new TextureLoader();
export const ktx2Loader = new KTX2Loader();
tLoader.crossOrigin = 'anonymous';

const blackList = ['mipmaps', 'matrix', 'uuid', 'image', 'source', 'userData', 'format', 'generateMipmaps'];

export function setTextureProperties(texture: Texture, props: TextureDefinition) {
    const data = props.data;
    const def = TextureDefaults;
    if(texture === null) return console.warn(`Texture ${props.uuid} is null!`);
    for (const key in data) {
        if(blackList.indexOf(key) > -1) continue;
        if (def[key] instanceof Vector2) {
            const v2 = texture[key] as Vector2;
            v2.set(data[key]['x'], data[key]['y']);
        } else {
            texture[key] = data[key];
        }
    }
}

export function compareTextureValues(value1: TextureProperty, value2: TextureProperty): boolean {
    if (typeof value1 !== typeof value2) {
        console.warn("Properties must be of same type!");
        return false;
    }
    if (value1 instanceof Vector2) {
        if (!(value2 instanceof Vector2)) {
            console.warn("Properties must be of same type!");
            return false;
        }
        return value1.equals(value2);
    }

    return value1 === value2;
}

export class TextureLib {
    textures:Record<string, Texture> = {};
    protected data:Record<string, TextureDefinition> = {};
    type:string = "TextureLib";
    protected baseURL:string = "/assets/textures/";

    constructor(renderer:WebGLRenderer) {
        ktx2Loader.setTranscoderPath("https://workers.fil.works/libs/basis/");
        ktx2Loader.detectSupport(renderer);
    }

    setBasePath(url:string) {
        this.baseURL = url;
    }

    copyParams (uuid: string, texture: Texture) {
        setTextureProperties(texture, this.data[uuid]);
        texture.uuid = uuid;
        texture.flipY = this.data[uuid].data['flipY'] === false ? false : true;
        texture.generateMipmaps = !this.data[uuid].ktx.enabled;
        texture.needsUpdate = true;
        this.textures[uuid] = texture;
    }

    import(_data:Record<string, TextureDefinition>, onTexturesLoaded:Function=()=>{}, onProgress:Function=(progress:number)=>{}) {
        this.data = _data;
        let tLoaded = 0;
        let tLen = 0;

        const onLoaded = () => {
            tLoaded++;

            onProgress(tLoaded/tLen);
            if(tLoaded === tLen) {
                onTexturesLoaded();
            }
        }

        for(const uuid in _data) {
            tLen++;
            this.initTexture(uuid, onLoaded);
        }

        if(tLen === 0) onTexturesLoaded();
    }

    initTexture(uuid:string, callback:Function=(texture)=>{}):Texture {

        if(this.data[uuid]) {
            if(!this.textures[uuid]) {
                return this.loadTexture(uuid, callback);
            } else return this.textures[uuid];
        }

        return null;
    }

    loadTexture(uuid:string, callback:Function=(texture)=>{}):Texture {
        const isKTX = this.data[uuid].ktx.enabled && this.data[uuid].ktx.generated;
        let path = isKTX ?
         `${this.baseURL}${uuid}/compressed.ktx2` :
         `${this.baseURL}${uuid}/original.${this.data[uuid].format}`;

        if (isKTX) {
            ktx2Loader.load(path, (texture) => {
                this.copyParams(uuid, texture);
                callback(texture);
            });
        } else {
            const texture = tLoader.load(path, (texture) => {
                this.copyParams(uuid, texture);
                callback(texture);
            });
            return texture;
        }
    }

    getTexture(uuid:string):Texture {
        return this.textures[uuid] || null;
    }
}