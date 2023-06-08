/**
 * Data Format and Utils for exporting
 * and importing scenes from/to threejs.
 * Only BufferGeomeytry is supported.
 * Materials are just references to our
 * internal material libraries.
 * Inspired and based on ThreeJS internal
 * JSON format.
 */

import { AnimationClip, AnimationMixer, Bone, BufferAttribute, BufferGeometry, DirectionalLight, Group, InterleavedBuffer, InterleavedBufferAttribute, LoopOnce, LoopRepeat, MathUtils, Matrix4, Mesh, Object3D, OrthographicCamera, PMREMGenerator, PerspectiveCamera, PointLight, Scene, ShadowMapType, Skeleton, SkinnedMesh, TextureEncoding, ToneMapping, WebGLRenderer } from "three";
import { MaterialDefinition, MaterialLib } from "./MaterialLib";
import { TextureDefinition, TextureLib } from "./TextureLib";
import { io } from "@fils/io";
import { AddonData, ArrayLikeString, SectionData } from "@ft-engine/core";

export function applyMatrixToObject(obj:Object3D, m:Matrix4) {
    if(!obj) return;
    obj.matrixAutoUpdate = false;
    obj.matrix.identity();
    obj.applyMatrix4(m);
    obj.matrixAutoUpdate = true;
}

export type SceneSettings = {
    outputEncoding:TextureEncoding;
    toneMapping:ToneMapping;
    toneMappingExposure:number;
    shadows:boolean;
    shadowType?:ShadowMapType;
    shadowMapSize?:number;
    background:{
        color:string;
        alpha:number;
        texture?:string;
    }
    hdri?:string;
    fog?:FogSettings;
}

export enum FogType {
    LINEAR,
    EXPONENTIAL
}

export type LinearFogParams = {
    near:number;
    far:number;
}

export type ExponentialFogParams = {
    density:number;
}

export type FogSettings = {
    enabled:boolean;
    type:FogType;
    color:string;
    params:LinearFogParams|ExponentialFogParams;
}

export type InteleavedBufferData = {
    buffer:string;
    type:ArrayLikeString;
    stride:number;
}

export type GeometryAttributeData = {
    itemSize:number;
    offset?:number;
    type:ArrayLikeString;
    data:string|number[]; // string is a reference to interleaved buffer
}

export type GeometryData = {
    attributes:Record<string, GeometryAttributeData>;
    index:{
        type:string;
        data:number[];
    },
    interleavedBuffers:Record<string, InteleavedBufferData>;
    arrayBuffers:Record<string, number[]>;
}

export interface MeshData {
    material:string;
    geometry:string;
}

export interface SkinnedMeshData extends MeshData {
    bindMode:"attached"|"detached";
    bindMatrix:number[];
    skeleton:string;
}

export type PerspectiveCameraData = {
    fov:number;
    aspect:number;
    near:number;
    far:number;
}

export type OrthographicCameraData = {
    left:number;
    right:number;
    top:number;
    bottom:number;
    near:number;
    far:number;
}

export type DirectionalLightData = {
    color:string;
    intensity:number;
}

export type PointLightData = {
    color:string;
    intensity:number;
    distance:number;
    decay:number;
}

export type ObjectTypedData = MeshData|SkinnedMeshData|PerspectiveCameraData|OrthographicCameraData|DirectionalLightData|PointLightData;

export type ObjectData = {
    uuid:string;
    type:string;
    name:string;
    matrix:number[];
    visible?:boolean;
    fustrumCulled?:boolean;
    castShadow?:boolean;
    receiveShadow?:boolean;
    data?:ObjectTypedData;
    children:ObjectData[];
}

export type AnimationTrackData = {
    name:string;
    times:number[];
    values:number[];
    type:string;
}

export type AnimationData = {
    name:string;
    duration:number;
    blendMode:number;
    tracks:AnimationTrackData[];
}

export interface AnimationDescriptor {
    mixer:AnimationMixer;
    animations:AnimationClip[];
    root:Object3D;
    isPlaying:boolean;
}

