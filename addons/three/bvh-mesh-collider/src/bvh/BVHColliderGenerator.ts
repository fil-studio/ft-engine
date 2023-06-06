import { AddonData } from "@ft-engine/core";
import { BufferAttribute, BufferGeometry, InstancedMesh, InterleavedBufferAttribute, Matrix4, Mesh, MeshBasicMaterial, Scene } from "three";
import { MeshBVH, MeshBVHVisualizer, StaticGeometryGenerator } from "three-mesh-bvh";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export interface MeshColliderData {
    mesh:string;
}

export interface BVHMeshColliderData extends AddonData {
    instances:Record<string, MeshColliderData>;
    data: {
        depth:number
    }
}

export function interleaved2buffers(geo:BufferGeometry, attributes:string[]=["position"]):BufferGeometry {
    if(!geo.attributes.position['isInterleavedBufferAttribute']) {
        console.warn('Gemoetry must have interleaved buffers, returning input geometry...');
        return geo;
    }
    const g = new BufferGeometry();
    g.index = geo.index;

    for(const a of attributes) {
        const attr = geo.attributes[a] as InterleavedBufferAttribute;
        const count = attr.data.count;
        const siz = attr.itemSize;
        const stride = attr.data.stride;
        const offset = attr.offset;
        const arr = new Float32Array(siz * count);

        for(let i=0; i<count; i++) {
            for(let j=0;j<siz;j++) {
                arr[i*siz + j] = attr.array[i*stride + offset + j];
            }
        }

        g.setAttribute(a, new BufferAttribute(arr, siz));
    }

    return g;
}

export class BVHColliderGenerator {
    static generate(scene:Scene, data:BVHMeshColliderData ):BufferGeometry {
        const geos = [];
        const meshes = [];
        const tmp = new Matrix4();
        scene.traverse(obj => {
            if(obj.type === "Mesh") {
                if(obj['isInstancedMesh']) {
                    const im = obj as InstancedMesh;
                    console.log(`Found Instanced Mesh with ${im.count} instances`);

                    for(let i=0; i<im.count;i++) {
                        const mesh = new Mesh(im.geometry);
                        im.getMatrixAt(i, tmp);
                        mesh.applyMatrix4(tmp);
                        mesh.updateMatrixWorld(true);
                        meshes.push(mesh);
                    }
                } else {
                    if(data.instances[obj.uuid]) {
                        meshes.push(obj as Mesh);
                    }
                    // editor only
                    else if(obj.userData.isInstance && data.instances[obj.userData.instanceSeed.uuid]) {
                        meshes.push(obj as Mesh);
                    }
                }
            }
        });
        
        if(!meshes.length) return null;

        for(const mesh of meshes) {
            let geom;
            if(mesh.geometry.attributes.position.isInterleavedBufferAttribute) {
                geom = interleaved2buffers(mesh.geometry.clone());
                
            } else {
                geom = mesh.geometry.clone();
                for(const a in geom.attributes) {
                    if (a !== 'position') delete geom.attributes[a];
                }
            }
            geom.applyMatrix4( mesh.matrixWorld );
            geos.push(geom);
        }

        const geo = mergeGeometries(geos);
        const newMesh = new Mesh(geo, new MeshBasicMaterial());
        // environment.add( newMesh );

        const staticGenerator = new StaticGeometryGenerator(newMesh);
        staticGenerator.attributes = ['position'];

        const mergedGeometry = staticGenerator.generate();
        mergedGeometry.boundsTree = new MeshBVH( mergedGeometry, {
            maxDepth: data.data.depth
        } );

        return mergedGeometry;
    }

    static getVisualizer(collider:Mesh, depth:number=3):MeshBVHVisualizer {
        return new MeshBVHVisualizer(collider, depth);
    }
}