import { AddonData } from "@ft-engine/core";
import { InstancedMesh, Matrix4, Mesh, Scene } from "three";

export interface InstanceData {
    mesh:string;
    instances:number[][]; // array of matrices
}

export interface MeshInstancingData extends AddonData {
    instances:Record<string, InstanceData>;
    data: {}
}

export class InstanceGenerator {
    static parseInstances(scene:Scene, data:MeshInstancingData) {
        const tmp = new Matrix4();

        const toAdd = [];

        scene.traverse(obj => {
            if(obj.type === "Mesh" && data.instances[obj.uuid]) {
                console.log(`Convert ${obj.name} to Instanced Mesh...`);
                const mesh = obj as Mesh;
                mesh.updateMatrix();
                const d = data.instances[mesh.uuid];
                const parent = mesh.parent;
                // parent.remove(mesh);
                const nI = d.instances.length + 1;
                const iM = new InstancedMesh(
                    mesh.geometry,
                    mesh.material,
                    nI
                );
                // iM.uuid = mesh.uuid;

                tmp.copy(mesh.matrix);
                iM.setMatrixAt(0, tmp);

                console.log(`${nI} instances found`);

                for(let i=0; i<d.instances.length; i ++) {
                    tmp.fromArray(d.instances[i]);
                    iM.setMatrixAt(i+1, tmp);
                }

                iM.instanceMatrix.needsUpdate = true;

                toAdd.push({
                    mesh,
                    parent,
                    iM
                });
            }
        })

        for(const t of toAdd) {
            t.parent.remove(t.mesh);
            t.iM.uuid = t.mesh.uuid;
            t.parent.add(t.iM);
        }
    }
}