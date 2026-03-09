'use client';

import { useState, useEffect } from "react";
import MuseumMap from "@/shared/components/Map";
import DoorList from "@/shared/components/DoorList";
import ControlBar from "@/shared/components/ControlBar";
import IntroductionSection from "@/shared/components/IntroductionSection";
import InstructionsSection from "@/shared/components/InstructionsSection";
import SolveResultDisplay from "@/shared/components/SolveResultDisplay";
import GeneticConfigModal from "@/shared/components/GeneticConfigModal";
import ShiftsAndPrioritiesModal from "@/shared/components/ShiftsAndPrioritiesModal";
import ShiftAndPriorityConfigSection from "@/shared/components/ShiftAndPriorityConfigSection";
import { Room, Door, Algorithm, SolveOutput, SolveInput, Solver } from "@/shared/types";
import { GreedySolver } from "@/shared/solvers/GreedySolver";
import { formatSolveOutputDescription } from "@/shared/utils/formatSolveOutputDescription";
import { GeneticSolver, GenerationDebug } from "@/shared/solvers/GeneticSolver";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts';

function normalizeShiftsPriorities(
  rooms: Room[],
  nbrOfShifts: number,
  shiftsPriorities: number[][]
): number[][] {
  return Array.from({ length: Math.max(1, nbrOfShifts) }, (_, s) => {
    const row = shiftsPriorities?.[s] ?? [];
    return rooms.map((_, i) => (Number.isFinite(row[i]) ? row[i] : 0));
  });
}

function findIsolatedRoomIds(rooms: Room[], doors: Door[]): number[] {
  const incidentCountByRoomId = new globalThis.Map<number, number>();
  for (const r of rooms) incidentCountByRoomId.set(r.id, 0);

  for (const d of doors) {
    incidentCountByRoomId.set(d.room1Id, (incidentCountByRoomId.get(d.room1Id) ?? 0) + 1);
    incidentCountByRoomId.set(d.room2Id, (incidentCountByRoomId.get(d.room2Id) ?? 0) + 1);
  }

  return rooms
    .filter((r) => (incidentCountByRoomId.get(r.id) ?? 0) === 0)
    .map((r) => r.id);
}

function GaTelemetryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: any }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as {
    generation: number;
    feasible: boolean;
    guards: number;
    coveredRooms: number;
    totalRooms: number;
    metric: number;
    metricLabel: string;
  };

  return (
    <div className="rounded border border-gray-200 bg-white px-2 py-1 text-xs shadow-sm">
      <div className="font-semibold text-gray-800">Gen {d.generation}</div>
      <div className="text-gray-700">
        {d.feasible ? "feasible" : "infeasible"}
      </div>
      <div className="text-gray-700">
        Covered: {d.coveredRooms}/{d.totalRooms}
      </div>
      <div className="text-gray-700">Guards: {d.guards}</div>
      <div className="text-gray-800 font-semibold">
        {d.metricLabel}: {d.metric}
      </div>
    </div>
  );
}

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: 1, x: 50, y: 50, width: 60, height: 60 },
    { id: 2, x: 150, y: 100, width: 60, height: 60 },
  ]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [nextRoomId, setNextRoomId] = useState(3);
  const [nextDoorId, setNextDoorId] = useState(1);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('greedy');
  const [solveResult, setSolveResult] = useState<SolveOutput | null>(null);
  const [solveDescription, setSolveDescription] = useState<string | null>(null);

  // Genetic algorithm UI state
  const [showGeneticModal, setShowGeneticModal] = useState(false);
  const [showShiftsModal, setShowShiftsModal] = useState(false);
  const [geneticConfig, setGeneticConfig] = useState<{ nbrOfShifts: number; shiftsPriorities: number[][] } | null>(null);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  // GA debug UI state
  const [gaDebugByShift, setGaDebugByShift] = useState<GenerationDebug[][] | null>(null);

  useEffect(() => {
    if (solveResult && currentResultIndex < solveResult.results.length) {
      const guardDoorIds = solveResult.results[currentResultIndex]?.guardDoorIds || [];
      setSolveDescription(formatSolveOutputDescription(guardDoorIds, doors));
    }
  }, [currentResultIndex, solveResult, doors]);

  const handleAddRoom = () => {
    setSolveResult(null);
    setSolveDescription(null);
    setGaDebugByShift(null);

    const existingIds = rooms.map(room => room.id).sort((a, b) => a - b);
    let newId = 1;
    for (const id of existingIds) {
      if (newId < id) break;
      newId = id + 1;
    }

    const newRoom: Room = {
      id: newId,
      x: 20 + Math.random() * 150,
      y: 20 + Math.random() * 150,
      width: 60,
      height: 60,
    };
    setRooms([...rooms, newRoom]);
  };

  const handleAddDoorFromButton = () => {
    const room1Input = prompt('Enter first room number:');
    const room2Input = prompt('Enter second room number:');

    if (room1Input && room2Input) {
      const room1Id = parseInt(room1Input);
      const room2Id = parseInt(room2Input);

      if (!isNaN(room1Id) && !isNaN(room2Id)) {
        handleAddDoor(room1Id, room2Id);
      } else {
        alert('Please enter valid room numbers');
      }
    }
  };

  const handleAddDoor = (room1Id: number, room2Id: number) => {
    setSolveResult(null);
    setSolveDescription(null);
    setGaDebugByShift(null);

    const room1Exists = rooms.some((r) => r.id === room1Id);
    const room2Exists = rooms.some((r) => r.id === room2Id);

    if (!room1Exists || !room2Exists) {
      alert('One or both rooms do not exist');
      return;
    }

    if (room1Id === room2Id) {
      alert('Cannot create a door between the same room');
      return;
    }

    // Check for duplicate door
    const doorExists = doors.some(
      (d) =>
        (d.room1Id === room1Id && d.room2Id === room2Id) ||
        (d.room1Id === room2Id && d.room2Id === room1Id)
    );

    if (doorExists) {
      alert('Door between these rooms already exists');
      return;
    }

    const newDoor: Door = {
      id: nextDoorId,
      room1Id,
      room2Id,
    };
    setDoors([...doors, newDoor]);
    setNextDoorId(nextDoorId + 1);
  };

  const handleUpdateRoom = (id: number, updates: Partial<Room>) => {
    setRooms(rooms.map((room) => (room.id === id ? { ...room, ...updates } : room)));
  };

  const handleDeleteRoom = (id: number) => {
    setSolveResult(null);
    setSolveDescription(null);
    setGaDebugByShift(null);

    setRooms(rooms.filter((room) => room.id !== id));
    // Also delete doors connected to this room
    setDoors(doors.filter((door) => door.room1Id !== id && door.room2Id !== id));
  };

  const handleDeleteDoor = (id: number) => {
    setSolveResult(null);
    setSolveDescription(null);
    setGaDebugByShift(null);

    setDoors(doors.filter((door) => door.id !== id));
  };

  const handleRandomGraph = () => {
    const roomCount = Math.floor(Math.random() * 6) + 3;
    const newRooms: Room[] = Array.from({ length: roomCount }, (_, i) => ({
      id: i + 1,
      x: 20 + Math.random() * 400,
      y: 20 + Math.random() * 300,
      width: 60,
      height: 60,
    }));

    const newDoors: Door[] = [];
    let doorId = 1;

    // Ensure connectivity: chain all rooms first
    for (let i = 1; i < roomCount; i++) {
      newDoors.push({ id: doorId++, room1Id: i, room2Id: i + 1 });
    }

    // Add extra random edges (up to roomCount extra)
    for (let i = 0; i < roomCount; i++) {
      const a = Math.floor(Math.random() * roomCount) + 1;
      const b = Math.floor(Math.random() * roomCount) + 1;
      if (a !== b && !newDoors.some(
        (d) => (d.room1Id === a && d.room2Id === b) || (d.room1Id === b && d.room2Id === a)
      )) {
        newDoors.push({ id: doorId++, room1Id: a, room2Id: b });
      }
    }

    setRooms(newRooms);
    setDoors(newDoors);
    setNextRoomId(roomCount + 1);
    setNextDoorId(doorId);

    setSolveResult(null);
    setSolveDescription(null);
    setShowGeneticModal(false);
    setShowShiftsModal(false);
    setGeneticConfig(null);
    setCurrentResultIndex(0);
    setGaDebugByShift(null);
  };

  const handleReset = () => {
    setRooms([
      { id: 1, x: 50, y: 50, width: 60, height: 60 },
      { id: 2, x: 150, y: 100, width: 60, height: 60 },
    ]);
    setDoors([]);
    setNextRoomId(3);
    setNextDoorId(1);
    setSelectedAlgorithm('greedy');
    setSolveResult(null);
    setSolveDescription(null);
    setShowGeneticModal(false);
    setShowShiftsModal(false);
    setGeneticConfig(null);
    setCurrentResultIndex(0);
    setGaDebugByShift(null);
  };

  const handleAlgorithmChange = (algorithm: Algorithm) => {
    setSelectedAlgorithm(algorithm);
    setSolveResult(null);
    setSolveDescription(null);
    setCurrentResultIndex(0);
    setGaDebugByShift(null);

    if (algorithm === 'genetic') {
      setShowGeneticModal(true);
    } else {
      setShowGeneticModal(false);
      setShowShiftsModal(false);
      setGeneticConfig(null);
      setCurrentResultIndex(0);
    }
  };

  const handleGeneticConfigYes = () => {
    setShowGeneticModal(false);
    setShowShiftsModal(true);
  };

  const handleGeneticConfigNo = () => {
    setShowGeneticModal(false);
    // Use default genetic config
    const defaultConfig = {
      nbrOfShifts: 1,
      shiftsPriorities: [Array(rooms.length).fill(0)],
    };
    setGeneticConfig(defaultConfig);
  };

  const handleShiftsAndPrioritiesConfirm = (
    nbrOfShifts: number,
    shiftsPriorities: number[][]
  ) => {
    setGeneticConfig({ nbrOfShifts, shiftsPriorities });
    setShowShiftsModal(false);
  };

  const handleShiftsAndPrioritiesClose = () => {
    setShowShiftsModal(false);
  };

  const handleGeneticConfigButton = () => {
    setShowShiftsModal(true);
  };

  const handleSolveOptimization = () => {
    setGaDebugByShift(null);

    if (selectedAlgorithm === 'genetic') {
      const isolated = findIsolatedRoomIds(rooms, doors);
      if (isolated.length > 0) {
        setSolveResult(null);
        setCurrentResultIndex(0);
        setSolveDescription(
          `Impossible to cover all rooms: room(s) ${isolated.join(
            ", "
          )} have no doors. Add at least one door connected to each room.`
        );
        return;
      }
    }

    const solverByAlg: Partial<Record<Algorithm, Solver>> = {
      greedy: new GreedySolver(),
      genetic: new GeneticSolver(),
    };

    const solver = solverByAlg[selectedAlgorithm];
    if (!solver) {
      alert(`Algorithm "${selectedAlgorithm}" not yet implemented.`);
      return;
    }

    const solveInput: SolveInput = (() => {
      if (selectedAlgorithm === 'greedy') {
        return { rooms, doors, algorithm: 'greedy' };
      }

      const cfg = geneticConfig ?? {
        nbrOfShifts: 1,
        shiftsPriorities: [Array(rooms.length).fill(0)],
      };

      return {
        rooms,
        doors,
        algorithm: 'genetic',
        nbrOfShifts: cfg.nbrOfShifts,
        shiftsPriorities: normalizeShiftsPriorities(rooms, cfg.nbrOfShifts, cfg.shiftsPriorities),
      };
    })();

    try {
      const output = solver.solve(solveInput);

      setSolveResult(output);
      setCurrentResultIndex(0);

      const guardDoorIds = output.results[0]?.guardDoorIds || [];
      setSolveDescription(formatSolveOutputDescription(guardDoorIds, doors));

      if (solver instanceof GeneticSolver) {
        setGaDebugByShift(solver.getLastDebugByShift().map((s) => [...s]));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSolveResult(null);
      setCurrentResultIndex(0);
      setGaDebugByShift(null);
      setSolveDescription(msg);
    }
  };

  const debugForCurrentShift = gaDebugByShift?.[currentResultIndex] ?? null;

  const chartData =
    debugForCurrentShift?.map((row) => {
      const feasible = (row as any).feasible === true; // safe if old rows exist
      const guards = Number.isFinite((row as any).guards) ? (row as any).guards : 0;
      const coveredRooms = Number.isFinite((row as any).coveredRooms) ? (row as any).coveredRooms : 0;
      const totalRooms = Number.isFinite((row as any).totalRooms) ? (row as any).totalRooms : 0;
      const metric = feasible ? guards : coveredRooms;
      return {
        generation: (row as any).generation ?? 0,
        feasible,
        guards,
        coveredRooms,
        totalRooms,
        metric,
        metricLabel: feasible ? "Guards (feasible)" : "Covered rooms (infeasible)",
      };
    }) ?? [];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 portrait:flex portrait:flex-col landscape:flex landscape:flex-row">
      {/* Left Panel */}
      <div className="portrait:w-full portrait:h-[40vh] portrait:overflow-y-auto landscape:w-96 xl:w-[32rem] 2xl:w-[36rem] landscape:h-screen landscape:overflow-y-auto p-4 sm:p-6 bg-white portrait:border-b landscape:border-r border-gray-200 flex flex-col">
        <h1 className="text-xl sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">
          Museum Guard Optimization
        </h1>

        {/* Introduction */}
        <IntroductionSection />

        {/* Instructions */}
        <InstructionsSection />

        {/* Genetic Configuration Section */}
        {geneticConfig && selectedAlgorithm === 'genetic' && (
          <ShiftAndPriorityConfigSection
            nbrOfShifts={geneticConfig.nbrOfShifts}
            shiftsPriorities={geneticConfig.shiftsPriorities}
          />
        )}

        {/* Door List */}
        <DoorList doors={doors} />
      </div>

      {/* Right Panel - Map View */}
      <div className="portrait:w-full portrait:h-[60vh] portrait:overflow-y-auto landscape:flex-1 landscape:h-screen landscape:overflow-y-auto p-3 sm:p-6 flex flex-col bg-gray-50">
        {/* Top Control Bar */}
        <ControlBar
          selectedAlgorithm={selectedAlgorithm}
          onAlgorithmChange={handleAlgorithmChange}
          onRandomGraph={handleRandomGraph}
          onAddRoom={handleAddRoom}
          onAddDoor={handleAddDoorFromButton}
          onSolve={handleSolveOptimization}
          onReset={handleReset}
          onGeneticConfig={handleGeneticConfigButton}
        />

        <SolveResultDisplay solveDescription={solveDescription} />

        {selectedAlgorithm === "genetic" && chartData.length > 0 && (
          <div className="mb-3 rounded border border-gray-200 bg-white px-3 py-2">
            <div className="text-sm font-semibold text-gray-700">
              GA telemetry (best-so-far)
            </div>
            <div className="mt-2 h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="generation" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip content={<GaTelemetryTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="metric"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Y shows <span className="font-semibold">Covered rooms</span> until feasible, then switches to{" "}
              <span className="font-semibold">Guards</span> to visualize pruning.
            </div>
          </div>
        )}

        <div className="h-100 sm:h-125 portrait:h-90 shrink-0">
          <MuseumMap
        rooms={rooms}
        doors={doors}
        guardDoorIds={solveResult?.results[currentResultIndex]?.guardDoorIds ?? []}
        onUpdateRoom={handleUpdateRoom}
        onDeleteRoom={handleDeleteRoom}
        onDeleteDoor={handleDeleteDoor}
      />
        </div>

        {/* Multi-result navigation */}
        {solveResult && solveResult.nbrOfResults > 1 && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <button
              onClick={() => setCurrentResultIndex((prev) => (prev > 0 ? prev - 1 : solveResult.nbrOfResults - 1))}
              className="px-3 py-1 sm:px-4 sm:py-2 text-slate-400 text-sm sm:text-base font-semibold rounded hover:text-slate-500 transition-colors"
            >
              ◀
            </button>
            <span className="text-sm sm:text-base font-semibold text-gray-700">
              Result {currentResultIndex + 1} of {solveResult.nbrOfResults}
            </span>
            <button
              onClick={() => setCurrentResultIndex((prev) => (prev < solveResult.nbrOfResults - 1 ? prev + 1 : 0))}
              className="px-3 py-1 sm:px-4 sm:py-2 text-slate-400 text-sm sm:text-base font-semibold rounded hover:text-slate-500 transition-colors"
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <GeneticConfigModal
        isOpen={showGeneticModal}
        onYes={handleGeneticConfigYes}
        onNo={handleGeneticConfigNo}
      />
      <ShiftsAndPrioritiesModal
        isOpen={showShiftsModal}
        rooms={rooms}
        onConfirm={handleShiftsAndPrioritiesConfirm}
        onClose={handleShiftsAndPrioritiesClose}
      />
    </div>
  );
}
