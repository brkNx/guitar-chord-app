import { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { ChordPosition } from '../types/guitar';
import { guitarAudio } from '../audio/guitarAudio';
import { Volume2, Eye, Camera, Maximize2 } from 'lucide-react';

interface Guitar3DProps {
  chordName: string;
  position: ChordPosition;
  isLeftHanded: boolean;
  onOpenChordDetail?: (chordName: string) => void;
  onStrum?: () => void;
  onSwitchTo2D?: () => void;
}

type CameraPreset = 'pov' | 'front' | 'full';

// 14 Frets spacing using real 12-TET guitar scale
const NUM_FRETS = 14;
const SCALE_LENGTH = 16.5;
const FRET_POSITIONS: number[] = [];
for (let i = 0; i <= NUM_FRETS; i++) {
  const d = SCALE_LENGTH * (1 - Math.pow(2, -i / 12));
  FRET_POSITIONS.push(d);
}

const NECK_LENGTH = FRET_POSITIONS[NUM_FRETS]; // ~9.4 units
const BRIDGE_Z = NECK_LENGTH + 5.2; // ~14.6 units
const STRING_LENGTH = BRIDGE_Z;

// 6 Strings spacing across X axis (X: -1.0 to +1.0)
const STRING_X = [-1.0, -0.6, -0.2, 0.2, 0.6, 1.0];
const STRING_GAUGES = [0.038, 0.032, 0.026, 0.020, 0.015, 0.011];
// Oolimo & Polygonium Finger Colors: 1 (Index): Amber, 2 (Middle): Blue, 3 (Ring): Emerald, 4 (Pinky): Rose
const FINGER_COLORS = ['#94a3b8', '#f59e0b', '#3b82f6', '#10b981', '#f43f5e'];

// Individual Vibrating String with Phosphor Bronze (Bass) vs Plain Steel (Treble)
const VibratingString = ({
  strIdx,
  x,
  gauge,
  fret,
  isVibrating,
  onPluck
}: {
  strIdx: number;
  x: number;
  gauge: number;
  fret: number;
  isVibrating: boolean;
  onPluck: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // Strings 0-2 (E, A, D) are Phosphor Bronze wound; 3-5 (G, B, E) are Plain Steel
  const isWound = strIdx <= 2;
  const stringColor = isWound ? '#d97706' : '#cbd5e1';

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (isVibrating) {
      timeRef.current += delta * 60;
      const decay = Math.max(0, 1 - timeRef.current * 0.035);
      const freqMultiplier = 1.2 + (5 - strIdx) * 0.3;
      const amp = Math.sin(timeRef.current * freqMultiplier) * 0.07 * decay;
      meshRef.current.position.y = 0.13 + amp;
    } else {
      meshRef.current.position.y = 0.13;
      timeRef.current = 0;
    }
  });

  return (
    <group position={[x, 0, 0]}>
      {/* Invisible wide hit zone for easy raycast plucking */}
      <mesh
        position={[0, 0.13, STRING_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onPluck();
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <cylinderGeometry args={[0.12, 0.12, STRING_LENGTH, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Visible metallic string */}
      <mesh
        ref={meshRef}
        position={[0, 0.13, STRING_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[gauge, gauge, STRING_LENGTH, 12]} />
        <meshStandardMaterial
          color={isVibrating ? '#fef08a' : stringColor}
          metalness={isWound ? 0.85 : 0.95}
          roughness={isWound ? 0.28 : 0.12}
          emissive={isVibrating ? '#f59e0b' : '#000000'}
          emissiveIntensity={isVibrating ? 0.9 : 0}
        />
      </mesh>

      {/* Nut marker: Open (Green ring) or Muted (Red X) */}
      {fret === 0 && (
        <mesh position={[0, 0.22, 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.065, 0.11, 16]} />
          <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} />
        </mesh>
      )}
      {fret === -1 && (
        <Text
          position={[0, 0.22, 0.04]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
        >
          ✕
        </Text>
      )}
    </group>
  );
};

// Smooth Lerping Animated Finger Sphere
const LerpingFingerSphere = ({
  targetX,
  targetZ,
  finger,
  color,
  onClick
}: {
  targetX: number;
  targetZ: number;
  finger: number;
  color: string;
  onClick: () => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    // Polygonium Smooth Interpolation: glide to new fret/string smoothly
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.18);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.18);
  });

  return (
    <group
      ref={groupRef}
      position={[targetX, 0.3, targetZ]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh castShadow>
        <sphereGeometry args={[0.155, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.65}
          roughness={0.2}
          metalness={0.2}
        />
      </mesh>
      <Text
        position={[0, 0, 0]}
        fontSize={0.17}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {finger > 0 ? `${finger}` : ''}
      </Text>
    </group>
  );
};

// Realistic Acoustic Guitar Body
const GuitarBody = ({ neckJoint }: { neckJoint: number }) => {
  const bodyShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(1.2, 0);
    s.bezierCurveTo(2.4, 0.8, 3.2, 2.2, 2.8, 3.8); // Upper bout
    s.bezierCurveTo(2.5, 4.8, 2.0, 5.0, 2.2, 5.8); // Waist
    s.bezierCurveTo(2.5, 7.0, 3.6, 8.2, 3.2, 10.2); // Lower bout
    s.bezierCurveTo(2.8, 11.8, 1.2, 12.2, 0, 12.2); // Bottom tail
    s.bezierCurveTo(-1.2, 12.2, -2.8, 11.8, -3.2, 10.2);
    s.bezierCurveTo(-3.6, 8.2, -2.5, 7.0, -2.2, 5.8);
    s.bezierCurveTo(-2.0, 5.0, -2.5, 4.8, -2.8, 3.8);
    s.bezierCurveTo(-3.2, 2.2, -2.4, 0.8, -1.2, 0);
    s.closePath();
    return s;
  }, []);

  const extrudeSettings = useMemo(
    () => ({
      depth: 1.4,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.18,
      bevelThickness: 0.18
    }),
    []
  );

  return (
    <group position={[0, -0.1, neckJoint - 1.2]}>
      {/* Solid Sitka Spruce / Mahogany Contoured Body */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        castShadow
      >
        <extrudeGeometry args={[bodyShape, extrudeSettings]} />
        <meshStandardMaterial
          color="#381907"
          roughness={0.32}
          metalness={0.08}
        />
      </mesh>

      {/* Soundhole */}
      <mesh position={[0, 0.015, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, 32]} />
        <meshBasicMaterial color="#090705" />
      </mesh>

      {/* Rosette Rings */}
      <mesh position={[0, 0.02, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 0.92, 32]} />
        <meshStandardMaterial color="#fef08a" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.02, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.96, 1.05, 32]} />
        <meshStandardMaterial color="#d97706" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Pickguard */}
      <mesh position={[0.65, 0.022, 2.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 24, 0, Math.PI * 1.25]} />
        <meshStandardMaterial color="#1c1917" roughness={0.2} metalness={0.15} />
      </mesh>

      {/* Wooden Acoustic Bridge */}
      <mesh position={[0, 0.08, 5.2]} castShadow>
        <boxGeometry args={[2.5, 0.12, 0.72]} />
        <meshStandardMaterial color="#1c1917" roughness={0.5} />
      </mesh>

      {/* Bone Bridge Saddle */}
      <mesh position={[0, 0.16, 5.15]}>
        <boxGeometry args={[2.0, 0.08, 0.08]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>

      {/* 6 White Bridge Pins */}
      {STRING_X.map((x, i) => (
        <mesh key={`pin-${i}`} position={[x, 0.17, 5.4]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};

// Acoustic Headstock with 6 Tuning Pegs
const GuitarHeadstock = () => {
  return (
    <group position={[0, -0.05, 0]}>
      {/* Headstock Paddle */}
      <mesh position={[0, -0.15, -1.35]} rotation={[-0.14, 0, 0]} castShadow>
        <boxGeometry args={[2.2, 0.2, 2.6]} />
        <meshStandardMaterial color="#2a1810" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Gold Inlay Emblem */}
      <mesh position={[0, -0.04, -2.0]} rotation={[-0.14, 0, 0]}>
        <ringGeometry args={[0.1, 0.2, 16]} />
        <meshStandardMaterial color="#fef08a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 6 Chrome Tuning Pegs */}
      {[-0.55, -1.35, -2.15].map((z, i) => (
        <group key={`pegs-${i}`}>
          {/* Left Peg */}
          <group position={[-1.25, -0.15, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[-0.22, 0, 0]}>
              <boxGeometry args={[0.12, 0.22, 0.16]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
          </group>

          {/* Right Peg */}
          <group position={[1.25, -0.15, z]}>
            <mesh rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0.22, 0, 0]}>
              <boxGeometry args={[0.12, 0.22, 0.16]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

// Complete 3D Guitar Scene
const GuitarScene = ({
  chordName,
  position,
  isLeftHanded,
  vibratingStrings,
  onPluckString,
  onOpenChordDetail
}: {
  chordName: string;
  position: ChordPosition;
  isLeftHanded: boolean;
  vibratingStrings: boolean[];
  onPluckString: (strIdx: number) => void;
  onOpenChordDetail?: (chordName: string) => void;
}) => {
  const neckWidth = 2.4;
  const singleDots = [3, 5, 7, 9];
  const doubleDot = 12;

  const handleOpenChord = () => {
    if (onOpenChordDetail) {
      onOpenChordDetail(chordName);
    }
  };

  return (
    <group scale={isLeftHanded ? [-1, 1, 1] : [1, 1, 1]}>
      {/* Rosewood Fretboard Neck - Interactive Click */}
      <mesh
        position={[0, 0, NECK_LENGTH / 2]}
        receiveShadow
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          handleOpenChord();
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[neckWidth, 0.14, NECK_LENGTH]} />
        <meshStandardMaterial color="#231710" roughness={0.5} metalness={0.08} />
      </mesh>

      {/* Maple Neck Contour Underneath */}
      <mesh position={[0, -0.13, NECK_LENGTH / 2]} castShadow>
        <boxGeometry args={[neckWidth - 0.2, 0.22, NECK_LENGTH]} />
        <meshStandardMaterial color="#3b2b1e" roughness={0.6} />
      </mesh>

      {/* Bone Nut at Fret 0 */}
      <mesh position={[0, 0.12, 0.03]} castShadow>
        <boxGeometry args={[neckWidth, 0.16, 0.1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.1} />
      </mesh>

      {/* Nickel Silver Fret Wires */}
      {FRET_POSITIONS.slice(1).map((z, idx) => (
        <group key={`fret-wire-${idx}`} position={[0, 0.09, z]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.024, 0.024, neckWidth, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>

          {/* Fret Number Label */}
          <Text
            position={[neckWidth / 2 + 0.25, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.2}
            color="#94a3b8"
            anchorX="left"
            anchorY="middle"
          >
            {idx + 1}
          </Text>
        </group>
      ))}

      {/* Pearloid Inlay Dots */}
      {singleDots.map((fret) => {
        const zMid = (FRET_POSITIONS[fret - 1] + FRET_POSITIONS[fret]) / 2;
        return (
          <mesh key={`dot-${fret}`} position={[0, 0.075, zMid]}>
            <cylinderGeometry args={[0.08, 0.08, 0.01, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} />
          </mesh>
        );
      })}

      {/* Double Dot at Fret 12 */}
      {(() => {
        const zMid = (FRET_POSITIONS[doubleDot - 1] + FRET_POSITIONS[doubleDot]) / 2;
        return (
          <group position={[0, 0.075, zMid]}>
            <mesh position={[-0.42, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.01, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0.42, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.01, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} />
            </mesh>
          </group>
        );
      })()}

      {/* 6 Pluckable Strings */}
      {STRING_X.map((x, strIdx) => (
        <VibratingString
          key={`str-${strIdx}`}
          strIdx={strIdx}
          x={x}
          gauge={STRING_GAUGES[strIdx]}
          fret={position.frets[strIdx]}
          isVibrating={vibratingStrings[strIdx]}
          onPluck={() => onPluckString(strIdx)}
        />
      ))}

      {/* 3D Barre Bar Representation */}
      {position.barres?.map((barre, bIdx) => {
        const fret = barre.fret;
        const zMid = (FRET_POSITIONS[fret - 1] + FRET_POSITIONS[fret]) / 2;
        const xFrom = STRING_X[6 - barre.fromString];
        const xTo = STRING_X[6 - barre.toString];
        const xCenter = (xFrom + xTo) / 2;
        const barWidth = Math.abs(xTo - xFrom) + 0.35;

        return (
          <group
            key={`barre-${bIdx}`}
            position={[xCenter, 0.28, zMid]}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenChord();
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
          >
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.13, barWidth, 12, 12]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#d97706"
                emissiveIntensity={0.6}
                roughness={0.3}
              />
            </mesh>
            <Text position={[0, 0.22, 0]} fontSize={0.2} color="#0f172a" anchorX="center" anchorY="middle">
              {barre.finger}
            </Text>
          </group>
        );
      })}

      {/* Animated Lerping Finger Spheres (Polygonium Glide Motion) */}
      {STRING_X.map((x, strIdx) => {
        const fret = position.frets[strIdx];
        if (fret > 0) {
          const zMid = (FRET_POSITIONS[fret - 1] + FRET_POSITIONS[fret]) / 2;
          const finger = position.fingers[strIdx];
          const color = FINGER_COLORS[finger] || '#f59e0b';

          return (
            <LerpingFingerSphere
              key={`finger-${strIdx}`}
              targetX={x}
              targetZ={zMid}
              finger={finger}
              color={color}
              onClick={() => {
                onPluckString(strIdx);
                handleOpenChord();
              }}
            />
          );
        }
        return null;
      })}

      {/* 3D Floating Interactive HUD Billboard */}
      <Billboard
        position={[0, 0.95, 1.8]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            handleOpenChord();
          }}
          onPointerOver={() => {
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <planeGeometry args={[2.5, 0.46]} />
          <meshBasicMaterial color="#0b0e17" transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[2.54, 0.5]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} />
        </mesh>
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.16}
          color="#f59e0b"
          anchorX="center"
          anchorY="middle"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenChord();
          }}
          onPointerOver={() => {
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          {`[AKOR DETAYI: ${chordName} - TIKLA]`}
        </Text>
      </Billboard>

      {/* Acoustic Body - Interactive Click */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleOpenChord();
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <GuitarBody neckJoint={NECK_LENGTH} />
      </group>

      {/* Headstock */}
      <GuitarHeadstock />
    </group>
  );
};

// Camera Controller Component with Smooth THREE.MathUtils.lerp Interpolation
const CameraController = ({ preset }: { preset: CameraPreset }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const targets = useRef({
    pos: new THREE.Vector3(-0.6, 3.2, -0.6),
    look: new THREE.Vector3(0.1, 0, 2.8)
  });

  useEffect(() => {
    if (preset === 'pov') {
      targets.current.pos.set(-0.6, 3.2, -0.6);
      targets.current.look.set(0.1, 0, 2.8);
    } else if (preset === 'front') {
      targets.current.pos.set(0, 5.6, 2.8);
      targets.current.look.set(0, 0, 2.8);
    } else if (preset === 'full') {
      targets.current.pos.set(4.8, 6.2, 7.8);
      targets.current.look.set(0, 0, 5.0);
    }
  }, [preset]);

  useFrame(() => {
    if (!controlsRef.current) return;
    camera.position.lerp(targets.current.pos, 0.08);
    controlsRef.current.target.lerp(targets.current.look, 0.08);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1.2}
      maxDistance={22}
    />
  );
};

export const Guitar3D = ({
  chordName,
  position,
  isLeftHanded,
  onOpenChordDetail,
  onStrum
}: Guitar3DProps) => {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('pov');
  const [vibratingStrings, setVibratingStrings] = useState<boolean[]>(Array(6).fill(false));
  const [isStrumming, setIsStrumming] = useState(false);

  const handlePluckString = (strIdx: number) => {
    const fret = position.frets[strIdx];
    if (fret < 0) return;

    setVibratingStrings((prev) => {
      const next = [...prev];
      next[strIdx] = true;
      return next;
    });

    guitarAudio.pluckNote(strIdx, fret, 0.95);

    setTimeout(() => {
      setVibratingStrings((prev) => {
        const next = [...prev];
        next[strIdx] = false;
        return next;
      });
    }, 450);
  };

  const handleStrum = async () => {
    if (isStrumming) return;
    setIsStrumming(true);
    setVibratingStrings(position.frets.map((f) => f >= 0));

    await guitarAudio.strumChord(position, 'down', 24);

    if (onStrum) onStrum();

    setTimeout(() => {
      setVibratingStrings(Array(6).fill(false));
      setIsStrumming(false);
    }, 550);
  };

  return (
    <div className="w-full bg-[#11141c] border border-[#1e222d] rounded-lg p-3 shadow-md flex flex-col text-slate-200 select-none">
      {/* 3D Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#1e222d]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenChordDetail && onOpenChordDetail(chordName)}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-sm rounded shadow-sm shadow-amber-500/20 transition-colors cursor-pointer"
            title="Akor detay panelini aç"
          >
            {chordName || 'AKOR'}
          </button>
          <span className="font-mono text-[11px] text-slate-400">
            {position.baseFret > 1 ? `${position.baseFret}. Perde` : 'Açık'} • Polygonium 3D Rig
          </span>
        </div>

        {/* Camera Presets & Strum Action */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          {/* Camera Preset Buttons */}
          <div className="flex items-center bg-[#0b0d12] border border-[#1e222d] rounded p-0.5">
            <button
              onClick={() => setCameraPreset('pov')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer ${
                cameraPreset === 'pov'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Gitarist Bakış Açısı (POV)"
            >
              <Eye className="w-3 h-3" />
              <span>POV</span>
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer ${
                cameraPreset === 'front'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Karşıdan Görünüm"
            >
              <Camera className="w-3 h-3" />
              <span>FRONT</span>
            </button>
            <button
              onClick={() => setCameraPreset('full')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer ${
                cameraPreset === 'full'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tam Akustik Gitar (İzometrik)"
            >
              <Maximize2 className="w-3 h-3" />
              <span>FULL</span>
            </button>
          </div>

          <button
            onClick={handleStrum}
            disabled={isStrumming}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded shadow-sm shadow-amber-500/20 transition-colors cursor-pointer"
          >
            <Volume2 className="w-3 h-3 fill-current" />
            <span>{isStrumming ? 'ÇALINIYOR...' : 'TINLAT'}</span>
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div className="w-full h-64 sm:h-72 rounded bg-[#090a0f] border border-[#1e222d] overflow-hidden relative cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [-0.6, 3.2, -0.6], fov: 48 }}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[6, 12, 6]} intensity={1.8} castShadow />
          <pointLight position={[-4, 4, 2]} intensity={0.9} color="#f59e0b" />
          <pointLight position={[4, 3, 8]} intensity={0.6} color="#38bdf8" />
          <pointLight position={[0, -3, 5]} intensity={0.4} color="#ffffff" />

          <GuitarScene
            chordName={chordName}
            position={position}
            isLeftHanded={isLeftHanded}
            vibratingStrings={vibratingStrings}
            onPluckString={handlePluckString}
            onOpenChordDetail={onOpenChordDetail}
          />

          <CameraController preset={cameraPreset} />
        </Canvas>
      </div>

      {/* Footer Telemetry */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
        <span>[RIG TIP] Gitara, tellere veya parmak noktalarına tıklayarak akor detayını açabilirsiniz.</span>
        <span>INTERPOLATED 60FPS</span>
      </div>
    </div>
  );
};
