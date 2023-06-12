import { Color, MeshBasicMaterial, MeshBasicMaterialParameters, Shader, ShaderChunk, ShaderLib, Texture, UniformsLib, WebGLRenderer } from "three";

import { injectVFXBasics } from "@fils/vfx";

export class MeshUnlitMaterial extends MeshBasicMaterial {
    emissive:Color = new Color( 0x000000 );
    emissiveIntensity = 1;
    emissiveMap:Texture = null;

    constructor(params?:MeshBasicMaterialParameters) {
        super(params);
        // this.type = "MeshUnlitMaterial";
    }

    onBeforeCompile(shader: Shader, renderer: WebGLRenderer): void {
        let fs = shader.fragmentShader;
        fs = fs.replace(`uniform float opacity;`, `uniform float opacity;uniform vec3 emissive;`)
        fs = fs.replace(`#include <lightmap_pars_fragment>`, `#include <lightmap_pars_fragment>
        #include <emissivemap_pars_fragment>`);
        fs = fs.replace(`#include <clipping_planes_fragment>`, `#include <clipping_planes_fragment>
        vec3 totalEmissiveRadiance = emissive;`);
        fs = fs.replace(`vec3 outgoingLight = reflectedLight.indirectDiffuse;`, `vec3 outgoingLight = reflectedLight.indirectDiffuse + totalEmissiveRadiance;`);
        shader.fragmentShader = fs;
        shader.uniforms.emissive = { value: /*@__PURE__*/ new Color( 0x000000 ) };
        for(const k in UniformsLib.emissivemap) {
            ShaderLib.basic.uniforms[k] = UniformsLib.emissivemap[k];
        }
        injectVFXBasics(shader, true);
    }
}