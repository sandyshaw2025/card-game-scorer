import React, { useState } from 'react';
import { Plus, Minus, Users } from 'lucide-react';

export default function App() {
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentRoundScores, setCurrentRoundScores] = useState({});
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < 6) {
      const newPlayer = {
        id: Date.now(),
        initials: newPlayerName.trim().toUpperCase()
      };
      setPlayers([...players, newPlayer]);
      setCurrentRoundScores({...currentRoundScores, [newPlayer.id]: 0});
      setNewPlayerName('');
      setShowAddPlayer(false);
    }
  };

  const removePlayer = (playerId) => {
    setPlayers(players.filter(p => p.id !== playerId));
    const newCurrentScores = {...currentRoundScores};
    delete newCurrentScores[playerId];
    setCurrentRoundScores(newCurrentScores);
    
    setRounds(rounds.map(round => {
      const newRoundScores = {...round.scores};
      delete newRoundScores[playerId];
      return {...round, scores: newRoundScores};
    }));
  };

  const updateCurrentScore = (playerId, score) => {
    setCurrentRoundScores({
      ...currentRoundScores,
      [playerId]: parseInt(score) || 0
    });
  };

  const addRound = () => {
    if (players.length === 0) return;
    
    const newRound = {
      id: Date.now(),
      roundNumber: rounds.length + 1,
      scores: {...currentRoundScores}
    };
    
    setRounds([...rounds, newRound]);
    setCurrentRoundScores(Object.keys(currentRoundScores).reduce((acc, playerId) => {
      acc[playerId] = 0;
      return acc;
    }, {}));
  };

  const getCumulativeScore = (playerId, upToRound) => {
    return rounds
      .slice(0, upToRound + 1)
      .reduce((total, round) => total + (round.scores[playerId] || 0), 0);
  };

  const resetGame = () => {
    setRounds([]);
    setCurrentRoundScores(Object.keys(currentRoundScores).reduce((acc, playerId) => {
      acc[playerId] = 0;
      return acc;
    }, {}));
  };

  const getHighestLowestScores = () => {
    if (rounds.length === 0) return { highest: null, lowest: null };
    
    const finalScores = players.map(player => ({
      id: player.id,
      score: getCumulativeScore(player.id, rounds.length - 1)
    }));
    
    const highest = Math.max(...finalScores.map(p => p.score));
    const lowest = Math.min(...finalScores.map(p => p.score));
    
    return { highest, lowest };
  };

  const resetAll = () => {
    setPlayers([]);
    setRounds([]);
    setCurrentRoundScores({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-800">Card Game Scorer</h1>
            </div>
            <button
              onClick={resetAll}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
            >
              Reset All
            </button>
          </div>

          {/* Player Management */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-base font-semibold text-gray-700">Players ({players.length}/6)</h2>
              {players.length < 6 && (
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs"
                >
                  <Plus className="w-3 h-3" />
                  Add Player
                </button>
              )}
            </div>

            {showAddPlayer && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Initials"
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm w-16"
                  maxLength={5}
                  onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                />
                <button
                  onClick={addPlayer}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => {setShowAddPlayer(false); setNewPlayerName('');}}
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1">
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-1 bg-indigo-100 px-2 py-1 rounded-full text-sm">
                  <span className="font-medium text-indigo-800">{player.initials}</span>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {players.length > 0 && (
            <>
              {/* Current Round Input */}
              <div className="mb-6 bg-gray-50 p-3 rounded-lg">
                <h3 className="text-base font-semibold text-gray-700 mb-2">
                  Round {rounds.length + 1} Score
                </h3> 
                <div className="flex flex-wrap gap-2 justify-center">
                  {players.map(player => (
                    <div key={player.id} className="flex flex-col items-center">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {player.initials}
                      </label>
                      <input
                        type="number"
                        value={currentRoundScores[player.id] || ''}
                        onChange={(e) => updateCurrentScore(player.id, e.target.value)}
                        className="w-10 h-8 px-1 py-1 text-center text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="0"
                        max="999"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-2 mt-3">
                  <button
                    onClick={addRound}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
                  >
                    Add Round
                  </button>
                  <button
                    onClick={resetGame}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    New Game
                  </button>
                </div>
              </div>

              {/* Score Table */}
              {rounds.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-white text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-1 py-1 text-left font-semibold text-xs w-8">Rd</th>
                        {players.map(player => (
                          <th key={player.id} className="border border-gray-300 px-1 py-1 text-center font-semibold text-xs min-w-12">
                            {player.initials}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rounds.map((round, roundIndex) => (
                        <tr key={round.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-1 py-1 font-medium text-xs w-8">
                            {round.roundNumber}
                          </td>
                          {players.map(player => (
                            <td key={player.id} className="border border-gray-300 px-1 py-1 text-center min-w-12">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {round.scores[player.id] || 0}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({getCumulativeScore(player.id, roundIndex)})
                                </span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                      {/* Totals Row */}
                      <tr className="bg-indigo-50 font-bold">
                        <td className="border border-gray-300 px-1 py-1 text-xs w-8">Total</td>
                        {players.map(player => {
                          const finalScore = getCumulativeScore(player.id, rounds.length - 1);
                          const { highest, lowest } = getHighestLowestScores();
                          let colorClass = '';
                          
                          if (finalScore === highest && finalScore !== lowest) {
                            colorClass = 'text-green-600 bg-green-50';
                          } else if (finalScore === lowest && finalScore !== highest) {
                            colorClass = 'text-red-600 bg-red-50';
                          }
                          
                          return (
                            <td key={player.id} className={`border border-gray-300 px-1 py-1 text-center font-bold min-w-12 ${colorClass}`}>
                              {finalScore}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {players.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">No Players Added</h3>
              <p className="text-gray-500">Add players to start tracking scores</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


