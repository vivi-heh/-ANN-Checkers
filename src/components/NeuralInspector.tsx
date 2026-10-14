import React, { useId } from 'react';
import { AISearchTelemetry } from '../types/checkers';
import { Cpu, Activity, Zap, Shield, Target, Award } from 'lucide-react';

interface NeuralInspectorProps {
  telemetry: AISearchTelemetry | null;
  isAiThinking: boolean;
  difficulty: string;
}

export const NeuralInspector: React.FC<NeuralInspectorProps> = ({
  telemetry,
  isAiThinking,
  difficulty,
}) => {
  const maskId = useId();
  const acts = telemetry?.activations;
  const breakdown = telemetry?.featureBreakdown;

  // Compute normalized values for mini neuron layer visualization
  // Sample 8 input features, 12 L1 neurons, 8 L2 neurons, 6 L3 neurons, 1 output neuron for compact SVG rendering
  const sampleInputs = acts?.input ? acts.input.slice(0, 10) : new Array(10).fill(0.3);
  const sampleL1 = acts?.layer1 ? acts.layer1.slice(0, 12) : new Array(12).fill(0.2);
  const sampleL2 = acts?.layer2 ? acts.layer2.slice(0, 8) : new Array(8).fill(0.2);
  const sampleL3 = acts?.layer3 ? acts.layer3.slice(0, 6) : new Array(6).fill(0.1);
  const outputVal = acts ? Math.min(1, Math.max(-1, acts.output / 500)) : 0;

  const getNeuronFill = (val: number) => {
    const abs = Math.min(1, Math.abs(val));
    if (val > 0) return `rgba(245, 158, 11, ${0.25 + abs * 0.75})`; // Amber
    if (val < 0) return `rgba(244, 63, 94, ${0.25 + abs * 0.75})`; // Rose
    return 'rgba(120, 113, 108, 0.3)';
  };

  return (
    <div
      id="neural-inspector"
      className="flex flex-col gap-4 p-5 rounded-2xl bg-stone-900/90 border border-stone-800 text-stone-200 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold tracking-tight text-stone-100">
            ANN Engine Telemetry
          </h2>
        </div>
        <div className="text-xs text-stone-400 font-mono">
          <span>{difficulty.toUpperCase()}</span>
          <span className="mx-1.5 text-stone-600">·</span>
          <span>{isAiThinking ? 'Evaluating...' : 'Ready'}</span>
        </div>
      </div>

      {/* Evaluation & Win Probability Meter */}
      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-stone-950/70 border border-stone-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-400 font-medium">Position Evaluation</span>
          <span className="font-mono tabular-nums font-semibold text-stone-200">
            {telemetry ? (telemetry.evalScore > 0 ? `+${telemetry.evalScore}` : telemetry.evalScore) : '0'}{' '}
            <span className="text-stone-300 font-normal">pts</span>
          </span>
        </div>

        {/* Win Probability Bar */}
        <div className="relative w-full h-2.5 rounded-full bg-stone-800 overflow-hidden flex">
          {/* Red Side (Human) */}
          <div
            className="h-full bg-rose-500 transition-all duration-300"
            style={{
              width: `${telemetry ? Math.max(5, Math.min(95, 50 - telemetry.winProbability / 2)) : 50}%`,
            }}
          />
          {/* Black Side (AI) */}
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{
              width: `${telemetry ? Math.max(5, Math.min(95, 50 + telemetry.winProbability / 2)) : 50}%`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-stone-300 font-mono">
          <span>Red (Human): {telemetry ? Math.round(50 - telemetry.winProbability / 2) : 50}%</span>
          <span>Black (ANN): {telemetry ? Math.round(50 + telemetry.winProbability / 2) : 50}%</span>
        </div>
      </div>

      {/* Real-time Neural Layer Activation Graph */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-stone-950/70 border border-stone-800/80">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-stone-300">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">Live Feedforward Activations</span>
          </div>
          <span className="text-[10px] text-stone-300 font-mono">48 → 64 → 32 → 16 → 1</span>
        </div>

        {/* SVG Network Topology Visualizer */}
        <div className="relative h-28 w-full flex items-center justify-center bg-stone-950 rounded-lg p-2 overflow-hidden border border-stone-800/50">
          <svg className="w-full h-full" viewBox="0 0 320 100">
            <defs>
              <linearGradient id={`${maskId}-lineGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.15)" />
                <stop offset="100%" stopColor="rgba(245, 158, 11, 0.4)" />
              </linearGradient>
            </defs>

            {/* Connecting Synaptic Weights */}
            {sampleInputs.map((_, i) =>
              sampleL1.map((_, j) => {
                if ((i + j) % 3 === 0) {
                  return (
                    <line
                      key={`l1-${i}-${j}`}
                      x1="20"
                      y1={10 + i * 8.5}
                      x2="90"
                      y2={6 + j * 7.5}
                      stroke={`url(#${maskId}-lineGrad)`}
                      strokeWidth="0.5"
                      opacity={isAiThinking ? 0.6 : 0.25}
                    />
                  );
                }
                return null;
              })
            )}

            {sampleL1.map((_, i) =>
              sampleL2.map((_, j) => {
                if ((i + j) % 3 === 0) {
                  return (
                    <line
                      key={`l2-${i}-${j}`}
                      x1="90"
                      y1={6 + i * 7.5}
                      x2="170"
                      y2={12 + j * 10}
                      stroke={`url(#${maskId}-lineGrad)`}
                      strokeWidth="0.5"
                      opacity={isAiThinking ? 0.7 : 0.3}
                    />
                  );
                }
                return null;
              })
            )}

            {sampleL2.map((_, i) =>
              sampleL3.map((_, j) => {
                return (
                  <line
                    key={`l3-${i}-${j}`}
                    x1="170"
                    y1={12 + i * 10}
                    x2="250"
                    y2={16 + j * 12}
                    stroke={`url(#${maskId}-lineGrad)`}
                    strokeWidth="0.6"
                    opacity={isAiThinking ? 0.8 : 0.35}
                  />
                );
              })
            )}

            {sampleL3.map((_, j) => (
              <line
                key={`out-${j}`}
                x1="250"
                y1={16 + j * 12}
                x2="300"
                y2="50"
                stroke="rgba(245, 158, 11, 0.6)"
                strokeWidth="1"
                opacity={isAiThinking ? 1 : 0.5}
              />
            ))}

            {/* Input Nodes Column */}
            {sampleInputs.map((val, i) => (
              <circle
                key={`in-node-${i}`}
                cx="20"
                cy={10 + i * 8.5}
                r="3"
                fill={getNeuronFill(val)}
                className="transition-colors duration-200"
              />
            ))}

            {/* Hidden Layer 1 Nodes */}
            {sampleL1.map((val, i) => (
              <circle
                key={`l1-node-${i}`}
                cx="90"
                cy={6 + i * 7.5}
                r="2.8"
                fill={getNeuronFill(val)}
                className="transition-colors duration-200"
              />
            ))}

            {/* Hidden Layer 2 Nodes */}
            {sampleL2.map((val, i) => (
              <circle
                key={`l2-node-${i}`}
                cx="170"
                cy={12 + i * 10}
                r="3.2"
                fill={getNeuronFill(val)}
                className="transition-colors duration-200"
              />
            ))}

            {/* Hidden Layer 3 Nodes */}
            {sampleL3.map((val, i) => (
              <circle
                key={`l3-node-${i}`}
                cx="250"
                cy={16 + i * 12}
                r="3.5"
                fill={getNeuronFill(val)}
                className="transition-colors duration-200"
              />
            ))}

            {/* Output Node */}
            <circle
              cx="300"
              cy="50"
              r="6"
              fill={getNeuronFill(outputVal)}
              stroke="rgba(245, 158, 11, 0.8)"
              strokeWidth="1.5"
              className={isAiThinking ? 'animate-pulse' : ''}
            />
          </svg>
        </div>
      </div>

      {/* Strategic Feature Breakdown */}
      {breakdown && (
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-stone-950/70 border border-stone-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-stone-300 pb-1 border-b border-stone-800">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">Positional Heuristic Signals</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 font-mono text-[11px]">
            <div>
              <div className="flex justify-between text-stone-400">
                <span>Material</span>
                <span className="tabular-nums font-semibold text-stone-200">
                  {breakdown.materialDelta > 0 ? `+${breakdown.materialDelta}` : breakdown.materialDelta}
                </span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, 50 + breakdown.materialDelta / 4))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-stone-400">
                <span>Center Control</span>
                <span className="tabular-nums font-semibold text-stone-200">
                  {breakdown.centerControl > 0 ? `+${breakdown.centerControl}` : breakdown.centerControl}
                </span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, 50 + breakdown.centerControl / 2))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-stone-400">
                <span>Back-Row Lock</span>
                <span className="tabular-nums font-semibold text-stone-200">
                  {breakdown.backRowDefense > 0 ? `+${breakdown.backRowDefense}` : breakdown.backRowDefense}
                </span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-blue-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, 50 + breakdown.backRowDefense / 2))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-stone-400">
                <span>Bridge Defense</span>
                <span className="tabular-nums font-semibold text-stone-200">
                  {breakdown.bridgeIntegrity > 0 ? `+${breakdown.bridgeIntegrity}` : breakdown.bridgeIntegrity}
                </span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-indigo-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, 50 + breakdown.bridgeIntegrity / 2))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-stone-400">
                <span>Dog Hole Tactics</span>
                <span className="tabular-nums font-semibold text-stone-200">
                  {breakdown.dogHoleTactics > 0 ? `+${breakdown.dogHoleTactics}` : breakdown.dogHoleTactics}
                </span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-purple-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, 50 + breakdown.dogHoleTactics / 2))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-stone-400">
                <span>Mobility Index</span>
                <span className="tabular-nums font-semibold text-stone-200">
                  {breakdown.pieceMobility > 0 ? `+${breakdown.pieceMobility}` : breakdown.pieceMobility}
                </span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-amber-300 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, 50 + breakdown.pieceMobility / 2))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Computational Search Telemetry */}
      <div className="grid grid-cols-2 gap-2 text-stone-300 font-mono text-xs">
        <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] text-stone-300">Nodes Evaluated</span>
          <span className="text-sm font-semibold text-stone-100 tabular-nums">
            {telemetry ? telemetry.nodesEvaluated.toLocaleString() : '0'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] text-stone-300">Search Depth</span>
          <span className="text-sm font-semibold text-stone-100 tabular-nums">
            {telemetry ? `${telemetry.depthReached} plies` : '0 plies'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] text-stone-300">Nodes / Sec</span>
          <span className="text-sm font-semibold text-stone-100 tabular-nums">
            {telemetry ? `${(telemetry.nodesPerSec / 1000).toFixed(1)}k` : '0'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] text-stone-300">Transposition Hits</span>
          <span className="text-sm font-semibold text-stone-100 tabular-nums">
            {telemetry ? telemetry.transpositionHits.toLocaleString() : '0'}
          </span>
        </div>
      </div>
    </div>
  );
};
