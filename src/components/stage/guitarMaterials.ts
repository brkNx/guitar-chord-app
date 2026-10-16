import * as THREE from 'three';
import {
  BRIDGE,
  FRETBOARD_END_Y,
  NECK_JOINT_Y,
  NUT_Y,
  SCALE_LENGTH,
  SOUNDHOLE,
} from './guitarCalibration';

/**
 * The GLB ships a single gray material and no usable UVs, so wood regions are classified per
 * fragment from model-space position + normal (see guitarCalibration.ts for the measured numbers).
 */

const f = (n: number) => n.toFixed(5);

const MODEL_SPACE_VERTEX = /* glsl */ `
  varying vec3 vGPos;
  varying vec3 vGNrm;
`;

// GLB node space -> model space (scale 100, -90deg X): X = x, Y = z, Z = -y.
const MODEL_SPACE_ASSIGN = /* glsl */ `
  vGPos = vec3(position.x, position.z, -position.y) * 100.0;
  vGNrm = vec3(normal.x, normal.z, -normal.y);
`;

const WOOD_FRAGMENT_HEADER = /* glsl */ `
  varying vec3 vGPos;
  varying vec3 vGNrm;
  uniform float uNeckHover;

  float wHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float wNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 t = fract(x);
    t = t * t * (3.0 - 2.0 * t);
    return mix(
      mix(mix(wHash(i), wHash(i + vec3(1, 0, 0)), t.x), mix(wHash(i + vec3(0, 1, 0)), wHash(i + vec3(1, 1, 0)), t.x), t.y),
      mix(mix(wHash(i + vec3(0, 0, 1)), wHash(i + vec3(1, 0, 1)), t.x), mix(wHash(i + vec3(0, 1, 1)), wHash(i + vec3(1, 1, 1)), t.x), t.y),
      t.z);
  }
  float wFbm(vec3 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * wNoise(p); p *= 2.03; a *= 0.5; }
    return s;
  }
  // Straight grain lines running along the guitar's length (Y); faded out when sub-pixel.
  float wGrain(float across, vec3 p, float density, float warp) {
    float w = (wFbm(p * vec3(40.0, 2.5, 40.0)) - 0.5) * warp;
    float phase = (across + w) * density;
    float aa = clamp(1.0 - fwidth(phase) * 0.35, 0.0, 1.0);
    return (0.5 + 0.5 * sin(phase)) * aa;
  }
`;

