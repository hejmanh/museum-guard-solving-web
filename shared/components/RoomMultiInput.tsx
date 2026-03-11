'use client';

import { useState, useRef, useCallback, RefObject } from 'react';
import type { Room } from '@/shared/types';

interface RoomMultiInputProps {
  rooms: Room[];
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  id?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  onEnterWithNoSuggestions?: () => void;
}

export default function RoomMultiInput({ rooms, value, onChange, autoFocus, id, inputRef: externalRef, onEnterWithNoSuggestions }: RoomMultiInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;

  const tokens = value.split(',');
  const partial = tokens[tokens.length - 1].trim();
  const committed = tokens.slice(0, -1).map((t) => t.trim()).filter(Boolean);

  const suggestions = partial
    ? rooms
        .map((r) => String(r.id))
        .filter((rid) => rid.startsWith(partial) && !committed.includes(rid))
        .slice(0, 20)
    : [];

  const commitSuggestion = useCallback(
    (roomId: string, trailingComma = true) => {
      const prev = tokens.slice(0, -1).map((t) => t.trim()).filter(Boolean);
      const next = trailingComma
        ? [...prev, roomId, ''].join(', ')
        : [...prev, roomId].join(', ');
      onChange(next);
      setShowSuggestions(false);
      setHighlightIndex(0);
    },
    // tokens changes every render so list it explicitly
    [tokens, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const hasSuggestions = showSuggestions && suggestions.length > 0;

    if (e.key === 'ArrowDown') {
      if (!hasSuggestions) return;
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      if (!hasSuggestions) return;
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (!hasSuggestions) {
        if (onEnterWithNoSuggestions) {
          e.preventDefault();
          onEnterWithNoSuggestions();
        }
        return;
      }
      e.preventDefault();
      commitSuggestion(suggestions[highlightIndex], true);
    } else if (e.key === 'Tab') {
      if (!hasSuggestions) return;
      // Select top suggestion but allow Tab to move focus naturally
      commitSuggestion(suggestions[highlightIndex], false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
    setHighlightIndex(0);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onFocus={() => { if (partial.length > 0) setShowSuggestions(true); }}
        placeholder="e.g. 1, 5, 12"
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map((roomId, idx) => (
            <li
              key={roomId}
              className={`px-3 py-1 cursor-pointer text-sm ${
                idx === highlightIndex ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'
              }`}
              onMouseDown={() => { commitSuggestion(roomId, true); inputRef.current?.focus(); }}
            >
              Room {roomId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
