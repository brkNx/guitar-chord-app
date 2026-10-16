import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { ChordPosition } from '../../types/guitar';
import { getChordTheoryDetails } from '../../utils/chordTheory';
import { getOolimoStyle } from '../Fretboard';
import {
  FRETBOARD_END_Y,
  FRETBOARD_Z,
  FRET_COUNT,
  MODEL_CENTER_Y,
  MODEL_URL,
  NUT_Y,
  STRING_LIFT_Z,
  STRING_NODE_NAMES,
  WOUND_STRING_COUNT,
  fingerY,
  fretY,
  fretboardHalfWidth,
  isNeckHit,
  stringX,
  stringZ,
} from './guitarCalibration';
import {
  createChromeMaterial,
  createStringMaterial,
  createWoodMaterial,
  type StringUniforms,
} from './guitarMaterials';

export type StageMode = 'overview' | 'neck';

export interface PluckPulse {
  seq: number;
  /** -1 = all non-muted strings (strum), 0..5 = single string */
  stringIdx: number;
}

interface GuitarModelProps {
  chordName: string;
  position: ChordPosition;
  isLeftHanded: boolean;
  stageMode: StageMode;
  userInteracting: boolean;
  pluckPulse: PluckPulse;
  onSelectNeck: () => void;
  onStrumBody: () => void;
  onHoverRegionChange?: (region: 'none' | 'neck' | 'body') => void;
}

const SINGLE_INLAY_FRETS = [3, 5, 7, 9, 15, 17];
const DOUBLE_INLAY_FRET = 12;

