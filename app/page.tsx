'use client';

import Image from "next/image";
import { useState } from "react";
import Map from "@/shared/components/Map";
import DoorList from "@/shared/components/DoorList";
import { Room, Door, Algorithm } from "@/shared/types";

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: 1, x: 100, y: 100, width: 70, height: 70 },
    { id: 2, x: 250, y: 150, width: 70, height: 70 },
  ]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [nextRoomId, setNextRoomId] = useState(3);
  const [nextDoorId, setNextDoorId] = useState(1);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('greedy');

  const handleAddRoom = () => {
    // Find the lowest available ID
    const existingIds = rooms.map(room => room.id).sort((a, b) => a - b);
    let newId = 1;
    for (const id of existingIds) {
      if (newId < id) break;
      newId = id + 1;
    }

    const newRoom: Room = {
      id: newId,
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 200,
      width: 70,
      height: 70,
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
    setRooms(rooms.filter((room) => room.id !== id));
    // Also delete doors connected to this room
    setDoors(doors.filter((door) => door.room1Id !== id && door.room2Id !== id));
  };

  const handleDeleteDoor = (id: number) => {
    setDoors(doors.filter((door) => door.id !== id));
  };

  const handleReset = () => {
    setRooms([
      { id: 1, x: 100, y: 100, width: 80, height: 80 },
      { id: 2, x: 250, y: 150, width: 80, height: 80 },
    ]);
    setDoors([]);
    setNextRoomId(3);
    setNextDoorId(1);
    setSelectedAlgorithm('greedy');
  };

  const handleSolveOptimization = () => {
    // Placeholder for optimization logic
    alert(`chua lam hihi`);
  };

  return (
    <div className="flex h-screen w-screen bg-linear-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Left Panel */}
      <div className="w-[28rem] p-6 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Museum Guard Optimization
        </h1>

        {/* Introduction */}
        <section className="mb-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            The Museum Guard Problem seeks to determine the minimum number of guards needed to monitor all rooms in a museum. 
            This tool solves the problem using different algorithms: <strong>Greedy</strong>, <strong>Genetic</strong>, and <strong>PSO</strong> (Particle Swarm Optimization).
          </p>
        </section>

        {/* Example Image */}
        <section className="mb-4 flex justify-center">
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
        <section className="mb-4">
          <h3 className="text-base font-semibold text-gray-800 mb-2">Instructions</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Drag rooms to reposition them</li>
            <li>Drag the bottom right corner handle to resize rooms</li>
            <li>Double-click a room to delete it</li>
            <li>Double-click an edge to delete a door</li>
          </ul>
        </section>

        {/* Door List */}
        <DoorList doors={doors} />

        {/* Control Buttons */}
        <section className="mt-4">
          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value as Algorithm)}
              className="px-3 py-2 pr-8 bg-white border border-gray-300 text-sm font-semibold rounded hover:border-gray-400 transition-colors"
            >
              <option value="greedy">Greedy</option>
              <option value="genetic">Genetic</option>
              <option value="pso">PSO</option>
            </select>
            <button
              onClick={handleSolveOptimization}
              className="px-3 py-2 bg-emerald-500 text-white text-sm font-semibold rounded hover:bg-emerald-600 transition-colors"
            >
              Solve Optimization
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded hover:bg-red-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </section>
      </div>

      {/* Right Panel - Map View */}
      <div className="flex-1 p-6 flex flex-col">
        {/* Top Control Bar */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={handleAddRoom}
            className="px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded hover:bg-blue-600 transition-colors"
          >
            Add Room
          </button>
          <button
            onClick={handleAddDoorFromButton}
            className="px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded hover:bg-blue-600 transition-colors"
          >
            Add Door
          </button>
        </div>
        <div className="flex-1">
          <Map
            rooms={rooms}
            doors={doors}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            onDeleteDoor={handleDeleteDoor}
          />
        </div>
      </div>
    </div>
  );
}