export type SkeletonData = {
    bones:string[];
    boneInverses:number[][];
}

export type SceneData = {
    metadata:{
        version:string
        generator:string;
    },
    settings: SceneSettings;
    geometries:Record<string, GeometryData>;
    materials:Record<string, MaterialDefinition>;
    objects:ObjectData[];
    skeletons:Record<string, SkeletonData>;
    animations:Record<string, AnimationData[]>; // uuid of root node where to attach mixer
    textures:Record<string, TextureDefinition>;
}

// To-Do move ArrayLikeString and getArray to io package
function getArray(buff:number[], type:ArrayLikeString):ArrayLike<number> {
    switch(type) {
        case "Int8Array":
            return new Int8Array(buff);
        case "Uint8Array":
            return new Uint8Array(buff);
        case "Uint8ClampedArray":
            return new Uint8ClampedArray(buff);
        case "Int16Array":
            return new Int16Array(buff);
        case "Uint16Array":
            return new Uint16Array(buff);
        case "Int32Array":
            return new Int32Array(buff);
        case "Uint32Array":
            return new Uint32Array(buff);
        case "Float32Array":
            return new Float32Array(buff);
        case "Float64Array":
            return new Float64Array(buff);
    }
}

function parseGeometries(data:SceneData):Record<string, BufferGeometry> {
    const geom = {};
    for(const uuid in data.geometries) {
        const g = data.geometries[uuid];
        const buffers:Record<string, InterleavedBuffer> = {};

        for(const bid in g.interleavedBuffers) {
            const ibi = g.interleavedBuffers[bid];
            const abid = ibi.buffer;
            if(!buffers[abid]) {
                const buff = new InterleavedBuffer(getArray(g.arrayBuffers[abid], ibi.type), ibi.stride);
                buffers[bid] = buff;
            }
        }

        const geo = new BufferGeometry();
        for(const aid in g.attributes) {
            const attr = g.attributes[aid];
            if(typeof attr.data === 'string') {
                const a = new InterleavedBufferAttribute(buffers[attr.data], attr.itemSize, attr.offset);
                geo.setAttribute(aid, a);
            } else {
                const a = new BufferAttribute(getArray(attr.data, attr.type), attr.itemSize);
                geo.setAttribute(aid, a);
            }
        }

        geo.index = new BufferAttribute(getArray(g.index.data, g.index.type as ArrayLikeString), 1);
        geo.uuid = uuid;
        geom[uuid] = geo;

    }

    return geom;
}

function applyObjectBasics(obj:ObjectData, el:Object3D) {
    const m = new Matrix4().fromArray(obj.matrix);
    applyMatrixToObject(el, m);
    el.uuid = obj.uuid;
    el.name = obj.name;
    el.visible = obj.visible !== false;
    el.frustumCulled = obj.fustrumCulled !== false;
    el.castShadow = obj.castShadow === true;
    el.receiveShadow = obj.receiveShadow === true;
    el.updateMatrixWorld(true);
}

function parseBones(scene:Object3D[]):Record<string,Bone> {
    const r = {}

    for(const obj of scene) {
        obj.traverse((child) => {
            if(child['isBone'] === true) {
                r[child.uuid] = child;
            }
        });
    }

    return r;
}

function bindSkeletons(scene:Object3D[], skeletons:Record<string, SkeletonData>, bones:Record<string,Bone>) {
    for(const obj of scene) {
        obj.traverse((child) => {
            if(child['isSkinnedMesh'] === true && child['skeleton'] !== undefined) {
                const mesh = child as SkinnedMesh;
                const sk = mesh.skeleton;
                const skeleton = skeletons[sk.uuid];
                const b = [];
                const bi = [];

                for(let i=0;i<skeleton.boneInverses.length;i++) {
                    const binv = skeleton.boneInverses[i];
                    const bone = skeleton.bones[i];
                    if(!bones[bone]) {
                        console.warn('No bone found!');
                        const bn = new Bone();
                        bn.uuid = bone;
                        b.push(bn);
                    } else b.push(bones[bone]);
                    bi.push(new Matrix4().fromArray(binv));

                }

                sk.boneInverses = bi;
                sk.bones = b;
                sk.init();
                mesh.bind(sk, mesh.bindMatrix);
            }
        });
    }
}

