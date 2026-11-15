import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { CricketScene } from './CricketScene';
import {
  Play,
  RotateCcw,
  Zap,
  Target,
  Shield,
  Flame,
  Award,
  Eye,
  Activity,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { sound } from '../services/sound';
import { api } from '../services/api';
import { socketService } from '../services/socket';

const SHOT_TYPES = [
  'Drive',
  'Lofted Drive',
  'Pull / Hook',
  'Cut',
  'Sweep',
  'Defensive Block',
  'Ramp / Scoop'
];

const SHOT_DIRECTIONS = [
  'Cover',
  'Point',
  'Extra Cover',
  'Mid-off',
  'Long-off',
  'Long-on',
  'Midwicket',
  'Square Leg',
  'Fine Leg',
  'Third Man'
];

const PITCH_LINES = [
  'Outside Off',
  'Off Stump',
  'Middle Stump',
  'Leg Stump'
];

const PITCH_LENGTHS = [
  'Yorker',
  'Full',
  'Good Length',
  'Short'
];

const DELIVERY_VARIATIONS = [
  'Yorker',
  'Bouncer',
  'Swing',
  'Seam',
  'Slower ball',
  'Off-spin',
  'Leg-spin'
];

export const CricketArena = ({
  match,
  onMatchUpdated,
  isSpectator = false,
  format = 'T20'
}) => {
  const containerRef = useRef(null);
  const phaserGameRef = useRef(null);
  const sceneRef = useRef(null);

  // Control Mode: 'manual' | 'tactical' | 'hybrid'
  const [controlMode, setControlMode] = useState('manual');

  // Manual Batting state
  const [selectedShot, setSelectedShot] = useState('Drive');
  const [selectedDirection, setSelectedDirection] = useState('Cover');
  const [runsChoice, setRunsChoice] = useState(1); // 0 = Hold Crease, 1 = Single, 2 = Push for 2

  // Manual Bowling state
  const [selectedLine, setSelectedLine] = useState('Off Stump');
  const [selectedLength, setSelectedLength] = useState('Good Length');
  const [selectedVariation, setSelectedVariation] = useState('Seam');

  // Interactive Timing Bar state
  const [timingPosition, setTimingPosition] = useState(50); // 0 to 100
  const [isTimingMoving, setIsTimingMoving] = useState(true);
  const [lockedTiming, setLockedTiming] = useState(null); // 'Early' | 'Good' | 'Perfect' | 'Late'

  // Delivery Execution State
  const [isDelivering, setIsDelivering] = useState(false);
  const [lastOutcome, setLastOutcome] = useState(null);

  // Initialize Phaser 3 Game
  useEffect(() => {
    if (!containerRef.current || phaserGameRef.current) return;

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 960,
      height: 540,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      backgroundColor: '#08120b',
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      },
      scene: [CricketScene]
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    game.events.once('ready', () => {
      const scene = game.scene.getScene('CricketScene');
      sceneRef.current = scene;
      if (scene && scene.init) {
        scene.init({
          tacticalPositions: match?.teamBTactics?.fieldPlacement?.customPositions,
          striker: match?.currentStriker,
          bowler: match?.currentBowler
        });
      }
    });

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
        sceneRef.current = null;
      }
    };
  }, []);

  // Update scene when tactical positions change
  useEffect(() => {
    if (sceneRef.current && match?.teamBTactics?.fieldPlacement?.customPositions) {
      sceneRef.current.tacticalPositions = match.teamBTactics.fieldPlacement.customPositions;
    }
  }, [match?.teamBTactics]);

  // Real-time Multiplayer Socket delivery synchronization
  useEffect(() => {
    const unsub = socketService.onDeliveryResult((res) => {
      if (res.deliveryData && sceneRef.current?.playDelivery) {
        setIsDelivering(true);
        setLastOutcome(res.outcome);

        if (res.outcome?.badge === 'SIX') sound.playSixHit();
        else if (res.outcome?.badge === 'FOUR' || res.outcome?.badge === 'WICKET') sound.playBatCrack();
        else sound.playClick();

        sceneRef.current.playDelivery(res.deliveryData, () => {
          setIsDelivering(false);
          setLockedTiming(null);
          setIsTimingMoving(true);
          if (onMatchUpdated && res.snapshot) {
            onMatchUpdated(res.snapshot);
          }
        });
      }
    });

    return () => unsub();
  }, [onMatchUpdated]);

  // Timing bar oscillation
  useEffect(() => {
    if (!isTimingMoving || isDelivering) return;

    let forward = true;
    let pos = timingPosition;
    const interval = setInterval(() => {
      if (forward) {
        pos += 2.5;
        if (pos >= 98) forward = false;
      } else {
        pos -= 2.5;
        if (pos <= 2) forward = true;
      }
      setTimingPosition(pos);
    }, 28);

    return () => clearInterval(interval);
  }, [isTimingMoving, isDelivering]);

  // Evaluate timing from current meter position
  // Temperament/Batting attribute widens sweet spot
  const calculateTimingFromPos = (pos) => {
    // 0-25: Early, 25-42: Good, 42-58: Perfect, 58-75: Good, 75-100: Late
    if (pos >= 42 && pos <= 58) return 'Perfect';
    if ((pos >= 25 && pos < 42) || (pos > 58 && pos <= 75)) return 'Good';
    if (pos < 25) return 'Early';
    return 'Late';
  };

  const handleLockTiming = () => {
    if (!isTimingMoving) {
      setIsTimingMoving(true);
      setLockedTiming(null);
      return;
    }
    const timing = calculateTimingFromPos(timingPosition);
    setLockedTiming(timing);
    setIsTimingMoving(false);
    sound.playClick();
  };

  // Authoritative Delivery Execution
  const handleExecuteDelivery = async () => {
    if (isDelivering || match?.status === 'completed') return;
    setIsDelivering(true);

    try {
      // Determine timing
      let timing = lockedTiming;
      if (!timing) {
        timing = calculateTimingFromPos(timingPosition);
      }

      // Hybrid mode check: if delivery is routine in hybrid mode, delegate to tactical
      const isCritical = (match?.teamA?.overs || 0) >= ((match?.teamA?.maxOvers || 20) - 2) || (match?.teamA?.wickets || 0) >= 8;
      const effectiveMode = controlMode === 'hybrid' && !isCritical ? 'tactical' : controlMode;

      const payload = {
        controlMode: effectiveMode,
        shotType: selectedShot,
        direction: selectedDirection,
        timing,
        deliveryTactic: selectedVariation,
        pitchLine: selectedLine,
        pitchLength: selectedLength,
        runsAttempted: runsChoice
      };

      if (socketService.connected) {
        socketService.submitMatchDelivery(match?.matchId || 'LIVE-IPL-FINAL', payload, `action_${Date.now()}`);
      } else {
        const res = await api.playDelivery(match?.matchId || 'LIVE-IPL-FINAL', payload);

        if (res.success && res.deliveryData) {
          setLastOutcome(res.outcome);

          // Sound effects
          if (res.outcome.badge === 'SIX') {
            sound.playSixHit();
          } else if (res.outcome.badge === 'FOUR') {
            sound.playBatCrack();
          } else if (res.outcome.badge === 'WICKET') {
            sound.playBatCrack();
          } else {
            sound.playClick();
          }

          // Trigger Phaser 3 Scene Animation
          if (sceneRef.current && sceneRef.current.playDelivery) {
            sceneRef.current.playDelivery(res.deliveryData, () => {
              setIsDelivering(false);
              setLockedTiming(null);
              setIsTimingMoving(true);
              if (onMatchUpdated && res.match) {
                onMatchUpdated(res.match);
              }
            });
          } else {
            setIsDelivering(false);
            setLockedTiming(null);
            setIsTimingMoving(true);
            if (onMatchUpdated && res.match) {
              onMatchUpdated(res.match);
            }
          }
        } else {
          setIsDelivering(false);
        }
      }
    } catch (err) {
      console.error('Error executing authoritative delivery:', err);
      setIsDelivering(false);
    }
  };

  return (
    <div className="bg-stadium-950 border border-stadium-800 rounded-3xl overflow-hidden shadow-2xl space-y-4">
      {/* ARENA HEADER: Control Mode Switcher & Broadcast Telemetry */}
      <div className="bg-stadium-900 border-b border-stadium-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 bg-pitch-500/20 text-pitch-400 font-mono text-xs font-bold px-3 py-1 rounded-full border border-pitch-500/30">
            <Activity className="w-3.5 h-3.5" /> 2D INTERACTIVE ARENA
          </span>
          <span className="text-xs font-mono text-slate-400">
            PHASER 3 REAL-TIME MATCH ENGINE
          </span>
        </div>

        {/* 3 CONTROL MODES SWITCHER */}
        {!isSpectator ? (
          <div className="flex items-center gap-1 bg-stadium-950 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => { sound.playClick(); setControlMode('manual'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold uppercase transition-all ${
                controlMode === 'manual'
                  ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎮 MANUAL
            </button>
            <button
              onClick={() => { sound.playClick(); setControlMode('tactical'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold uppercase transition-all ${
                controlMode === 'tactical'
                  ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🧠 TACTICAL
            </button>
            <button
              onClick={() => { sound.playClick(); setControlMode('hybrid'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold uppercase transition-all ${
                controlMode === 'hybrid'
                  ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ HYBRID
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-blue-950/40 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-xl text-xs font-mono">
            <Eye className="w-3.5 h-3.5" /> LIVE SPECTATOR CAM (READ ONLY)
          </div>
        )}
      </div>

      {/* PHASER 3 CANVAS VIEWPORT */}
      <div className="relative w-full aspect-[16/9] bg-stadium-950 flex items-center justify-center overflow-hidden">
        <div ref={containerRef} className="w-full h-full flex items-center justify-center" />

        {/* IN-GAME MINI BROADCAST HUD OVERLAY */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="bg-stadium-950/85 backdrop-blur-md border border-gold-500/30 rounded-2xl px-4 py-2 flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">STRIKER</span>
              <strong className="text-gold-400">{match?.currentStriker?.name || 'V. Kohli'}</strong>{' '}
              <span className="text-white font-bold">{match?.currentStriker?.runs || 0}*</span>
            </div>
            <div className="border-l border-white/10 pl-3">
              <span className="text-[10px] text-slate-400 block uppercase">BOWLER</span>
              <strong className="text-pitch-400">{match?.currentBowler?.name || 'J. Bumrah'}</strong>{' '}
              <span className="text-white font-bold">{match?.currentBowler?.wickets || 0}-{match?.currentBowler?.runs || 0}</span>
            </div>
          </div>

          <div className="bg-stadium-950/85 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">SCORE</span>
              <p className="font-display font-black text-lg text-white">
                {match?.teamA?.score || 0}/{match?.teamA?.wickets || 0}{' '}
                <span className="text-xs font-mono text-slate-400 font-normal">
                  ({match?.teamA?.overs || 0}/{match?.teamA?.maxOvers || 20} ov)
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* SPECTATOR WATERMARK OVERLAY */}
        {isSpectator && (
          <div className="absolute bottom-4 left-4 bg-stadium-900/80 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            SYNCHRONIZED AUTHORITATIVE BROADCAST FEED
          </div>
        )}
      </div>

      {/* INTERACTIVE GAMEPLAY CONTROLS DECK (Only active for Players, hidden for Spectators) */}
      {!isSpectator && (
        <div className="p-4 sm:p-6 bg-stadium-900 border-t border-stadium-800 space-y-5">
          {controlMode === 'tactical' ? (
            /* TACTICAL MODE PANEL */
            <div className="bg-stadium-950 border border-stadium-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase text-gold-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> TACTICAL AUTONOMOUS SIMULATION ACTIVE
                </span>
                <p className="text-xs text-slate-400">
                  Deliveries execute automatically guided by your 18-zone field placement, bowler strategies, and batting tempos.
                </p>
              </div>
              <button
                onClick={handleExecuteDelivery}
                disabled={isDelivering || match?.status === 'completed'}
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-display font-bold uppercase text-sm shadow-gold-glow flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Zap className="w-4 h-4 fill-current" /> {isDelivering ? 'SIMULATING...' : 'EXECUTE TACTICAL BALL'}
              </button>
            </div>
          ) : (
            /* MANUAL & HYBRID CONTROL DECKS */
            <div className="space-y-5">
              {/* TIMING METER BAR */}
              <div className="bg-stadium-950 border border-stadium-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400" /> TIMING METER
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      CURRENT: <strong className={
                        lockedTiming === 'Perfect' ? 'text-gold-400' :
                        lockedTiming === 'Good' ? 'text-cyan-400' :
                        lockedTiming === 'Early' ? 'text-amber-500' :
                        lockedTiming === 'Late' ? 'text-red-400' : 'text-slate-300'
                      }>
                        {lockedTiming || calculateTimingFromPos(timingPosition).toUpperCase()}
                      </strong>
                    </span>
                    <button
                      onClick={handleLockTiming}
                      disabled={isDelivering}
                      className="px-3 py-1 rounded-lg text-[10px] font-bold font-mono bg-stadium-800 hover:bg-gold-500 hover:text-slate-950 text-gold-400 transition-all border border-gold-500/30"
                    >
                      {lockedTiming ? 'UNLOCK / RESUME' : 'LOCK TIMING'}
                    </button>
                  </div>
                </div>

                {/* Meter Graphic */}
                <div className="relative h-6 rounded-xl overflow-hidden bg-stadium-900 border border-white/10 flex">
                  {/* Early Zone (0-25%) */}
                  <div className="w-[25%] bg-amber-950/60 flex items-center justify-center text-[9px] font-mono text-amber-500/70 border-r border-white/5">
                    EARLY
                  </div>
                  {/* Good Zone (25-42%) */}
                  <div className="w-[17%] bg-cyan-950/60 flex items-center justify-center text-[9px] font-mono text-cyan-400/70 border-r border-white/5">
                    GOOD
                  </div>
                  {/* Perfect Sweet Spot (42-58%) */}
                  <div className="w-[16%] bg-gold-950/80 flex items-center justify-center text-[9px] font-mono font-bold text-gold-400 border-r border-white/5 shadow-gold-glow">
                    PERFECT ★
                  </div>
                  {/* Good Zone (58-75%) */}
                  <div className="w-[17%] bg-cyan-950/60 flex items-center justify-center text-[9px] font-mono text-cyan-400/70 border-r border-white/5">
                    GOOD
                  </div>
                  {/* Late Zone (75-100%) */}
                  <div className="w-[25%] bg-red-950/60 flex items-center justify-center text-[9px] font-mono text-red-400/70">
                    LATE
                  </div>

                  {/* Needle Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_10px_#ffffff] transition-transform duration-75"
                    style={{ left: `calc(${timingPosition}% - 4px)` }}
                  />
                </div>
              </div>

              {/* BATTER CONTROLS & BOWLER CONTROLS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* BATTER CONTROLS */}
                <div className="bg-stadium-950 border border-gold-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stadium-800">
                    <span className="text-xs font-display font-bold uppercase text-gold-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" /> BATTER STANCE & SHOT
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      OVR {match?.currentStriker?.ovr || 115}
                    </span>
                  </div>

                  {/* Shot Selection */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">
                      SHOT TYPE
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {SHOT_TYPES.map(shot => (
                        <button
                          key={shot}
                          onClick={() => setSelectedShot(shot)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                            selectedShot === shot
                              ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                              : 'bg-stadium-900 border border-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          {shot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direction Selection */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">
                      DIRECTION TARGET
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {SHOT_DIRECTIONS.map(dir => (
                        <button
                          key={dir}
                          onClick={() => setSelectedDirection(dir)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                            selectedDirection === dir
                              ? 'bg-gold-500 text-slate-950 shadow-gold-glow'
                              : 'bg-stadium-900 border border-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          {dir}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Running between wickets selection */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">
                      RUNNING INTENT
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setRunsChoice(0)}
                        className={`py-1.5 rounded-lg text-[11px] font-mono font-bold ${
                          runsChoice === 0
                            ? 'bg-slate-700 text-white border border-white/30'
                            : 'bg-stadium-900 text-slate-400 border border-white/5'
                        }`}
                      >
                        HOLD CREASE
                      </button>
                      <button
                        onClick={() => setRunsChoice(1)}
                        className={`py-1.5 rounded-lg text-[11px] font-mono font-bold ${
                          runsChoice === 1
                            ? 'bg-pitch-500 text-slate-950 font-bold'
                            : 'bg-stadium-900 text-slate-400 border border-white/5'
                        }`}
                      >
                        RUN (1)
                      </button>
                      <button
                        onClick={() => setRunsChoice(2)}
                        className={`py-1.5 rounded-lg text-[11px] font-mono font-bold ${
                          runsChoice === 2
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-stadium-900 text-slate-400 border border-white/5'
                        }`}
                      >
                        PUSH FOR 2! ⚡
                      </button>
                    </div>
                  </div>
                </div>

                {/* BOWLER CONTROLS */}
                <div className="bg-stadium-950 border border-pitch-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stadium-800">
                    <span className="text-xs font-display font-bold uppercase text-pitch-400 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> BOWLER LINE & LENGTH
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      OVR {match?.currentBowler?.ovr || 118}
                    </span>
                  </div>

                  {/* Bowling Line */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">
                      LINE
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PITCH_LINES.map(line => (
                        <button
                          key={line}
                          onClick={() => setSelectedLine(line)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                            selectedLine === line
                              ? 'bg-pitch-500 text-slate-950 shadow-pitch-glow'
                              : 'bg-stadium-900 border border-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          {line}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bowling Length */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">
                      LENGTH
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PITCH_LENGTHS.map(len => (
                        <button
                          key={len}
                          onClick={() => setSelectedLength(len)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                            selectedLength === len
                              ? 'bg-pitch-500 text-slate-950 shadow-pitch-glow'
                              : 'bg-stadium-900 border border-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bowling Variation */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">
                      DELIVERY VARIATION
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DELIVERY_VARIATIONS.map(v => (
                        <button
                          key={v}
                          onClick={() => setSelectedVariation(v)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                            selectedVariation === v
                              ? 'bg-purple-500 text-white shadow-md'
                              : 'bg-stadium-900 border border-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* PRIMARY ACTION BUTTON: EXECUTE DELIVERY */}
              <div className="pt-2">
                <button
                  onClick={handleExecuteDelivery}
                  disabled={isDelivering || match?.status === 'completed'}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-display font-black uppercase text-base tracking-wide shadow-gold-glow flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-40"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  {isDelivering ? 'DELIVERY IN PROGRESS...' : 'PLAY DELIVERY (BOWL & HIT)'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

