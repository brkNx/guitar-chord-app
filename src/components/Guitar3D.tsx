import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { ChordPosition } from '../types/guitar';
import { guitarAudio } from '../audio/guitarAudio';
import { Volume2, Eye, Compass, Camera } from 'lucide-react';

interface Guitar3DProps {
  chordName: string;
  position: ChordPosition;
  isLeftHanded: boolean;
  onOpenChordDetail?: (chordName: string) => void;
  onStrum?: () => void;
}

type CameraPreset = 'pov' | 'front' | 'free';

// Fret spacing along Z axis
const NUM_FRETS = 14;
const SCALE_LENGTH = 16.0;
const FRET_POSITIONS: number[] = [];
for (let i = 0; i <= NUM_FRETS; i++) {
  // Real guitar fret spacing formula
  const d = SCALE_LENGTH * (1 - Math.pow(2, -i / 12));
  FRET_POSITIONS.push(d);
}

// 6 Strings spacing across X axis (X: -1.25 to +1.25)
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
  const length = FRET_POSITIONS[NUM_FRETS] + 1.0;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (isVibrating) {
      timeRef.current += delta * 60;
      const decay = Math.max(0, 1 - timeRef.current * 0.03);
      const amp = Math.sin(timeRef.current * 1.5) * 0.06 * decay;
      meshRef.current.position.y = 0.12 + amp;
    } else {
      meshRef.current.position.y = 0.12;
      timeRef.current = 0;
    }
  });

  return (
    <group position={[x, 0, length / 2]}>
      {/* Pluckable hit zone (invisible wider cylinder) */}
      <mesh
        position={[0, 0.12, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onPluck();
        }}
      >
        <cylinderGeometry args={[0.15, 0.15, length, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Visible metallic string */}
      <mesh ref={meshRef} position={[0, 0.12, 0]}>
        <cylinderGeometry args={[gauge, gauge, length, 12]} />
        <meshStandardMaterial
          color={isVibrating ? '#fef08a' : '#cbd5e1'}
          metalness={0.9}
          roughness={0.2}
          emissive={isVibrating ? '#f59e0b' : '#000000'}
          emissiveIntensity={isVibrating ? 0.6 : 0}
        />
      </mesh>

      {/* Nut marker: Open (Green circle) or Muted (Red cross) */}
      {fret === 0 && (
        <mesh position={[0, 0.25, -length / 2]}>
          <ringGeometry args={[0.08, 0.12, 16]} />
          <meshBasicMaterial color="#10b981" side={THREE.DoubleSide} />
        </mesh>
      )}
      {fret === -1 && (
        <Text
          position={[0, 0.28, -length / 2]}
          fontSize={0.22}
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

// 3D Guitar Scene Content
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
  const neckLength = FRET_POSITIONS[NUM_FRETS] + 0.8;
  const neckWidth = 2.6;

  // Single dot frets: 3, 5, 7, 9, 15
  const singleDots = [3, 5, 7, 9];
  const doubleDot = 12;

  return (
    <group scale={isLeftHanded ? [-1, 1, 1] : [1, 1, 1]} rotation={[0, 0, 0]}>
      {/* Rosewood Fretboard Neck Body */}
      <mesh position={[0, 0, neckLength / 2]} receiveShadow castShadow>
        <boxGeometry args={[neckWidth, 0.22, neckLength]} />
        <meshStandardMaterial
          color="#1e1814"
          roughness={0.45}
          metalness={0.1}
        />
      </mesh>

      {/* Neck Back Bevel (Maple contour) */}
      <mesh position={[0, -0.15, neckLength / 2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[neckWidth / 2, neckWidth / 2, neckLength, 16, 1, false, 0, Math.PI]}
        />
        <meshStandardMaterial color="#3b2b1e" roughness={0.6} />
      </mesh>

      {/* Bone Nut at Fret 0 */}
      <mesh position={[0, 0.16, 0.02]} castShadow>
        <boxGeometry args={[neckWidth, 0.14, 0.12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Nickel Fret Wires */}
      {FRET_POSITIONS.slice(1).map((z, idx) => (
        <group key={`fret-wire-${idx}`} position={[0, 0.12, z]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, neckWidth, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Fret number label floating beside neck */}
          <Text
            position={[neckWidth / 2 + 0.28, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.2}
            color="#64748b"
            anchorX="left"
            anchorY="middle"
          >
            {idx + 1}
          </Text>
        </group>
      ))}

      {/* Pearloid Inlay Dots on Frets */}
      {singleDots.map((fret) => {
        const zMid = (FRET_POSITIONS[fret - 1] + FRET_POSITIONS[fret]) / 2;
        return (
          <mesh key={`dot-${fret}`} position={[0, 0.115, zMid]}>
            <cylinderGeometry args={[0.09, 0.09, 0.01, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.4} />
          </mesh>
        );
      })}

      {/* Double Inlay Dots at Fret 12 */}
      {(() => {
        const zMid = (FRET_POSITIONS[doubleDot - 1] + FRET_POSITIONS[doubleDot]) / 2;
        return (
          <group position={[0, 0.115, zMid]}>
            <mesh position={[-0.45, 0, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.01, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0.45, 0, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.01, 16]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.4} />
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
            <Float key={`finger-${strIdx}`} speed={2} rotationIntensity={0} floatIntensity={0.2}>
              <group position={[x, 0.32, zMid]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.16, 24, 24]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.4}
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

      {/* Upper Acoustic Body Contour Background */}
      <mesh position={[0, -0.4, neckLength + 2.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.8, 3.4, 0.8, 32]} />
        <meshStandardMaterial color="#451a03" roughness={0.4} />
      </mesh>
    </group>
  );
};

export const Guitar3D = ({
  chordName,
  position,
  isLeftHanded,
  onOpenChordDetail,
  onStrum
}: Guitar3DProps) => {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('front');
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
    }, 400);
  };

  const handleStrum = async () => {
    setIsStrumming(true);
    setVibratingStrings(position.frets.map((f) => f >= 0));

    await guitarAudio.strumChord(position, 'down', 24);

    if (onStrum) onStrum();

    setTimeout(() => {
      setVibratingStrings(Array(6).fill(false));
      setIsStrumming(false);
    }, 600);
  };

  // Camera settings per preset
  const cameraProps = useMemo(() => {
    switch (cameraPreset) {
      case 'pov':
        // Player looking down the neck from nut to body
        return { position: [0, 2.6, -1.5] as [number, number, number], fov: 48 };
      case 'front':
        // 3D Studio angle with depth
        return { position: [-3.2, 4.0, 5.2] as [number, number, number], fov: 40 };
      case 'free':
      default:
        return { position: [-2.0, 5.5, 6.5] as [number, number, number], fov: 45 };
    }
  }, [cameraPreset]);

  return (
    <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col">
      {/* 3D Guitar Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenChordDetail && onOpenChordDetail(chordName)}
            className="px-3.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xl rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Akor detaylarını ve seslerini incele"
          >
            <span>{chordName || 'Serbest Çalım'}</span>
            <span className="text-xs font-normal opacity-80">ℹ</span>
          </button>
          <span className="text-xs text-slate-400 font-medium">
            {position.baseFret > 1 ? `${position.baseFret}. Perde` : 'Açık Pozisyon'} • 3D İnteraktif
          </span>
        </div>

        {/* Camera Preset Buttons & Strum */}
        <div className="flex items-center gap-2">
          {/* Camera Presets */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 text-xs">
            <button
              onClick={() => setCameraPreset('pov')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                cameraPreset === 'pov'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Gitarist Gözü Bakış Açısı"
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
              onClick={() => setCameraPreset('free')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                cameraPreset === 'free'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Serbest 3D Döndürme"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Serbest 3D</span>
            </button>
          </div>

          {/* Strum Button */}
          <button
            onClick={handleStrum}
            disabled={isStrumming}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isStrumming
                ? 'bg-amber-500/30 text-amber-300 ring-2 ring-amber-500/50 scale-95'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isStrumming ? 'Çalınıyor...' : 'Akoru Tınlat (Strum)'}</span>
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div className="w-full h-64 md:h-72 rounded-xl overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800/80 cursor-grab active:cursor-grabbing">
        <Canvas
          camera={cameraProps}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
          <pointLight position={[-4, 3, 2]} intensity={0.8} color="#f59e0b" />
          <pointLight position={[4, 2, 8]} intensity={0.5} color="#38bdf8" />

          <GuitarScene
            position={position}
            isLeftHanded={isLeftHanded}
            vibratingStrings={vibratingStrings}
            onPluckString={handlePluckString}
          />

          <OrbitControls
            target={[0, 0, 3.5]}
            enablePan={false}
            enableZoom={true}
            minDistance={3}
            maxDistance={12}
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
        </Canvas>
      </div>

      {/* Interactive Tip */}
      <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-2">
        <span>💡 <b>İpucu:</b> 3D gitardaki herhangi bir tele tıklayarak notasını tınlatabilirsiniz.</span>
        <span>Fareyle sürükleyerek 3D açıyı serbestçe döndürün.</span>
      </div>
    </div>
  );
};