export function parseScene(data:SceneData, materials:MaterialLib):Array<Object3D> {
    const geo = parseGeometries(data);
    const scene = parseObjects(data.objects, geo, materials);
    const bones = parseBones(scene);
    bindSkeletons(scene, data.skeletons, bones);

    return scene;
}

function parseObjects(objects:ObjectData[], geo:Record<string, BufferGeometry>, materials:MaterialLib, parent:Object3D=null):Array<Object3D> {
    const c:Array<Object3D> = [];

    for(const obj of objects) {
        let el:Object3D;
        if(obj.type === "PerspectiveCamera") {
            const data = obj.data as PerspectiveCameraData;
            el = new PerspectiveCamera(
                data.fov,
                data.aspect,
                data.near,
                data.far
            );

        } else if(obj.type === "OrthographicCamera") {
            const data = obj.data as OrthographicCameraData;
            el = new OrthographicCamera(
                data.left,
                data.right,
                data.top,
                data.bottom,
                data.near,
                data.far
            );
        } else if (obj.type === "DirectionalLight") {
            const data = obj.data as DirectionalLightData;
            el = new DirectionalLight(`#${data.color}`, data.intensity);
        } else if (obj.type === "PointLight") {
            const data = obj.data as PointLightData;
            el = new PointLight(`#${data.color}`, data.intensity, data.distance, data.decay);
        } else if (obj.type === "SkinnedMesh") {
            const data = obj.data as SkinnedMeshData;
            const mesh = new SkinnedMesh(
                geo[data.geometry],
                materials.getMaterial(data.material)
            ) as SkinnedMesh;
            mesh.skeleton = new Skeleton([]);
            mesh.skeleton.uuid = data.skeleton;
            mesh.bindMatrix.fromArray(data.bindMatrix);
            mesh.bindMode = data.bindMode;
            el = mesh;
        } else if (obj.type === "Mesh") {
            const data = obj.data as MeshData;
            el = new Mesh(
                geo[data.geometry],
                materials.getMaterial(data.material)
            );
        } else if (obj.type === "Bone") {
            el = new Bone();
        } else if (obj.type == "Group") {
            el = new Group();
        } else if (obj.type == "Object3D") {
            el = new Object3D();
        }

        if(el) {
            el.userData.selectable = true;
            applyObjectBasics(obj, el);
            if(parent) parent.add(el);
            else {
                c.push(el);
            }
            parseObjects(obj.children, geo, materials, el);
        }
    }

    return c;
}

export function getAnimationClips(animations:AnimationData[]):AnimationClip[] {
    const anis:AnimationClip[] = [];

    for(const ani of animations) {
        anis.push(
            AnimationClip.parse(ani)
        )
    }

    return anis;
}

export class SceneParser {
    static basePath:string="/assets/";
    static renderer:WebGLRenderer = null;

    static init(rnd:WebGLRenderer, url:string) {
        SceneParser.renderer = rnd;
        SceneParser.basePath = url;
    }

    static load(scene:string, mLib:MaterialLib, onLoaded:Function=(els, data, tLib, addons?:Record<string,AddonData> )=>{}, onProgress:Function=(progress:number)=>{}) {
        if(!SceneParser.renderer) {
            return console.warn("Scene Parser is not initialized!");
        }
        io.load(`${SceneParser.basePath}sections/${scene}.json.gz`, (res)=>{
            const section = JSON.parse(res) as SectionData;
            const data = section.data as SceneData;
            // console.log(data);
            onProgress( .4 );
            const t = new TextureLib(SceneParser.renderer);
            t.setBasePath(`${SceneParser.basePath}textures/`);
            t.import(data.textures, ()=>{
                for(const uuid in data.materials) {
                    mLib.addMaterial(uuid, data.materials[uuid], t);
                }
                const addons = section.addons;
                onLoaded(parseScene(data, mLib), data, t, addons);
            },
            (progress) => {
              onProgress(.4 + .6 * progress);
            })
        });
    }

