import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ChordPosition, FretboardDisplayMode } from '../../types/guitar';
import { getChordTheoryDetails } from '../../utils/chordTheory';
import { STRUM_PATTERNS } from '../../data/strumPatterns';
import { guitarAudio } from '../../audio/guitarAudio';
import { MODEL_CENTER_Y, NECK_FOCUS_Y } from './guitarCalibration';
import { GuitarModel, type PluckPulse, type StageMode } from './GuitarModel';
import { NeckOverlay } from './NeckOverlay';
import { Layers, Music, Play, Volume2 } from 'lucide-react';

interface GuitarStageProps {
  chordName: string;
  position: ChordPosition;
  positionIdx: number;
  totalPositions: number;
  displayMode: FretboardDisplayMode;
  isLeftHanded: boolean;
  songChords: string[];
  selectedPatternId: string;
  isPlayingStrumSeq: boolean;
  onSelectChord: (chord: string) => void;
  onPositionChange: (idx: number) => void;
  onDisplayModeChange: (mode: FretboardDisplayMode) => void;
  onOpenChordDetail: () => void;
  onSelectPattern: (id: string) => void;
  onPlayStrumSequence: () => void;
}

export type CamPreset = 'overview' | 'front' | 'pov' | 'neck';

const OVERVIEW_CAM_POS = new THREE.Vector3(0.24, 0.04, 1.82);
const OVERVIEW_TARGET = new THREE.Vector3(0, -0.02, 0);

const FRONT_CAM_POS = new THREE.Vector3(0.02, 0.04, 1.72);
const FRONT_TARGET = new THREE.Vector3(0, 0, 0);

const POV_CAM_POS = new THREE.Vector3(-0.48, 0.78, 1.05);
const POV_TARGET = new THREE.Vector3(-0.15, -0.05, 0.05);

const NECK_WORLD_Y = NECK_FOCUS_Y - MODEL_CENTER_Y;
const NECK_CAM_POS = new THREE.Vector3(-NECK_WORLD_Y - 0.035, -0.09, 0.64);
const NECK_TARGET = new THREE.Vector3(-NECK_WORLD_Y - 0.035, -0.09, 0.05);

interface CameraRigProps {
  stageMode: StageMode;
  camPreset: CamPreset;
  onInteractChange: (interacting: boolean) => void;
}

function CameraRig({ stageMode, camPreset, onInteractChange }: CameraRigProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const userMovedRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const initedRef = useRef(false);

  useEffect(() => {
    userMovedRef.current = false;
  }, [camPreset, stageMode]);

  useEffect(() => {
    if (!initedRef.current && controlsRef.current) {
      initedRef.current = true;
      const t = stageMode === 'neck' ? NECK_TARGET : OVERVIEW_TARGET;
      controlsRef.current.target.copy(t);
      controlsRef.current.update();
    }
  }, [stageMode]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.15);
    const ctrl = controlsRef.current;

    if (stageMode === 'neck') {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, NECK_CAM_POS.x, 10, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, NECK_CAM_POS.y, 10, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, NECK_CAM_POS.z, 10, dt);

      if (ctrl) {
        ctrl.target.x = THREE.MathUtils.damp(ctrl.target.x, NECK_TARGET.x, 10, dt);
        ctrl.target.y = THREE.MathUtils.damp(ctrl.target.y, NECK_TARGET.y, 10, dt);
        ctrl.target.z = THREE.MathUtils.damp(ctrl.target.z, NECK_TARGET.z, 10, dt);
        camera.lookAt(ctrl.target);
      }
    } else if (!userMovedRef.current) {
      let targetPos = OVERVIEW_CAM_POS;
      let targetLook = OVERVIEW_TARGET;

      if (camPreset === 'front') {
        targetPos = FRONT_CAM_POS;
        targetLook = FRONT_TARGET;
      } else if (camPreset === 'pov') {
        targetPos = POV_CAM_POS;
        targetLook = POV_TARGET;
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos.x, 7, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos.y, 7, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos.z, 7, dt);

      if (ctrl) {
        ctrl.target.x = THREE.MathUtils.damp(ctrl.target.x, targetLook.x, 7, dt);
        ctrl.target.y = THREE.MathUtils.damp(ctrl.target.y, targetLook.y, 7, dt);
        ctrl.target.z = THREE.MathUtils.damp(ctrl.target.z, targetLook.z, 7, dt);
        ctrl.update();
      }
    }
  });

  const handleStart = () => {
    userMovedRef.current = true;
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    onInteractChange(true);
  };

  const handleEnd = () => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      onInteractChange(false);
    }, 2400);
  };

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={stageMode === 'overview'}
      enablePan={false}
      minDistance={0.35}
      maxDistance={2.2}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.85}
      minAzimuthAngle={-Math.PI * 0.65}
      maxAzimuthAngle={Math.PI * 0.65}
      dampingFactor={0.08}
      enableDamping
      onStart={handleStart}
      onEnd={handleEnd}
    />
  );
}

