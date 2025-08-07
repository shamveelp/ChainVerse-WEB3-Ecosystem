'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { BugPlay, Play, RotateCcw } from 'lucide-react';

const GAME_DURATION = 30; // seconds
const GLITCH_APPEAR_INTERVAL = 800; // ms
const GLITCH_DURATION = 1000; // ms

interface Glitch {
  id: number;
  position: number;
  visible: boolean;
}

export default function CodeGlitchCatcher() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameActive, setGameActive] = useState(false);
  const [glitches, setGlitches] = useState<Glitch[]>([]);
  const [nextGlitchId, setNextGlitchId] = useState(0);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameActive(true);
    setGlitches([]);
    setNextGlitchId(0);
  }, []);

  const resetGame = useCallback(() => {
    setGameActive(false);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGlitches([]);
    setNextGlitchId(0);
  }, []);

  // Game timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameActive) {
      setGameActive(false);
    }
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);

  // Glitch spawning logic
  useEffect(() => {
    let glitchSpawner: NodeJS.Timeout;
    if (gameActive) {
      glitchSpawner = setInterval(() => {
        const newPosition = Math.floor(Math.random() * 9); // 9 possible positions
        const newGlitch: Glitch = {
          id: nextGlitchId,
          position: newPosition,
          visible: true,
        };
        setNextGlitchId((prev) => prev + 1);

        setGlitches((prev) => [...prev, newGlitch]);

        // Make glitch disappear after a short time
        setTimeout(() => {
          setGlitches((prev) =>
            prev.map((g) => (g.id === newGlitch.id ? { ...g, visible: false } : g))
          );
        }, GLITCH_DURATION);
      }, GLITCH_APPEAR_INTERVAL);
    }
    return () => clearInterval(glitchSpawner);
  }, [gameActive, nextGlitchId]);

  // Clean up invisible glitches
  useEffect(() => {
    const cleanupTimer = setInterval(() => {
      setGlitches((prev) => prev.filter((g) => g.visible));
    }, 500); // Clean up every 500ms
    return () => clearInterval(cleanupTimer);
  }, []);

  const handleGlitchClick = useCallback((id: number) => {
    if (!gameActive) return;

    setGlitches((prev) =>
      prev.map((g) => {
        if (g.id === id && g.visible) {
          setScore((s) => s + 1);
          return { ...g, visible: false }; // Make it disappear immediately
        }
        return g;
      })
    );
  }, [gameActive]);

  return (
    <div className="bg-gray-700 rounded-lg p-6 shadow-xl border border-gray-600">
      <h2 className="text-3xl font-bold text-white mb-4">Code Glitch Catcher</h2>
      <div className="flex justify-between items-center mb-6 text-lg font-semibold text-gray-200">
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>

      {!gameActive && timeLeft === GAME_DURATION && (
        <div className="flex flex-col items-center justify-center h-64">
          <BugPlay className="w-16 h-16 text-green-400 mb-4" />
          <p className="text-gray-300 mb-4">Click the glitches as they appear!</p>
          <Button onClick={startGame} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md">
            <Play className="w-5 h-5 mr-2" /> Start Game
          </Button>
        </div>
      )}

      {gameActive && (
        <div className="grid grid-cols-3 gap-4 h-64 relative overflow-hidden">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="relative w-full h-20 bg-gray-800 rounded-md flex items-center justify-center border border-gray-700"
            >
              {glitches
                .filter((g) => g.position === index && g.visible)
                .map((glitch) => (
                  <div
                    key={glitch.id}
                    className="absolute w-12 h-12 bg-purple-500 rounded-full cursor-pointer animate-pulse-fade-in"
                    onClick={() => handleGlitchClick(glitch.id)}
                    style={{ animationDuration: `${GLITCH_DURATION}ms` }}
                  ></div>
                ))}
            </div>
          ))}
        </div>
      )}

      {!gameActive && timeLeft === 0 && (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-2xl font-bold text-white mb-2">Game Over!</p>
          <p className="text-xl text-gray-300 mb-4">Your Score: {score}</p>
          <Button onClick={resetGame} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md">
            <RotateCcw className="w-5 h-5 mr-2" /> Play Again
          </Button>
        </div>
      )}
    </div>
  );
}
