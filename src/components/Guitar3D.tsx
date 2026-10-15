import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { ChordPosition } from '../types/guitar';
import { guitarAudio } from '../audio/guitarAudio';
import { Volume2, Eye, Camera, Sliders, Maximize2 } from 'lucide-react';

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
const FINGER_COLORS = ['#94a3b8', '#f59e0b', '#06b6d4', '#10b981', '#f43f5e'];

// Individual Pluckable 3D String with physical sine-wave vibration animation
const VibratingString = ({
  x,
  gauge,
  fret,
  isVibrating,
  onPluck
}: {
  x: number;
  gauge: number;
  fret: number;
  isVibrating: boolean;
  onPluck: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (isVibrating) {
      timeRef.current += delta * 60;
      const decay = Math.max(0, 1 - timeRef.current * 0.028);
      const amp = Math.sin(timeRef.current * 1.8) * 0.06 * decay;
      meshRef.current.position.y = 0.13 + amp;
    } else {
      meshRef.current.position.y = 0.13;
      timeRef.current = 0;
    }
  });

  return (
    <group position={[x, 0, 0]}>
      {/* Pluckable hit zone: invisible wider cylinder oriented along Z */}
      <mesh
        position={[0, 0.13, STRING_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onPluck();
        }}
      >
        <cylinderGeometry args={[0.13, 0.13, STRING_LENGTH, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Visible metallic bronze/steel string oriented along Z */}
      <mesh
        ref={meshRef}
        position={[0, 0.13, STRING_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[gauge, gauge, STRING_LENGTH, 12]} />
        <meshStandardMaterial
          color={isVibrating ? '#fef08a' : '#cbd5e1'}
          metalness={0.95}
          roughness={0.15}
          emissive={isVibrating ? '#f59e0b' : '#000000'}
          emissiveIntensity={isVibrating ? 0.8 : 0}
        />
      </mesh>

      {/* Nut marker: Open (Green circle) or Muted (Red cross) */}
      {fret === 0 && (
        <mesh position={[0, 0.22, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.07, 0.11, 16]} />
          <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} />
        </mesh>
      )}
      {fret === -1 && (
        <Text
          position={[0, 0.22, 0.05]}
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

// Contoured Acoustic Guitar Body
const GuitarBody = ({ neckJoint }: { neckJoint: number }) => {
  const bodyGeom = useMemo(() => {
    const shape = new THREE.Shape();
    const halfUpper = 2.3;
    const halfWaist = 1.65;
    const halfLower = 2.95;
    const length = 8.8;

    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.8, 0, halfUpper, 0.6, halfUpper, 2.3);
    shape.bezierCurveTo(halfUpper, 3.4, halfWaist, 3.9, halfWaist, 4.6);
    shape.bezierCurveTo(halfWaist, 5.3, halfLower, 6.0, halfLower, 7.3);
    shape.bezierCurveTo(halfLower, 8.4, 1.2, length, 0, length);
    shape.bezierCurveTo(-1.2, length, -halfLower, 8.4, -halfLower, 7.3);
    shape.bezierCurveTo(-halfLower, 6.0, -halfWaist, 5.3, -halfWaist, 4.6);
    shape.bezierCurveTo(-halfWaist, 3.9, -halfUpper, 3.4, -halfUpper, 2.3);
    shape.bezierCurveTo(-halfUpper, 0.6, -0.8, 0, 0, 0);

    return new THREE.ExtrudeGeometry(shape, {
      depth: 1.15,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.12
    });
  }, []);

  return (
    <group position={[0, -0.05, neckJoint]}>
      {/* Wooden Body - Spruce top & Mahogany sides */}
      <mesh
        geometry={bodyGeom}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, -1.15, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#451a03"
          roughness={0.35}
          metalness={0.08}
        />
      </mesh>

      {/* Soundhole (Circular cutout cavity) */}
      <mesh position={[0, 0.015, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, 32]} />
        <meshBasicMaterial color="#0b0806" />
      </mesh>

      {/* Rosette Inlay Rings around Soundhole */}
      <mesh position={[0, 0.02, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 0.92, 32]} />
        <meshStandardMaterial color="#fef08a" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.02, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.96, 1.05, 32]} />
        <meshStandardMaterial color="#d97706" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Tortoiseshell / Dark Pickguard */}
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

      {/* 6 White Bridge String Pins */}
      {STRING_X.map((x, i) => (
        <mesh key={`pin-${i}`} position={[x, 0.17, 5.4]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};

// Acoustic Guitar Headstock & Tuning Pegs
const GuitarHeadstock = () => {
  return (
    <group position={[0, -0.05, 0]}>
      {/* Angled Headstock Paddle */}
      <mesh position={[0, -0.15, -1.35]} rotation={[-0.14, 0, 0]} castShadow>
        <boxGeometry args={[2.2, 0.2, 2.6]} />
        <meshStandardMaterial color="#2a1810" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Brand Inlay Emblem */}
      <mesh position={[0, -0.04, -2.0]} rotation={[-0.14, 0, 0]}>
        <ringGeometry args={[0.1, 0.2, 16]} />
        <meshStandardMaterial color="#fef08a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 6 Chrome Tuning Pegs (3 Left, 3 Right) */}
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
            <mesh rotation={[0, 0, Math.PI / 2]}>
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
  position,
  isLeftHanded,
  vibratingStrings,
  onPluckString
}: {
  position: ChordPosition;
  isLeftHanded: boolean;
  vibratingStrings: boolean[];
  onPluckString: (strIdx: number) => void;
}) => {
  const neckWidth = 2.4;

  const singleDots = [3, 5, 7, 9];
  const doubleDot = 12;

  return (
    <group scale={isLeftHanded ? [-1, 1, 1] : [1, 1, 1]}>
      {/* Rosewood Fretboard Neck */}
      <mesh position={[0, 0, NECK_LENGTH / 2]} receiveShadow castShadow>
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

      {/* 6 Guitar Strings */}
      {STRING_X.map((x, strIdx) => (
        <VibratingString
          key={`str-${strIdx}`}
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
          <group key={`barre-${bIdx}`} position={[xCenter, 0.28, zMid]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.13, barWidth, 12, 12]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#d97706"
                emissiveIntensity={0.5}
                roughness={0.3}
              />
            </mesh>
            <Text position={[0, 0.22, 0]} fontSize={0.2} color="#0f172a" anchorX="center" anchorY="middle">
              {barre.finger}
            </Text>
          </group>
        );
      })}

      {/* 3D Animated Finger Placement Spheres */}
      {STRING_X.map((x, strIdx) => {
        const fret = position.frets[strIdx];
        if (fret > 0) {
          const zMid = (FRET_POSITIONS[fret - 1] + FRET_POSITIONS[fret]) / 2;
          const finger = position.fingers[strIdx];
          const color = FINGER_COLORS[finger] || '#f59e0b';

          return (
            <Float key={`finger-${strIdx}`} speed={2} rotationIntensity={0} floatIntensity={0.15}>
              <group position={[x, 0.3, zMid]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.15, 24, 24]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    roughness={0.25}
                    metalness={0.3}
                  />
                </mesh>
                <Text
                  position={[0, 0, 0]}
                  fontSize={0.18}
                  color="#ffffff"
                  anchorX="center"
                  anchorY="middle"
                >
                  {finger > 0 ? `${finger}` : ''}
                </Text>
              </group>
            </Float>
          );
        }
        return null;
      })}

      {/* Acoustic Body */}
      <GuitarBody neckJoint={NECK_LENGTH} />

      {/* Headstock with Tuning Pegs */}
      <GuitarHeadstock />
    </group>
  );
};

// Camera Controller Component for Smooth Presets + OrbitControls
const CameraController = ({ preset }: { preset: CameraPreset }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!controlsRef.current) return;
    if (preset === 'pov') {
      // Guitarist POV looking down the neck right at active chord frets
      camera.position.set(-0.6, 3.2, -0.6);
      controlsRef.current.target.set(0.1, 0, 2.8);
    } else if (preset === 'front') {
      // Clean top-front fretboard view focusing on frets 1 to 5
      camera.position.set(0, 5.6, 2.8);
      controlsRef.current.target.set(0, 0, 2.8);
    } else if (preset === 'full') {
      // Full acoustic guitar perspective showing body, neck, and headstock
      camera.position.set(4.8, 6.2, 7.8);
      controlsRef.current.target.set(0, 0, 5.2);
    }
    controlsRef.current.update();
  }, [preset, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0.1, 0, 2.8]}
      enablePan={true}
      enableZoom={true}
      minDistance={2.5}
      maxDistance={22}
      maxPolarAngle={Math.PI / 2 + 0.05}
    />
  );
};

