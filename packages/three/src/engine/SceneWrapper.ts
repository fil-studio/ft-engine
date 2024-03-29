import { Scene, WebGLRenderer } from "three";
import { AnimationDescriptor, SceneData, SceneParser } from "./SceneParser";
import { MaterialLib } from "./MaterialLib";
import { TextureLib } from "./TextureLib";
import { AddonData } from "@ft-engine/core";

export interface SceneWrapperSettings {
    applyHDRI?:boolean;
    applyBackgroundTexture?:boolean;
}

export class SceneWrapper {
    id:string;
    scene:Scene;
    animations:AnimationDescriptor[] = [];
    materialLib:MaterialLib;
    textureLib:TextureLib;
    protected loaded:boolean = false;
    protected settings:SceneWrapperSettings;

    data:SceneData;
    addons:Record<string, AddonData>;

    constructor(_id:string, mLib:MaterialLib, _settings?:SceneWrapperSettings) {
        this.id = _id;
        this.scene = new Scene();
        this.materialLib = mLib;
        this.settings = _settings ? _settings : null;
    }

    load(onLoaded:Function=()=>{},onProgress:Function=(progress:number)=>{}) {
        if(this.loaded) return;

        SceneParser.load(
            this.id,
            this.materialLib,
            (els, data, tLib, addons) => {
                this.textureLib = tLib;
				for(const el of els) {
					this.scene.add(el);
				}
				const animations = SceneParser.initAnimations(data, this.scene);
				// console.log(animations);
				this.animations = animations;
                this.onLoaded(data, addons);
                onLoaded();
			},
			(progress:number) => {
				onProgress(progress);
			}
        );
    }

    protected onLoaded(data:SceneData, addons?:Record<string, AddonData>) {
        if(this.loaded) return;
        this.loaded = true;
        this.data = data;
        this.addons = addons;
        if(!this.settings) return;
        if(this.settings.applyBackgroundTexture) {
            SceneParser.applyBackgroundTextureToScene(this.scene, data.settings, this.textureLib);
        }

        if(this.settings.applyHDRI) {
            SceneParser.applyHDRIToScene(this.scene, data.settings, this.textureLib);
        }
    }

    render(renderer:WebGLRenderer, time:number) {

    }

    update(time:number, dt:number) {
        for(const ani of this.animations) {
            ani.mixer.update(dt);
        }
    }

    dispose() {
        for(const mid in this.materialLib.materials) {
            const mat = this.materialLib.materials[mid];
            mat.dispose();
        }

        for(const tid in this.textureLib.textures) {
            const tex = this.textureLib.textures[tid];
            tex.dispose();
        }
    }
}