const WOOD_COLOR = /* glsl */ `
  vec3 p = vGPos;
  vec3 nn = normalize(vGNrm);
  float ax = abs(p.x);
  float woodRough = 0.42;
  float woodCoat = 1.0;
  float neckMask = 0.0;
  vec3 col;

  const vec3 SPRUCE = vec3(0.74, 0.47, 0.21);
  const vec3 SPRUCE_LATE = vec3(0.55, 0.31, 0.12);
  const vec3 ROSE = vec3(0.21, 0.085, 0.04);
  const vec3 ROSE_DARK = vec3(0.075, 0.03, 0.016);
  const vec3 MAHOGANY = vec3(0.34, 0.14, 0.065);
  const vec3 MAHOGANY_DARK = vec3(0.20, 0.075, 0.035);
  const vec3 EBONY = vec3(0.035, 0.024, 0.018);
  const vec3 BONE = vec3(0.90, 0.86, 0.76);
  const vec3 HOLE = vec3(0.012, 0.008, 0.006);

  float fbHalf = 0.021 + 0.01429 * (${f(NUT_Y)} - p.y);
  float holeD = length(p.xy - vec2(0.0, ${f(SOUNDHOLE.y)}));

  if (!gl_FrontFacing || (holeD < ${f(SOUNDHOLE.radius + 0.002)} && p.z < 0.049 && p.y < ${f(FRETBOARD_END_Y)})) {
    // Interior seen through the soundhole.
    col = HOLE;
    woodRough = 0.95;
    woodCoat = 0.0;
  } else if (p.y > ${f(NUT_Y + 0.004)}) {
    // Headstock: glossy dark veneer face, mahogany back/sides.
    if (nn.z > 0.45 && p.z > 0.02) {
      col = EBONY * (0.9 + 0.3 * wFbm(p * vec3(300.0, 60.0, 300.0)));
      woodRough = 0.3;
    } else {
      col = mix(MAHOGANY, MAHOGANY_DARK, wGrain(p.x + p.z, p, 1600.0, 0.006) * 0.6);
    }
    neckMask = 1.0;
  } else if (p.y > ${f(NUT_Y - 0.0035)} && ax < 0.024 && p.z > 0.05) {
    col = BONE;
    woodRough = 0.35;
    neckMask = 1.0;
  } else if (p.y > ${f(NECK_JOINT_Y)} && ax < 0.034) {
    if (p.z > 0.0525) {
      // Rosewood fretboard: dark, open pored, satin.
      float pores = wFbm(p * vec3(900.0, 70.0, 900.0));
      col = mix(EBONY, vec3(0.10, 0.055, 0.035), wGrain(p.x, p, 2200.0, 0.004) * 0.5 + pores * 0.35);
      woodRough = 0.72;
      woodCoat = 0.15;
    } else {
      col = mix(MAHOGANY, MAHOGANY_DARK, wGrain(p.x + p.z * 0.5, p, 1500.0, 0.006) * 0.55);
      woodRough = 0.4;
    }
    neckMask = 1.0;
  } else {
    bool topFace = nn.z > 0.6 && p.z > 0.044;
    if (topFace && p.y > ${f(FRETBOARD_END_Y)} && ax < fbHalf + 0.0006 && p.z > 0.052) {
      float pores = wFbm(p * vec3(900.0, 70.0, 900.0));
      col = mix(EBONY, vec3(0.10, 0.055, 0.035), pores * 0.4);
      woodRough = 0.72;
      woodCoat = 0.15;
    } else if (topFace && holeD < ${f(SOUNDHOLE.radius)}) {
      col = HOLE;
      woodRough = 0.95;
      woodCoat = 0.0;
    } else if (p.y > ${f(BRIDGE.minY)} && p.y < ${f(BRIDGE.maxY)} && ax < ${f(BRIDGE.halfWidth)} && p.z > 0.0512) {
      // Rosewood bridge with bone saddle.
      col = p.z > 0.0606 && ax < 0.04 ? BONE : mix(ROSE_DARK, ROSE, wFbm(p * vec3(500.0, 80.0, 500.0)) * 0.6);
      woodRough = 0.4;
    } else if (topFace) {
      // Sitka spruce top: tight straight grain + soft medullary flecks.
      float g = wGrain(p.x, p, 900.0, 0.01);
      float g2 = wGrain(p.x * 1.7 + 0.3, p, 2600.0, 0.004);
      col = mix(SPRUCE, SPRUCE_LATE, smoothstep(0.55, 1.0, g) * 0.45 + g2 * 0.12);
      col *= 0.94 + 0.12 * wFbm(p * vec3(18.0, 6.0, 18.0));
      // Rosette rings around the soundhole.
      float rr = holeD - ${f(SOUNDHOLE.radius)};
      if (rr < 0.017) {
        float outer = step(0.0035, rr) * (1.0 - step(0.0145, rr));
        col = mix(col, ROSE_DARK, outer * 0.9);
        float pearl = (step(0.0062, rr) - step(0.0078, rr)) + (step(0.0101, rr) - step(0.0117, rr));
        col = mix(col, vec3(0.62, 0.66, 0.60), pearl * 0.8);
        float lip = 1.0 - step(0.0016, rr);
        col = mix(col, ROSE_DARK, lip);
      }
      // Tortoise pickguard on the bass side below the soundhole.
      vec2 q = (p.xy - vec2(-0.078, 0.292));
      q = mat2(0.94, 0.34, -0.34, 0.94) * q;
      float guard = length(q / vec2(0.042, 0.07));
      if (guard < 1.0 && rr > 0.016) {
        float tort = wFbm(p * vec3(260.0, 260.0, 260.0));
        col = mix(vec3(0.05, 0.018, 0.008), vec3(0.32, 0.12, 0.03), smoothstep(0.45, 0.85, tort));
        woodRough = 0.25;
      }
      woodRough = min(woodRough, 0.45);
    } else {
      // East Indian rosewood back and sides.
      float across = nn.z < -0.6 ? abs(p.x) : (p.z + p.x * 0.3);
      float g = wGrain(across, p, 1100.0, 0.012);
      col = mix(ROSE, ROSE_DARK, smoothstep(0.35, 1.0, g) * 0.75);
      col *= 0.85 + 0.3 * wFbm(p * vec3(12.0, 4.0, 12.0));
      // Cream binding along the soundboard edge.
      if (p.z > 0.0455 && abs(nn.z) < 0.6) col = vec3(0.86, 0.80, 0.66);
      woodRough = 0.38;
    }
  }
  diffuseColor.rgb = col;
`;

/** Lacquered acoustic body material (MeshPhysical + procedural regions + clearcoat). */
export function createWoodMaterial(neckHover: { value: number }): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNeckHover = neckHover;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${MODEL_SPACE_VERTEX}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${MODEL_SPACE_ASSIGN}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${WOOD_FRAGMENT_HEADER}`)
      .replace('#include <color_fragment>', WOOD_COLOR)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = woodRough;')
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.55, 0.32, 0.06) * 0.22 * uNeckHover * neckMask;'
      )
      .replace(
        '#include <lights_physical_fragment>',
        THREE.ShaderChunk.lights_physical_fragment.replace(
          'material.clearcoat = clearcoat;',
          'material.clearcoat = clearcoat * woodCoat;'
        )
      );
  };
  mat.customProgramCacheKey = () => 'guitar-wood-v1';
  return mat;
}

export interface StringUniforms {
  uAmp: { value: number };
  uTime: { value: number };
  uOffsetZ: { value: number };
}

/**
 * Metal string with a vertex-shader vibration: only the speaking length (nut -> saddle)
 * moves, shaped by sin(pi * t). Amplitude decays from the stage (uAmp).
 */
export function createStringMaterial(wound: boolean, uniforms: StringUniforms): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: wound ? new THREE.Color(0.78, 0.53, 0.3) : new THREE.Color(0.86, 0.87, 0.9),
    metalness: 1,
    roughness: wound ? 0.34 : 0.18,
    emissive: new THREE.Color(0.96, 0.62, 0.04),
    emissiveIntensity: 0,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uAmp;\nuniform float uTime;\nuniform float uOffsetZ;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float modelY = (position.z + uOffsetZ) * 100.0;
        float st = clamp((${f(NUT_Y)} - modelY) / ${f(SCALE_LENGTH)}, 0.0, 1.0);
        float env = sin(3.14159265 * st);
        transformed.x += uAmp * env * sin(uTime * 61.0);
        transformed.y -= uAmp * 0.6 * env * sin(uTime * 61.0 + 1.3);`
      );
  };
  mat.customProgramCacheKey = () => `guitar-string-${wound ? 'wound' : 'plain'}`;
  return mat;
}

export function createChromeMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color: 0xe6e8ec, metalness: 1, roughness: 0.12, clearcoat: 0.4 });
}