    static initAnimations(data:SceneData, scene):AnimationDescriptor[] {
        const a = [];
        for (const uuid in data.animations) {
            const animation = data.animations[uuid];
            const root = scene.children.filter( object => object.uuid === uuid )[0];
            if(!root) {
                console.warn(`Didn't find animation's root node ${uuid}!!`);
            } else {
                const mixer = new AnimationMixer(root);
                const ani = {
                    mixer: mixer,
                    animations: getAnimationClips(animation),
                    root: root,
                    isPlaying: false
                }

                a.push(ani);
                mixer.addEventListener('finished', (event)=>{
                    ani.isPlaying = false;
                });
            }
        }

        return a;
    }

    static playAnimation(ani:AnimationDescriptor, k:number=0, loop:boolean=false, speed:number=1) {
        if(k < 0 || k > ani.animations.length-1) {
            return console.warn('Index out of bounds!');
        }
        const clip = ani.animations[k];
        const mixer = ani.mixer;
        ani.isPlaying = true;
        /* const runningAction = mixer.existingAction(clip);
        if(runningAction) {
            runningAction.stop();
        } */
        mixer.stopAllAction();
        mixer.uncacheClip(clip);
        const action = mixer.clipAction(clip);
        action.timeScale = speed;
        if(loop) action.setLoop(LoopRepeat, Infinity);
        else action.setLoop(LoopOnce, 1);
        action.play();
        
    }

    static applyHDRIToScene(scene:Scene, settings:SceneSettings, tLib:TextureLib) {
        if(!SceneParser.renderer) {
            return console.warn('No WebGL Renderer instance found!');
        }
        if (settings.hdri) {
            console.log('Applying HDRI', settings.hdri);
            const tex = tLib.getTexture(settings.hdri);
            const pmrem = new PMREMGenerator(SceneParser.renderer);
            const env = pmrem.fromEquirectangular(tex);
            scene.environment = env.texture;

        } else {
            console.warn('There is no HDRI defined. Skipping...');
        }
    }

    static applyBackgroundTextureToScene(scene:Scene, settings:SceneSettings, tLib:TextureLib) {
        if (settings.background.texture) {
            const tex = tLib.getTexture(settings.background.texture);
            scene.background = tex;

        } else {
            console.warn('There is no background texture defined. Skipping...');
        }
    }
    
    static applyToneMapping(settings:SceneSettings) {
        if(!SceneParser.renderer) {
            return console.warn('No WebGL Renderer instance found!');
        }
        SceneParser.renderer.outputEncoding = settings.outputEncoding as TextureEncoding;
        SceneParser.renderer.toneMapping = settings.toneMapping as ToneMapping;
        SceneParser.renderer.toneMappingExposure = settings.toneMappingExposure;

        SceneParser.renderer.shadowMap.enabled = settings.shadows;
        SceneParser.renderer.shadowMap.type = settings.shadowType as ShadowMapType;

        SceneParser.renderer.setClearColor(settings.background.color, settings.background.alpha);
    }

    static applyShadowSettings(settings:SceneSettings) {
        if(!SceneParser.renderer) {
            return console.warn('No WebGL Renderer instance found!');
        }
        SceneParser.renderer.shadowMap.enabled = settings.shadows;
        SceneParser.renderer.shadowMap.type = settings.shadowType as ShadowMapType;
    }

    static applyBackgroundColor(settings:SceneSettings) {
        if(!SceneParser.renderer) {
            return console.warn('No WebGL Renderer instance found!');
        }
        SceneParser.renderer.setClearColor(settings.background.color, settings.background.alpha);
    }

}