export function GuitarStage({
  chordName,
  position,
  positionIdx,
  totalPositions,
  displayMode,
  isLeftHanded,
  songChords,
  selectedPatternId,
  isPlayingStrumSeq,
  onSelectChord,
  onPositionChange,
  onDisplayModeChange,
  onOpenChordDetail,
  onSelectPattern,
  onPlayStrumSequence,
}: GuitarStageProps) {
  const initialNeck = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('stage') === 'neck';
  }, []);

  const [stageMode, setStageMode] = useState<StageMode>(initialNeck ? 'neck' : 'overview');
  const [camPreset, setCamPreset] = useState<CamPreset>('overview');
  const [userInteracting, setUserInteracting] = useState(false);
  const [hoverRegion, setHoverRegion] = useState<'none' | 'neck' | 'body'>('none');
  const [pluckPulse, setPluckPulse] = useState<PluckPulse>({ seq: 0, stringIdx: -1 });

  // Automatically animate 3D strings & finger press whenever active chord changes (including live song auto-play)
  useEffect(() => {
    setPluckPulse((prev) => ({ seq: prev.seq + 1, stringIdx: -1 }));
  }, [chordName, position]);

  const theory = useMemo(
    () => getChordTheoryDetails(chordName, position),
    [chordName, position]
  );

  const activePattern = useMemo(
    () => STRUM_PATTERNS.find((p) => p.id === selectedPatternId) || STRUM_PATTERNS[0],
    [selectedPatternId]
  );

  const triggerStrum = useCallback(
    (direction: 'down' | 'up' = 'down') => {
      guitarAudio.strumChord(position, direction, 22);
      setPluckPulse((prev) => ({ seq: prev.seq + 1, stringIdx: -1 }));
    },
    [position]
  );

  const triggerPluck = useCallback((stringIdx: number) => {
    setPluckPulse((prev) => ({ seq: prev.seq + 1, stringIdx }));
  }, []);

  const enterNeckMode = useCallback(() => {
    setStageMode('neck');
    setCamPreset('neck');
    guitarAudio.strumChord(position, 'down', 22);
    setPluckPulse((prev) => ({ seq: prev.seq + 1, stringIdx: -1 }));
  }, [position]);

  const enterOverviewMode = useCallback(() => {
    setStageMode('overview');
    setCamPreset('overview');
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#11131a] overflow-hidden select-none">
      {/* 3D HERO VIEWPORT WITH SEAMLESS STUDIO BACKDROP */}
      <div
        className="relative flex-1 min-h-0 w-full overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, #161924 0%, #11131a 80%)',
        }}
      >
        {/* TOP-LEFT HUD: ACTIVE CHORD TELEMETRY BADGE */}
        <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2.5 bg-[#0e1017]/85 border border-white/[0.08] rounded-2xl px-3.5 py-2 backdrop-blur-xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <button
            onClick={onOpenChordDetail}
            className="px-2.5 py-0.5 bg-amber-500 text-slate-950 font-mono text-sm font-extrabold rounded-lg cursor-pointer hover:bg-amber-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            title="Akor teorisini incele"
          >
            {chordName}
          </button>
          <div className="flex flex-col font-mono">
            <span className="text-[11px] font-bold text-slate-200 leading-tight">
              {theory.typeCategory}
            </span>
            <span className="text-[10px] text-slate-400 leading-tight">
              {position.baseFret > 1 ? `${position.baseFret}. Perde` : 'Açık'} • #{positionIdx + 1}/{totalPositions}
            </span>
          </div>
          <button
            onClick={() => triggerStrum('down')}
            className="ml-1 flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-amber-500/30 text-amber-400 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>TINLAT</span>
          </button>
        </div>

        {/* TOP-RIGHT HUD: POLYGONIUM 3D CAMERA FLOATING PILLS */}
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1 bg-[#0e1017]/85 border border-white/[0.08] rounded-full p-1 backdrop-blur-xl shadow-2xl font-mono text-[10px]">
          <button
            onClick={() => {
              setStageMode('overview');
              setCamPreset('pov');
            }}
            className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer active:scale-95 ${
              stageMode === 'overview' && camPreset === 'pov'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Oyuncu Bakış Açısı (POV)"
          >
            POV
          </button>
          <button
            onClick={() => {
              setStageMode('overview');
              setCamPreset('front');
            }}
            className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer active:scale-95 ${
              stageMode === 'overview' && camPreset === 'front'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Önden Bakış Açısı"
          >
            KARŞIDAN
          </button>
          <button
            onClick={() => {
              setStageMode('overview');
              setCamPreset('overview');
            }}
            className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer active:scale-95 ${
              stageMode === 'overview' && camPreset === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Tam Gitar Görünümü"
          >
            TAM GİTAR
          </button>
          <button
            onClick={() => {
              enterNeckMode();
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold transition-all cursor-pointer active:scale-95 ${
              stageMode === 'neck'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Sap ve 2D Akor Klavyesi"
          >
            <Layers className="w-3 h-3" />
            <span>KLAVYE</span>
          </button>
        </div>

        {/* THREE.JS WEBGL CANVAS */}
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{
            position: initialNeck
              ? [NECK_CAM_POS.x, NECK_CAM_POS.y, NECK_CAM_POS.z]
              : [OVERVIEW_CAM_POS.x, OVERVIEW_CAM_POS.y, OVERVIEW_CAM_POS.z],
            fov: 34,
            near: 0.04,
            far: 20,
          }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
        >
          <Suspense fallback={null}>
            {/* Studio Lighting & Reflections (Zero Network Dependencies) */}
            <ambientLight intensity={0.45} />
            <directionalLight
              position={[1.8, 2.2, 2.4]}
              intensity={2.4}
              color="#fff6e5"
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <directionalLight position={[-2.0, 1.0, 1.2]} intensity={1.1} color="#93c5fd" />
            <spotLight
              position={[0.2, 1.8, -1.6]}
              intensity={1.8}
              angle={0.6}
              penumbra={0.8}
              color="#fbbf24"
            />

            <Environment resolution={256} frames={1}>
              <Lightformer
                form="rect"
                intensity={2.8}
                color="#fff3db"
                position={[2.5, 1.5, 2]}
                scale={[3, 6, 1]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="rect"
                intensity={1.6}
                color="#cbd5e1"
                position={[-3, 1, 1.5]}
                scale={[2.5, 5, 1]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="ring"
                intensity={1.2}
                color="#f59e0b"
                position={[0, 3, -2]}
                scale={3}
                target={[0, 0, 0]}
              />
            </Environment>

            <GuitarModel
              chordName={chordName}
              position={position}
              isLeftHanded={isLeftHanded}
              stageMode={stageMode}
              userInteracting={userInteracting}
              pluckPulse={pluckPulse}
              onSelectNeck={enterNeckMode}
              onStrumBody={() => triggerStrum('down')}
              onHoverRegionChange={setHoverRegion}
            />

            <ContactShadows
              position={[0, -0.55, 0]}
              opacity={0.65}
              scale={1.5}
              blur={2.4}
              far={1.2}
            />

            <CameraRig
              stageMode={stageMode}
              camPreset={camPreset}
              onInteractChange={setUserInteracting}
            />
          </Suspense>
        </Canvas>

        {/* BOTTOM-CENTER INTERACTIVE HINT IN OVERVIEW MODE */}
        {stageMode === 'overview' && (
          <div className="
            absolute bottom-3 left-1/2 -translate-x-1/2 z-10
            max-w-[calc(100%-24px)] flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full
            bg-[#191c26]/90 border border-white/10 backdrop-blur-md
            font-mono text-[10px] text-slate-300 shadow-xl pointer-events-none
            whitespace-nowrap overflow-hidden
          ">
            <span
              className={
                hoverRegion === 'neck'
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-300'
              }
            >
              🎸 Sapa Tıkla: Klavye
            </span>
            <span className="text-slate-600">•</span>
            <span
              className={
                hoverRegion === 'body'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400'
              }
            >
              Gövdeye Tıkla: Tınlat
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">360° Çevir</span>
          </div>
        )}

        {/* 2D PLAYABLE FRETBOARD OVERLAY WHEN NECK IS SELECTED */}
        <NeckOverlay
          visible={stageMode === 'neck'}
          chordName={chordName}
          position={position}
          positionIdx={positionIdx}
          totalPositions={totalPositions}
          displayMode={displayMode}
          isLeftHanded={isLeftHanded}
          songChords={songChords}
          onBack={enterOverviewMode}
          onSelectChord={onSelectChord}
          onPositionChange={onPositionChange}
          onDisplayModeChange={onDisplayModeChange}
          onOpenChordDetail={onOpenChordDetail}
          onStrum={triggerStrum}
          onStringPluck={triggerPluck}
        />
      </div>

      {/* BOTTOM DOCK: COMPACT 16-STEP STRUMMING SEQUENCER */}
      <div className="shrink-0 bg-[#090b10] border-t border-white/[0.08] px-4 py-2 font-mono text-xs flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px] shrink-0">
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">RİTİM DOCK</span>
          </span>
          <select
            value={selectedPatternId}
            onChange={(e) => onSelectPattern(e.target.value)}
            className="bg-[#131620] border border-white/[0.08] rounded-full px-2.5 py-1 text-[11px] text-slate-200 font-mono focus:outline-none max-w-[160px] sm:max-w-[210px] truncate shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
          >
            {STRUM_PATTERNS.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#11131a]">
                {p.name} ({p.timeSignature})
              </option>
            ))}
          </select>
        </div>

        {/* Step Grid */}
        <div className="flex items-center gap-1 shrink-0 justify-center">
          {activePattern.strokes.map((stroke, idx) => (
            <div
              key={idx}
              className={`w-7 py-1 px-0.5 rounded-md border text-center font-mono flex flex-col items-center justify-center shrink-0 ${
                stroke.accent
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold shadow-sm'
                  : stroke.type === 'rest'
                  ? 'bg-black/40 border-white/5 text-slate-600'
                  : 'bg-[#181c26] border-white/10 text-slate-300'
              }`}
            >
              <span className="text-[11px] font-bold leading-none">{stroke.label}</span>
              <span className="text-[8px] text-slate-500 uppercase leading-none mt-0.5">
                {stroke.type === 'rest' ? 'ES' : stroke.accent ? 'ACC' : 'BEAT'}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setPluckPulse((prev) => ({ seq: prev.seq + 1, stringIdx: -1 }));
            onPlayStrumSequence();
          }}
          disabled={isPlayingStrumSeq}
          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-mono text-[11px] font-bold rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/25 shrink-0 whitespace-nowrap active:scale-95"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isPlayingStrumSeq ? 'ÇALINIYOR...' : 'RİTİM TEST'}</span>
        </button>
      </div>
    </div>
  );
}

export default GuitarStage;
