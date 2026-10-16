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
  float woodRough = 0.20;
  float woodCoat = 1.0;
  float neckMask = 0.0;
  vec3 col;

  // Studio-Calibrated Solid Sitka Spruce (rich warm honey-amber with luminous acoustic resonance)
  const vec3 SPRUCE_BASE = vec3(0.48, 0.28, 0.11);
  const vec3 SPRUCE_GRAIN = vec3(0.26, 0.12, 0.035);
  const vec3 SPRUCE_VIGNETTE = vec3(0.24, 0.08, 0.015);

  // Luxury East Indian Rosewood (dark chocolate with rich espresso figure)
  const vec3 ROSE = vec3(0.12, 0.045, 0.022);
  const vec3 ROSE_DARK = vec3(0.032, 0.012, 0.006);

  // African Mahogany (warm acoustic neck & sides)
  const vec3 MAHOGANY = vec3(0.22, 0.075, 0.030);
  const vec3 MAHOGANY_DARK = vec3(0.09, 0.028, 0.012);

  // Deep African Gaboon Ebony (fretboard, bridge & headstock faceplate)
  const vec3 EBONY = vec3(0.015, 0.012, 0.010);
  const vec3 EBONY_WARM = vec3(0.045, 0.028, 0.018);

  // Aged Natural Bone (compensated saddle, nut & pins)
  const vec3 BONE = vec3(0.92, 0.89, 0.80);

  // Deep Acoustic Soundhole Cavity
  const vec3 HOLE = vec3(0.004, 0.003, 0.002);

  float fbHalf = 0.021 + 0.01429 * (${f(NUT_Y)} - p.y);
  float holeD = length(p.xy - vec2(0.0, ${f(SOUNDHOLE.y)}));

  if (!gl_FrontFacing || (holeD < ${f(SOUNDHOLE.radius + 0.002)} && p.z < 0.049 && p.y < ${f(FRETBOARD_END_Y)})) {
    // Interior resonance chamber seen through the soundhole
    col = HOLE;
    woodRough = 0.98;
    woodCoat = 0.0;
  } else if (p.y > ${f(NUT_Y + 0.004)}) {
    // Headstock: full polished jet-black ebony faceplate veneer with golden crest
    if (p.z > 0.038) {
      col = EBONY * (0.90 + 0.15 * wFbm(p * vec3(200.0, 50.0, 200.0)));
      // Golden custom shop diamond crest in upper center
      float crestY = p.y - 0.965;
      float crestD = length(vec2(p.x * 1.6, crestY));
      if (crestD < 0.012 && crestD > 0.007) {
        col = vec3(0.85, 0.70, 0.28);
      }
      woodRough = 0.14;
      woodCoat = 0.98;
    } else {
      col = mix(MAHOGANY, MAHOGANY_DARK, wGrain(p.x + p.z * 0.5, p, 1200.0, 0.005) * 0.55);
      woodRough = 0.22;
      woodCoat = 0.88;
    }
    neckMask = 1.0;
  } else if (p.y > ${f(NUT_Y - 0.0035)} && ax < 0.024 && p.z > 0.05) {
    // Polished Bone Nut
    col = BONE;
    woodRough = 0.18;
    woodCoat = 0.6;
    neckMask = 1.0;
  } else if (p.y > ${f(NECK_JOINT_Y)} && ax < 0.034) {
    if (p.z > 0.0525) {
      // Dense African Ebony fretboard: fine pores, satin-oiled feel
      float pores = wFbm(p * vec3(800.0, 60.0, 800.0));
      col = mix(EBONY, EBONY_WARM * 0.7, wGrain(p.x, p, 1800.0, 0.003) * 0.4 + pores * 0.25);
      woodRough = 0.40;
      woodCoat = 0.22;
    } else {
      // Mahogany neck: fast player finish
      col = mix(MAHOGANY, MAHOGANY_DARK, wGrain(p.x + p.z * 0.5, p, 1300.0, 0.005) * 0.55);
      woodRough = 0.20;
      woodCoat = 0.92;
    }
    neckMask = 1.0;
  } else {
    bool topFace = nn.z > 0.6 && p.z > 0.044;
    if (topFace && p.y > ${f(FRETBOARD_END_Y)} && ax < fbHalf + 0.0006 && p.z > 0.052) {
      // Fretboard tongue over soundboard
      float pores = wFbm(p * vec3(800.0, 60.0, 800.0));
      col = mix(EBONY, EBONY_WARM * 0.7, pores * 0.35);
      woodRough = 0.40;
      woodCoat = 0.22;
    } else if (topFace && holeD < ${f(SOUNDHOLE.radius)}) {
      col = HOLE;
      woodRough = 0.98;
      woodCoat = 0.0;
    } else if (p.y > ${f(BRIDGE.minY)} && p.y < ${f(BRIDGE.maxY)} && ax < ${f(BRIDGE.halfWidth)} && p.z > 0.0512) {
      // Carved Ebony Bridge with Compensated Bone Saddle & 6 Inlaid Bridge Pins
      bool isSaddle = p.z > 0.0604 && ax < 0.042 && p.y > 0.188 && p.y < 0.206;
      if (isSaddle) {
        col = BONE;
        woodRough = 0.16;
        woodCoat = 0.7;
      } else {
        float ebonyGrain = wFbm(p * vec3(450.0, 70.0, 450.0));
        col = mix(EBONY, EBONY_WARM * 0.75, ebonyGrain * 0.35);
        woodRough = 0.22;
        woodCoat = 0.65;

        // 6 Inlaid Bridge Pins with authentic abalone eye
        if (p.y > 0.170 && p.y < 0.184) {
          float pinSpacing = 0.0105;
          float pinIdx = round(p.x / pinSpacing);
          if (abs(pinIdx) <= 2.5) {
            float pinDist = length(vec2(p.x - pinIdx * pinSpacing, p.y - 0.177));
            if (pinDist < 0.0022) {
              if (pinDist < 0.0009) {
                // Abalone dot
                col = vec3(0.12, 0.55, 0.60);
              } else {
                // Bone pin collar
                col = BONE * 0.96;
              }
              woodRough = 0.12;
              woodCoat = 0.95;
            }
          }
        }
      }
    } else if (topFace) {
      // Master-grade Sitka spruce top: distinct, calibrated annual rings + medullary silking
      float g = wGrain(p.x, p, 460.0, 0.006);
      float g2 = wGrain(p.x * 2.2 + 0.15, p, 1100.0, 0.003);
      col = mix(SPRUCE_BASE, SPRUCE_GRAIN, smoothstep(0.38, 0.95, g) * 0.46 + g2 * 0.18);

      // Medullary flecks (cross-silking shimmer)
      float flecks = wFbm(p * vec3(140.0, 12.0, 140.0));
      col *= 0.92 + 0.15 * smoothstep(0.35, 0.75, flecks);

      // Warm vintage golden-amber sunburst vignette around perimeter
      float edgeDist = length(vec2(p.x * 2.1, p.y - 0.21));
      float vignette = smoothstep(0.20, 0.46, edgeDist);
      col = mix(col, SPRUCE_VIGNETTE, vignette * 0.45);

      // Subtle optical chatoyancy / viewing-angle sheen
      float sheen = pow(1.0 - max(dot(nn, vec3(0.0, 0.25, 0.96)), 0.0), 2.8);
      col += vec3(0.08, 0.05, 0.02) * sheen;

      // Authentic Martin-style rosette with iridescent abalone pearl
      float rr = holeD - ${f(SOUNDHOLE.radius)};
      if (rr < 0.020) {
        float outerPurfling = step(0.0025, rr) * (1.0 - step(0.0175, rr));
        col = mix(col, ROSE_DARK, outerPurfling * 0.88);

        float pearlBand = (step(0.0055, rr) - step(0.0095, rr)) + (step(0.0125, rr) - step(0.0155, rr));
        vec3 abalone = vec3(0.68, 0.82, 0.76) +
                       vec3(0.14, -0.06, 0.12) * sin(p.x * 240.0 + p.y * 140.0) +
                       vec3(-0.06, 0.12, 0.08) * cos(p.x * 160.0 - p.y * 220.0);
        col = mix(col, abalone, pearlBand * 0.92);

        float innerLip = 1.0 - step(0.0018, rr);
        col = mix(col, ROSE_DARK, innerLip);
      }

      // Luxury Tortoiseshell Pickguard with cognac-amber swirls and glossy beveled edge
      vec2 q = (p.xy - vec2(0.078, 0.292));
      q = mat2(0.94, -0.34, 0.34, 0.94) * q;
      float guard = length(q / vec2(0.042, 0.07));
      if (guard < 1.0 && rr > 0.016) {
        float tort = wFbm(p * vec3(240.0, 240.0, 240.0));
        float tort2 = wNoise(p * vec3(70.0, 70.0, 70.0));
        vec3 tortAmber = vec3(0.38, 0.12, 0.02);
        vec3 tortDark = vec3(0.014, 0.005, 0.002);
        vec3 tortGold = vec3(0.48, 0.22, 0.04);
        col = mix(tortDark, tortAmber, smoothstep(0.35, 0.72, tort));
        col = mix(col, tortGold, smoothstep(0.65, 0.92, tort2) * 0.45);

        float edgeBevel = smoothstep(0.85, 1.0, guard);
        col = mix(col, vec3(0.40, 0.18, 0.04), edgeBevel * 0.6);
        woodRough = 0.06;
        woodCoat = 1.0;
      } else {
        woodRough = 0.24;
        woodCoat = 0.90;
      }
    } else {
      // East Indian rosewood back and sides with aged ivoroid binding
      float across = nn.z < -0.6 ? abs(p.x) : (p.z + p.x * 0.3);
      float g = wGrain(across, p, 1100.0, 0.010);
      col = mix(ROSE, ROSE_DARK, smoothstep(0.35, 1.0, g) * 0.80);
      col *= 0.88 + 0.25 * wFbm(p * vec3(12.0, 4.0, 12.0));
      // Aged cream ivoroid binding
      if (p.z > 0.0455 && abs(nn.z) < 0.6) col = vec3(0.88, 0.84, 0.72);
      woodRough = 0.20;
      woodCoat = 0.94;
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
    clearcoat: 0.90,
    clearcoatRoughness: 0.10,
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
  mat.customProgramCacheKey = () => 'guitar-wood-v3';
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
    color: wound ? new THREE.Color(0xd99553) : new THREE.Color(0xedf2f7),
    metalness: 0.97,
    roughness: wound ? 0.22 : 0.10,
    clearcoat: wound ? 0.3 : 0.5,
    clearcoatRoughness: 0.1,
    emissive: new THREE.Color(0xf59e0b),
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
  mat.customProgramCacheKey = () => `guitar-string-${wound ? 'wound' : 'plain'}-v2`;
  return mat;
}

export function createChromeMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    metalness: 1.0,
    roughness: 0.06,
    clearcoat: 0.9,
    clearcoatRoughness: 0.03,
  });
}