export const Guitar3D = ({
  chordName,
  position,
  isLeftHanded,
  onOpenChordDetail,
  onStrum,
  onSwitchTo2D
}: Guitar3DProps) => {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('pov');
  const [vibratingStrings, setVibratingStrings] = useState<boolean[]>(Array(6).fill(false));
  const [isStrumming, setIsStrumming] = useState(false);

  const handlePluckString = (strIdx: number) => {
    const fret = position.frets[strIdx] >= 0 ? position.frets[strIdx] : 0;
    guitarAudio.pluckNote(strIdx, fret, 0.9);

    setVibratingStrings((prev) => {
      const next = [...prev];
      next[strIdx] = true;
      return next;
    });

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
    }, 600);
  };

  return (
    <div className="w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col">
      {/* 3D Guitar Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenChordDetail && onOpenChordDetail(chordName)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xl rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Akor detaylarını ve teorisini incele"
          >
            <span>{chordName || 'Serbest Çalım'}</span>
            <span className="text-xs font-normal opacity-80">ℹ</span>
          </button>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {position.baseFret > 1 ? `${position.baseFret}. Perde` : 'Açık Pozisyon'} • Gerçekçi 3D Akustik Gitar
          </span>
        </div>

        {/* Camera Preset Buttons, Switch to 2D & Strum */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Switch to 2D Button */}
          {onSwitchTo2D && (
            <button
              onClick={onSwitchTo2D}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="2D İnteraktif Klavyeye Geç"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>2D Klavye</span>
            </button>
          )}

          {/* Camera Presets */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 text-xs">
            <button
              onClick={() => setCameraPreset('pov')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                cameraPreset === 'pov'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Gitarist Bakış Açısı (POV)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>POV</span>
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                cameraPreset === 'front'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Karşıdan Görünüm"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Karşıdan</span>
            </button>
            <button
              onClick={() => setCameraPreset('full')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                cameraPreset === 'full'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Tam Akustik Gitar"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Tam Gitar</span>
            </button>
          </div>

          {/* Strum Button */}
          <button
            onClick={handleStrum}
            disabled={isStrumming}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isStrumming
                ? 'bg-amber-500/30 text-amber-300 ring-2 ring-amber-500/50 scale-95'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isStrumming ? 'Çalınıyor...' : 'Akoru Tınlat'}</span>
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div className="w-full h-72 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-inner cursor-grab active:cursor-grabbing">
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
            position={position}
            isLeftHanded={isLeftHanded}
            vibratingStrings={vibratingStrings}
            onPluckString={handlePluckString}
          />

          <CameraController preset={cameraPreset} />
        </Canvas>
      </div>

      {/* Interactive Footer Tip */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2.5 px-2">
        <span>[RIG TIP] Tellere tıklayarak notaları çalabilir, fare ile 360° döndürebilirsiniz.</span>
        <span>POV / KARŞIDAN / TAM AÇI</span>
      </div>
    </div>
  );
};