export function GuitarModel({
  chordName,
  position,
  isLeftHanded,
  stageMode,
  userInteracting,
  pluckPulse,
  onSelectNeck,
  onStrumBody,
  onHoverRegionChange,
}: GuitarModelProps) {
  const { nodes } = useGLTF(MODEL_URL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };

  const turntableRef = useRef<THREE.Group>(null);
  const modelSpaceRef = useRef<THREE.Group>(null);
  const neckHoverUniform = useRef({ value: 0 });
  const targetNeckHover = useRef(0);
  const hoverRegionRef = useRef<'none' | 'neck' | 'body'>('none');

  // Materials
  const woodMaterial = useMemo(() => createWoodMaterial(neckHoverUniform.current), []);
  const chromeMaterial = useMemo(() => createChromeMaterial(), []);
  const inlayMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d8dee9',
        roughness: 0.25,
        metalness: 0.2,
      }),
    []
  );

  // Per-string uniforms & materials (0 = Low E .. 5 = High E)
  const stringData = useMemo(() => {
    return STRING_NODE_NAMES.map((nodeName, idx) => {
      const mesh = nodes[nodeName];
      const zOff = mesh ? mesh.position.z : 0.0055;
      const uniforms: StringUniforms = {
        uAmp: { value: 0 },
        uTime: { value: 0 },
        uOffsetZ: { value: zOff },
      };
      const material = createStringMaterial(idx < WOUND_STRING_COUNT, uniforms);
      return {
        nodeName,
        mesh,
        uniforms,
        material,
        amp: 0,
      };
    });
  }, [nodes]);

  const pegMeshes = useMemo(() => {
    return ['tuning_peg_01', 'tuning_peg_02', 'tuning_peg_03', 'tuning_peg_04', 'tuning_peg_05', 'tuning_peg_06']
      .map((name) => nodes[name])
      .filter(Boolean);
  }, [nodes]);

  // Trigger string vibration on pluckPulse change
  const lastSeqRef = useRef(0);
  useEffect(() => {
    if (pluckPulse.seq === lastSeqRef.current) return;
    lastSeqRef.current = pluckPulse.seq;

    if (pluckPulse.stringIdx === -1) {
      // Strum all non-muted strings with slight stagger
      stringData.forEach((s, idx) => {
        if (position.frets[idx] >= 0) {
          setTimeout(() => {
            s.amp = 0.000028;
          }, idx * 20);
        }
      });
    } else {
      const target = stringData[pluckPulse.stringIdx];
      if (target) {
        target.amp = 0.000032;
      }
    }
  }, [pluckPulse, position.frets, stringData]);

  // Dispose custom materials on unmount
  useEffect(() => {
    return () => {
      woodMaterial.dispose();
      chromeMaterial.dispose();
      inlayMaterial.dispose();
      stringData.forEach((s) => s.material.dispose());
    };
  }, [woodMaterial, chromeMaterial, inlayMaterial, stringData]);

  // Reset cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  // Fret wires & inlays geometry data
  const fretWires = useMemo(() => {
    return Array.from({ length: FRET_COUNT }, (_, idx) => {
      const fret = idx + 1;
      const y = fretY(fret);
      const width = fretboardHalfWidth(y) * 1.96;
      return { fret, y, width };
    });
  }, []);

  // Chord analysis for 3D finger dots
  const theory = useMemo(
    () => getChordTheoryDetails(chordName, position),
    [chordName, position]
  );

  // Refs for smooth 3D finger dot lerping & press pulse animation
  const dotGroupRefs = useRef<(THREE.Group | null)[]>([null, null, null, null, null, null]);
  const dotCurrentPos = useRef<THREE.Vector3[]>(
    [0, 1, 2, 3, 4, 5].map((i) => new THREE.Vector3(stringX(i, NUT_Y), NUT_Y, FRETBOARD_Z + 0.003))
  );
  const pressPulseRef = useRef(0);

  // Trigger physical finger press pulse whenever chord, voicing, or pluck changes
  useEffect(() => {
    pressPulseRef.current = 1.0;
  }, [chordName, position, pluckPulse.seq]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.15);

    // 1. Turntable rotation: 3D studio stance in overview, horizontal neck in neck mode
    if (turntableRef.current) {
      if (stageMode === 'neck') {
        turntableRef.current.rotation.y = THREE.MathUtils.damp(
          turntableRef.current.rotation.y,
          0,
          10,
          dt
        );
        turntableRef.current.rotation.x = THREE.MathUtils.damp(
          turntableRef.current.rotation.x,
          0,
          10,
          dt
        );
        turntableRef.current.rotation.z = THREE.MathUtils.damp(
          turntableRef.current.rotation.z,
          Math.PI / 2,
          10,
          dt
        );
      } else {
        turntableRef.current.rotation.x = THREE.MathUtils.damp(
          turntableRef.current.rotation.x,
          0,
          6,
          dt
        );
        turntableRef.current.rotation.z = THREE.MathUtils.damp(
          turntableRef.current.rotation.z,
          -0.14,
          6,
          dt
        );
        if (!userInteracting) {
          const targetY = Math.sin(state.clock.elapsedTime * 0.25) * 0.14 - 0.08;
          turntableRef.current.rotation.y = THREE.MathUtils.damp(
            turntableRef.current.rotation.y,
            targetY,
            2.5,
            dt
          );
        }
      }
    }

    // 2. Smooth neck hover glow uniform
    const goalHover = stageMode === 'overview' ? targetNeckHover.current : 0;
    neckHoverUniform.current.value = THREE.MathUtils.damp(
      neckHoverUniform.current.value,
      goalHover,
      10,
      dt
    );

    // 3. String vibration decay & finger press pulse decay
    const elapsed = state.clock.elapsedTime;
    pressPulseRef.current = THREE.MathUtils.damp(pressPulseRef.current, 0, 4.8, dt);
    const pulse = pressPulseRef.current;

    for (let i = 0; i < stringData.length; i++) {
      const s = stringData[i];
      s.amp = THREE.MathUtils.damp(s.amp, 0, 5.2, dt);
      s.uniforms.uAmp.value = s.amp;
      s.uniforms.uTime.value = elapsed + i * 0.7;
      s.material.emissiveIntensity = Math.min(1, s.amp * 28000);
    }

    // 4. Smoothly lerp 3D finger dots to target fret positions with physical press bounce
    for (let i = 0; i < 6; i++) {
      const fret = position.frets[i];
      const yTarget = fret > 0 ? fingerY(fret) : NUT_Y + 0.012;
      const xTarget = stringX(i, fret > 0 ? yTarget : NUT_Y);
      const baseZ = (fret > 0 ? stringZ(yTarget) : FRETBOARD_Z) + 0.0022;
      const zTarget = fret > 0 ? baseZ + Math.sin(pulse * Math.PI) * 0.0032 : baseZ;

      const cur = dotCurrentPos.current[i];
      cur.x = THREE.MathUtils.damp(cur.x, xTarget, 14, dt);
      cur.y = THREE.MathUtils.damp(cur.y, yTarget, 14, dt);
      cur.z = THREE.MathUtils.damp(cur.z, zTarget, 16, dt);

      const grp = dotGroupRefs.current[i];
      if (grp) {
        grp.position.copy(cur);
        const s = fret > 0 ? 1 + pulse * 0.32 : 1 + pulse * 0.12;
        grp.scale.setScalar(s);
      }
    }
  });

  const classifyHit = (e: ThreeEvent<PointerEvent | MouseEvent>): 'neck' | 'body' => {
    if (!modelSpaceRef.current) return 'body';
    const local = modelSpaceRef.current.worldToLocal(e.point.clone());
    // Neck above joint OR fretboard tongue over upper body
    if (isNeckHit(local.y) || (local.y > FRETBOARD_END_Y && Math.abs(local.x) < 0.032)) {
      return 'neck';
    }
    return 'body';
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const region = classifyHit(e);
    targetNeckHover.current = region === 'neck' ? 1 : 0;
    document.body.style.cursor = 'pointer';
    if (hoverRegionRef.current !== region) {
      hoverRegionRef.current = region;
      onHoverRegionChange?.(region);
    }
  };

  const handlePointerOut = () => {
    targetNeckHover.current = 0;
    document.body.style.cursor = 'auto';
    if (hoverRegionRef.current !== 'none') {
      hoverRegionRef.current = 'none';
      onHoverRegionChange?.('none');
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return; // Ignore orbit drag release
    const region = classifyHit(e);
    if (region === 'neck') {
      onSelectNeck();
    } else {
      onStrumBody();
    }
  };

  const bodyMesh = nodes.acoustic_body;

  return (
    <group
      ref={turntableRef}
      rotation={[0, 0, stageMode === 'neck' ? Math.PI / 2 : -0.2]}
      scale={[isLeftHanded ? -1 : 1, 1, 1]}
    >
      {/* Model-space group centered at origin */}
      <group ref={modelSpaceRef} position={[0, -MODEL_CENTER_Y, 0]}>
        {/* GLB Acoustic Body + Strings + Tuning Pegs (scale 100, -90deg X) */}
        {bodyMesh && (
          <group
            scale={[100, 100, 100]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerMove={handlePointerMove}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
          >
            <mesh
              geometry={bodyMesh.geometry}
              material={woodMaterial}
              castShadow
              receiveShadow
            />

            {/* 6 Tuning Pegs */}
            {pegMeshes.map((peg) => (
              <mesh
                key={peg.name}
                geometry={peg.geometry}
                material={chromeMaterial}
                position={peg.position}
                rotation={peg.rotation}
                scale={peg.scale}
                castShadow
              />
            ))}

            {/* 6 Acoustic Strings (lifted slightly in +Z model space = -Y local space) */}
            {stringData.map((s) =>
              s.mesh ? (
                <mesh
                  key={s.nodeName}
                  geometry={s.mesh.geometry}
                  material={s.material}
                  position={[
                    s.mesh.position.x,
                    s.mesh.position.y - STRING_LIFT_Z / 100,
                    s.mesh.position.z,
                  ]}
                  rotation={s.mesh.rotation}
                  scale={s.mesh.scale}
                />
              ) : null
            )}
          </group>
        )}

        {/* 20 Nickel Fret Wires in Model Space */}
        {fretWires.map((fw) => (
          <mesh
            key={`fw-${fw.fret}`}
            position={[0, fw.y, FRETBOARD_Z + 0.0003]}
            material={chromeMaterial}
          >
            <boxGeometry args={[fw.width, 0.001, 0.0012]} />
          </mesh>
        ))}

        {/* Pearloid Fret Inlay Dots (3, 5, 7, 9, 15, 17 + Double 12) */}
        {SINGLE_INLAY_FRETS.map((fret) => (
          <mesh
            key={`inlay-${fret}`}
            position={[0, fingerY(fret), FRETBOARD_Z + 0.0001]}
            material={inlayMaterial}
          >
            <circleGeometry args={[0.0022, 20]} />
          </mesh>
        ))}
        {[-0.0085, 0.0085].map((xOff, i) => (
          <mesh
            key={`inlay-12-${i}`}
            position={[xOff, fingerY(DOUBLE_INLAY_FRET), FRETBOARD_Z + 0.0001]}
            material={inlayMaterial}
          >
            <circleGeometry args={[0.002, 20]} />
          </mesh>
        ))}

        {/* Barre Bar on 3D Neck (if chord has barre) */}
        {position.barres?.map((barre, bIdx) => {
          const y = fingerY(barre.fret);
          const xFrom = stringX(6 - barre.fromString, y);
          const xTo = stringX(6 - barre.toString, y);
          const cx = (xFrom + xTo) / 2;
          const span = Math.abs(xTo - xFrom) + 0.006;
          const z = stringZ(y) + 0.002;
          return (
            <mesh key={`barre3d-${bIdx}`} position={[cx, y, z]}>
              <boxGeometry args={[span, 0.0055, 0.0038]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#f59e0b"
                emissiveIntensity={0.35}
                roughness={0.25}
              />
            </mesh>
          );
        })}

        {/* 6 Lerping Oolimo Interval Dots on the 3D Neck */}
        {[0, 1, 2, 3, 4, 5].map((sIdx) => {
          const fret = position.frets[sIdx];
          const strInfo = theory.stringsAnalysis[sIdx];
          const degree = strInfo?.degree || '1';
          const isRoot = degree === '1' || degree === 'R';
          const oolimo = getOolimoStyle(degree, isRoot);
          const isMuted = fret === -1;
          const isOpen = fret === 0;

          return (
            <group
              key={`dot3d-${sIdx}`}
              ref={(el) => {
                dotGroupRefs.current[sIdx] = el;
              }}
            >
              {isMuted ? (
                <mesh>
                  <boxGeometry args={[0.0036, 0.0036, 0.0018]} />
                  <meshStandardMaterial
                    color="#ef4444"
                    emissive="#ef4444"
                    emissiveIntensity={0.45}
                    roughness={0.3}
                  />
                </mesh>
              ) : isOpen ? (
                <mesh>
                  <torusGeometry args={[0.0024, 0.0007, 12, 24]} />
                  <meshStandardMaterial
                    color={oolimo.fill}
                    emissive={oolimo.fill}
                    emissiveIntensity={0.5}
                    roughness={0.25}
                  />
                </mesh>
              ) : (
                <group>
                  <mesh castShadow>
                    <sphereGeometry args={[0.0038, 20, 20]} />
                    <meshStandardMaterial
                      color={oolimo.fill}
                      emissive={oolimo.fill}
                      emissiveIntensity={0.6}
                      roughness={0.18}
                      metalness={0.1}
                    />
                  </mesh>
                  {/* Glowing target ring on the fretboard showing exact press spot */}
                  <mesh position={[0, 0, -0.0014]}>
                    <torusGeometry args={[0.0052, 0.00055, 10, 24]} />
                    <meshStandardMaterial
                      color={oolimo.stroke}
                      emissive={oolimo.fill}
                      emissiveIntensity={0.85}
                      roughness={0.2}
                    />
                  </mesh>
                </group>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
