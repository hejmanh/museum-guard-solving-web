'use client';

import Image from "next/image";
import { useState } from "react";
import Map from "@/shared/components/Map";
import DoorList from "@/shared/components/DoorList";
import { Room, Door, Algorithm, Solver, SolveResult } from "@/shared/types";
import { GreedySolver } from "@/shared/solvers/GreedySolver";

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: 1, x: 50, y: 50, width: 60, height: 60 },
    { id: 2, x: 150, y: 100, width: 60, height: 60 },
  ]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [nextRoomId, setNextRoomId] = useState(3);
  const [nextDoorId, setNextDoorId] = useState(1);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('greedy');
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);

  const handleAddRoom = () => {
    setSolveResult(null);
    // Find the lowest available ID
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
    // Check if rooms exist
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
    setRooms(rooms.filter((room) => room.id !== id));
    // Also delete doors connected to this room
    setDoors(doors.filter((door) => door.room1Id !== id && door.room2Id !== id));
  };

  const handleDeleteDoor = (id: number) => {
    setSolveResult(null);
    setDoors(doors.filter((door) => door.id !== id));
  };

  const handleRandomGraph = () => {
    const roomCount = Math.floor(Math.random() * 6) + 3; // 3–8 rooms
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
  };

  const handleSolveOptimization = () => {
    const solvers: Partial<Record<Algorithm, Solver>> = {
      greedy: new GreedySolver(),
    };
    const solver = solvers[selectedAlgorithm];
    if (!solver) {
      alert(`Algorithm "${selectedAlgorithm}" not yet implemented.`);
      return;
    }
    setSolveResult(solver.solve(rooms, doors));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 portrait:flex portrait:flex-col landscape:flex landscape:flex-row">
      {/* Left Panel */}
      <div className="portrait:w-full portrait:h-[40vh] portrait:overflow-y-auto landscape:w-96 xl:w-[32rem] 2xl:w-[36rem] landscape:h-screen landscape:overflow-y-auto p-4 sm:p-6 bg-white portrait:border-b landscape:border-r border-gray-200 flex flex-col">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
          Museum Guard Optimization
        </h1>

        {/* Introduction */}
        <section className="mb-2 sm:mb-4">
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            The Museum Guard Problem seeks to determine the minimum number of guards needed to monitor all rooms in a museum. 
            This tool solves the problem using different algorithms: <strong>Greedy</strong>, <strong>Genetic</strong>, and <strong>PSO</strong> (Particle Swarm Optimization).
          </p>
        </section>

        {/* Example Image - Hidden on mobile portrait for space */}
        <section className="mb-2 sm:mb-4 portrait:hidden landscape:flex justify-center">
          <div className="overflow-hidden">
            <Image
              src="/images/example.png"
              alt="Museum guard problem example"
              width={200} 
              height={120} 
            />
          </div>
        </section>

        {/* Instructions */}
        <section className="mb-2 sm:mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 sm:mb-2">Instructions</h3>
          <ul className="text-xs sm:text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Drag rooms to reposition them</li>
            <li>Drag the bottom-right corners to resize rooms</li>
            <li>Double-click a room to delete it</li>
            <li>Double-click an edge to delete a door</li>
          </ul>
        </section>

        {/* Door List */}
        <DoorList doors={doors} />
      </div>

      {/* Right Panel - Map View */}
      <div className="portrait:w-full portrait:h-[60vh] landscape:flex-1 landscape:h-screen p-3 sm:p-6 flex flex-col bg-gray-50">
        {/* Top Control Bar */}
        <div className="flex portrait:justify-center landscape:justify-end gap-1 sm:gap-2 mb-2 sm:mb-4 flex-wrap">
          <button
            onClick={handleRandomGraph}
            className="px-2 sm:px-3 py-1 sm:py-2 bg-purple-500 text-white text-xs sm:text-sm font-semibold rounded hover:bg-purple-600 transition-colors"
          >
            Random Graph
          </button>
          <button
            onClick={handleAddRoom}
            className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded hover:bg-blue-600 transition-colors"
          >
            Add Room
          </button>
          <button
            onClick={handleAddDoorFromButton}
            className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded hover:bg-blue-600 transition-colors"
          >
            Add Door
          </button>
          <select
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value as Algorithm)}
            className="px-2 sm:px-3 py-1 sm:py-2 pr-6 sm:pr-8 bg-white border border-gray-300 text-xs sm:text-sm font-semibold rounded hover:border-gray-400 transition-colors"
          >
            <option value="greedy">Greedy</option>
            <option value="genetic">Genetic</option>
            <option value="pso">PSO</option>
          </select>
          <button
            onClick={handleSolveOptimization}
            className="px-2 sm:px-3 py-1 sm:py-2 bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded hover:bg-emerald-600 transition-colors"
          >
            Solve
          </button>
          <button
            onClick={handleReset}
            className="px-2 sm:px-3 py-1 sm:py-2 bg-red-500 text-white text-xs sm:text-sm font-semibold rounded hover:bg-red-600 transition-colors"
          >
            Reset
          </button>
        </div>
        {solveResult && (
          <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-amber-50 border border-amber-300 rounded text-xs sm:text-sm text-gray-800 whitespace-pre-wrap">
            {solveResult.description}
          </div>
        )}
        <div className="flex-1 min-h-[300px] portrait:min-h-[400px]">
          <Map
            rooms={rooms}
            doors={doors}
            guardDoorIds={solveResult?.guardDoorIds ?? []}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            onDeleteDoor={handleDeleteDoor}
          />
        </div>
      </div>
    </div>
  );
}
