'use client';

import { useState, useEffect, useRef } from "react";
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
import { GeneticSolver, GenerationDebug } from "@/shared/solvers/GeneticSolver";
import { formatSolveOutputDescription } from "@/shared/utils/formatSolveOutputDescription";
import { normalizeShiftsPriorities } from "@/shared/utils/normalizeShiftsPriorities";
import { findIsolatedRoomIds } from "@/shared/utils/findIsolatedRoomIds";
import { buildChartData } from "@/shared/utils/buildChartData";
import GaTelemetryChart from "@/shared/components/GaTelemetryChart";
import MultiResultNavigation from '@/shared/components/MultiResultNavigation';

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

  // Undo history
  const historyRef = useRef<Array<{ rooms: Room[]; doors: Door[] }>>([]);
  const pushHistory = () => {
    historyRef.current = [...historyRef.current.slice(-19), { rooms: [...rooms], doors: [...doors] }];
  };
  const [historySize, setHistorySize] = useState(0);
  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setHistorySize(historyRef.current.length);
    setRooms(prev.rooms);
    setDoors(prev.doors);
    setSolveResult(null);
    setSolveDescription(null);
    setGaDebugByShift(null);
    setPendingRoomId(null);
  };

  // Add-door-by-click state
  const [pendingRoomId, setPendingRoomId] = useState<number | null>(null);

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
    pushHistory();
    setHistorySize(historyRef.current.length);
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

  const handleRoomSelect = (roomId: number) => {
    if (pendingRoomId === null) {
      setPendingRoomId(roomId);
    } else {
      if (pendingRoomId === roomId) {
        setPendingRoomId(null);
        return;
      }
      handleAddDoor(pendingRoomId, roomId);
      setPendingRoomId(null);
    }
  };

  const handleAddDoor = (room1Id: number, room2Id: number) => {
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

    pushHistory();
    setHistorySize(historyRef.current.length);
    setSolveResult(null);
    setSolveDescription(null);
    setGaDebugByShift(null);
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
    pushHistory();
    setHistorySize(historyRef.current.length);
    setSolveResult(null);
    setSolveDescription(null);
    setGaDebugByShift(null);
    setPendingRoomId(null);

    setRooms(rooms.filter((room) => room.id !== id));
    // Also delete doors connected to this room
    setDoors(doors.filter((door) => door.room1Id !== id && door.room2Id !== id));
  };

  const handleDeleteDoor = (id: number) => {
    pushHistory();
    setHistorySize(historyRef.current.length);
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

    historyRef.current = [];
    setHistorySize(0);
    setSolveResult(null);
    setSolveDescription(null);
    setShowGeneticModal(false);
    setShowShiftsModal(false);
    setGeneticConfig(null);
    setCurrentResultIndex(0);
    setGaDebugByShift(null);
    setPendingRoomId(null);
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
    historyRef.current = [];
    setHistorySize(0);
    setSolveResult(null);
    setSolveDescription(null);
    setShowGeneticModal(false);
    setShowShiftsModal(false);
    setGeneticConfig(null);
    setCurrentResultIndex(0);
    setGaDebugByShift(null);
    setPendingRoomId(null);
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
  const chartData = debugForCurrentShift ? buildChartData(debugForCurrentShift) : [];

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
          onSolve={handleSolveOptimization}
          onReset={handleReset}
          onUndo={handleUndo}
          canUndo={historySize > 0}
          onGeneticConfig={handleGeneticConfigButton}
        />

        <SolveResultDisplay solveDescription={solveDescription} />

        {selectedAlgorithm === "genetic" && chartData.length > 0 && (
          <GaTelemetryChart chartData={chartData} />
        )}

        <div className="h-100 sm:h-125 portrait:h-90 shrink-0">
          <MuseumMap
            rooms={rooms}
            doors={doors}
            guardDoorIds={solveResult?.results[currentResultIndex]?.guardDoorIds ?? []}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            onDeleteDoor={handleDeleteDoor}
            onSelectRoom={handleRoomSelect}
            selectedRoomId={pendingRoomId}
          />
        </div>

        {/* Multi-result navigation */}
        {solveResult && solveResult.nbrOfResults > 1 && (
          <MultiResultNavigation
            current={currentResultIndex}
            total={solveResult.nbrOfResults}
            onPrev={() => setCurrentResultIndex((prev) => (prev > 0 ? prev - 1 : solveResult.nbrOfResults - 1))}
            onNext={() => setCurrentResultIndex((prev) => (prev < solveResult.nbrOfResults - 1 ? prev + 1 : 0))}
          />
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
