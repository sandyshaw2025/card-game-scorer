import React, { useState, useEffect } from 'react';
import { Plus, Minus, Users, Moon, Sun, History, Download, Undo, BarChart3, Settings } from 'lucide-react';

export default function App() {
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentRoundScores, setCurrentRoundScores] = useState({});
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [gameTemplate, setGameTemplate] = useState('custom');
  const [gameHistory, setGameHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [gameName, setGameName] = useState('');
  const [showGameSettings, setShowGameSettings] = useState(false);

  // Game templates
  const gameTemplates = {
    custom: { name: 'Custom Game', description: 'Track any scores' },
    hearts: { name: 'Hearts', description: 'Lowest score wins' },
    spades: { name: 'Spades', description: 'Highest score wins' },
    rummy: { name: 'Rummy', description: 'First to reach target wins' }
  };

  // Load data from localStorage on startup
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('cardScorer_darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }

    const savedHistory = localStorage.getItem('cardScorer_gameHistory');
    if (savedHistory) {
      setGameHistory(JSON.parse(savedHistory));
    }

    const lastGame = localStorage.getItem('cardScorer_currentGame');
    if (lastGame) {
      const game = JSON.parse(lastGame);
      setPlayers(game.players || []);
      setRounds(game.rounds || []);
      setCurrentRoundScores(game.currentRoundScores || {});
      setGameTemplate(game.gameTemplate || 'custom');
      setGameName(game.gameName || '');
    }
  }, []);

  // Auto-save current game
  useEffect(() => {
    const currentGame = {
      players,
      rounds,
      currentRoundScores,
      gameTemplate,
      gameName,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('cardScorer_currentGame', JSON.stringify(currentGame));
  }, [players, rounds, currentRoundScores, gameTemplate, gameName]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('cardScorer_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

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
      scores: {...currentRoundScores},
      timestamp: new Date().toISOString()
    };
    
    setRounds([...rounds, newRound]);
    setCurrentRoundScores(Object.keys(currentRoundScores).reduce((acc, playerId) => {
      acc[playerId] = 0;
      return acc;
    }, {}));
  };

  const undoLastRound = () => {
    if (rounds.length === 0) return;
    
    const lastRound = rounds[rounds.length - 1];
    setCurrentRoundScores(lastRound.scores);
    setRounds(rounds.slice(0, -1));
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

  const saveGameToHistory = () => {
    if (rounds.length === 0) return;

    const gameData = {
      id: Date.now(),
      name: gameName || `${gameTemplates[gameTemplate].name} Game`,
      template: gameTemplate,
      players: players,
      rounds: rounds,
      finalScores: players.map(player => ({
        playerId: player.id,
        initials: player.initials,
        score: getCumulativeScore(player.id, rounds.length - 1)
      })),
      completedAt: new Date().toISOString(),
      roundCount: rounds.length
    };

    const newHistory = [gameData, ...gameHistory.slice(0, 19)];
    setGameHistory(newHistory);
    localStorage.setItem('cardScorer_gameHistory', JSON.stringify(newHistory));
  };

  const resetAll = () => {
    if (rounds.length > 0) {
      saveGameToHistory();
    }
    setPlayers([]);
    setRounds([]);
    setCurrentRoundScores({});
    setGameName('');
    setGameTemplate('custom');
  };

  const exportScores = () => {
    if (rounds.length === 0) return;

    let exportText = `${gameName || gameTemplates[gameTemplate].name} - ${new Date().toLocaleDateString()}\n`;
    exportText += '='.repeat(30) + '\n\n';

    exportText += 'Round  ' + players.map(p => p.initials).join('  ') + '\n';
    rounds.forEach(round => {
      exportText += `${round.roundNumber}      ${players.map(p => (round.scores[p.id] || 0).toString().padEnd(3)).join(' ')}\n`;
    });

    exportText += '\nFinal Scores:\n';
    players.forEach(player => {
      const finalScore = getCumulativeScore(player.id, rounds.length - 1);
      exportText += `${player.initials}: ${finalScore}\n`;
    });

    const element = document.createElement('a');
    const file = new Blob([exportText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${gameName || 'card-game'}-scores.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const loadGame = (gameData) => {
    setPlayers(gameData.players);
    setRounds(gameData.rounds);
    setGameTemplate(gameData.template);
    setGameName(gameData.name);
    setCurrentRoundScores(gameData.players.reduce((acc, player) => {
      acc[player.id] = 0;
      return acc;
    }, {}));
    setShowHistory(false);
  };

  const getPlayerStats = () => {
    const stats = {};
    
    gameHistory.forEach(game => {
      game.finalScores.forEach(playerScore => {
        if (!stats[playerScore.initials]) {
          stats[playerScore.initials] = {
            gamesPlayed: 0,
            totalScore: 0,
            wins: 0
          };
        }
        
        stats[playerScore.initials].gamesPlayed++;
        stats[playerScore.initials].totalScore += playerScore.score;
        
        const gameScores = game.finalScores.map(fs => fs.score);
        const isWin = game.template === 'hearts' 
          ? playerScore.score === Math.min(...gameScores)
          : playerScore.score === Math.max(...gameScores);
        
        if (isWin) {
          stats[playerScore.initials].wins++;
        }
      });
    });

    Object.keys(stats).forEach(player => {
      stats[player].averageScore = (stats[player].totalScore / stats[player].gamesPlayed).toFixed(1);
      stats[player].winRate = ((stats[player].wins / stats[player].gamesPlayed) * 100).toFixed(1);
    });

    return stats;
  };

  const themeClasses = darkMode 
    ? 'min-h-screen bg-gray-900 text-white' 
    : 'min-h-screen bg-blue-50';

  const cardClasses = darkMode 
    ? 'bg-gray-800 text-white' 
    : 'bg-white';

  const inputClasses = darkMode 
    ? 'bg-gray-700 border-gray-600 text-white' 
    : 'bg-white border-gray-300';

  const tableClasses = darkMode 
    ? 'bg-gray-800 border-gray-600' 
    : 'bg-white border-gray-300';

  return (
    <div className={themeClasses}>
      <div className="max-w-md mx-auto p-4">
        <div className={`${cardClasses} rounded-lg shadow-lg p-4`}>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h1 className="text-lg font-bold">Card Scorer</h1>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowStats(true)}
                className="p-2 rounded-full"
                title="Statistics"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-full"
                title="History"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowGameSettings(true)}
                className="p-2 rounded-full"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Game Type */}
          <div className="mb-4">
            <select
              value={gameTemplate}
              onChange={(e) => setGameTemplate(e.target.value)}
              className={`w-full px-3 py-2 border rounded text-sm ${inputClasses}`}
            >
              {Object.entries(gameTemplates).map(([key, template]) => (
                <option key={key} value={key}>{template.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{gameTemplates[gameTemplate].description}</p>
          </div>

          {/* Players */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Players ({players.length}/6)</h2>
              {players.length < 6 && (
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-xs"
                >
                  <Plus className="w-3 h-3" />
                  Add
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
                  className={`flex-1 px-2 py-1 border rounded text-sm ${inputClasses}`}
                  maxLength={3}
                  onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                  autoFocus
                />
                <button
                  onClick={addPlayer}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => {setShowAddPlayer(false); setNewPlayerName('');}}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded-full text-sm">
                  <span className="font-medium text-indigo-800 dark:text-indigo-200">{player.initials}</span>
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
              {/* Current Round */}
              <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Round {rounds.length + 1}</h3>
                  {rounds.length > 0 && (
                    <button
                      onClick={undoLastRound}
                      className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                    >
                      <Undo className="w-3 h-3" />
                      Undo
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {players.map(player => (
                    <div key={player.id} className="flex flex-col items-center">
                      <label className="text-xs font-medium mb-1">{player.initials}</label>
                      <input
                        type="number"
                        value={currentRoundScores[player.id] || ''}
                        onChange={(e) => updateCurrentScore(player.id, e.target.value)}
                        className={`w-full h-10 px-2 text-center border rounded ${inputClasses}`}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={addRound}
                    className="flex-1 py-2 bg-indigo-500 text-white rounded font-medium"
                  >
                    Add Round
                  </button>
                  {rounds.length > 0 && (
                    <button
                      onClick={exportScores}
                      className="px-3 py-2 bg-blue-500 text-white rounded"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Score Table */}
              {rounds.length > 0 && (
                <div className="overflow-x-auto mb-4">
                  <table className={`w-full border-collapse text-xs ${tableClasses}`}>
                    <thead>
                      <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                        <th className={`border px-1 py-1 text-left ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>Rd</th>
                        {players.map(player => (
                          <th key={player.id} className={`border px-1 py-1 text-center ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                            {player.initials}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rounds.map((round, roundIndex) => (
                        <tr key={round.id}>
                          <td className={`border px-1 py-1 font-medium ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                            {round.roundNumber}
                          </td>
                          {players.map(player => (
                            <td key={player.id} className={`border px-1 py-1 text-center ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                              <div>
                                <div className="font-medium">{round.scores[player.id] || 0}</div>
                                <div className="text-gray-500">({getCumulativeScore(player.id, roundIndex)})</div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                      
                      {/* Totals */}
                      <tr className={`font-bold ${darkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                        <td className={`border px-1 py-1 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>Total</td>
                        {players.map(player => {
                          const finalScore = getCumulativeScore(player.id, rounds.length - 1);
                          const { highest, lowest } = getHighestLowestScores();
                          let colorClass = '';
                          
                          if (gameTemplate === 'hearts') {
                            if (finalScore === lowest && finalScore !== highest) {
                              colorClass = 'text-green-600 bg-green-100';
                            } else if (finalScore === highest && finalScore !== lowest) {
                              colorClass = 'text-red-600 bg-red-100';
                            }
                          } else {
                            if (finalScore === highest && finalScore !== lowest) {
                              colorClass = 'text-green-600 bg-green-100';
                            } else if (finalScore === lowest && finalScore !== highest) {
                              colorClass = 'text-red-600 bg-red-100';
                            }
                          }
                          
                          return (
                            <td key={player.id} className={`border px-1 py-1 text-center font-bold ${darkMode ? 'border-gray-600' : 'border-gray-300'} ${colorClass}`}>
                              {finalScore}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={resetGame}
                  className="flex-1 py-2 bg-green-500 text-white rounded"
                >
                  Reset Rounds
                </button>
                <button
                  onClick={resetAll}
                  className="flex-1 py-2 bg-red-500 text-white rounded"
                >
                  New Game
                </button>
              </div>
            </>
          )}

          {players.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-600 mb-1">No Players</h3>
              <p className="text-gray-500 text-sm">Add players to start</p>
            </div>
          )}
        </div>

        {/* Game Settings Modal */}
        {showGameSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${cardClasses} rounded-lg p-4 w-full max-w-sm`}>
              <h3 className="text-lg font-bold mb-4">Game Settings</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Game Name</label>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Enter game name..."
                  className={`w-full px-3 py-2 border rounded ${inputClasses}`}
                />
              </div>
              <button
                onClick={() => setShowGameSettings(false)}
                className="w-full py-2 bg-gray-500 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${cardClasses} rounded-lg p-4 w-full max-w-sm max-h-96 overflow-y-auto`}>
              <h3 className="text-lg font-bold mb-4">Game History</h3>
              {gameHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No games yet</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {gameHistory.map(game => (
                    <div key={game.id} className={`p-2 border rounded ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="font-medium text-sm">{game.name}</h4>
                          <p className="text-xs text-gray-500">
                            {new Date(game.completedAt).toLocaleDateString()} • {game.roundCount} rounds
                          </p>
                        </div>
                        <button
                          onClick={() => loadGame(game)}
                          className="px-2 py-1 bg-indigo-500 text-white rounded text-xs"
                        >
                          Load
                        </button>
                      </div>
                      <div className="text-xs">
                        {game.finalScores.slice(0, 3).map(score => (
                          <span key={score.playerId} className="mr-2">{score.initials}: {score.score}</span>
                        ))}
                        {game.finalScores.length > 3 && <span>+{game.finalScores.length - 3} more</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowHistory(false)}
                className="w-full py-2 bg-gray-500 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Stats Modal */}
        {showStats && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${cardClasses} rounded-lg p-4 w-full max-w-sm max-h-96 overflow-y-auto`}>
              <h3 className="text-lg font-bold mb-4">Player Stats</h3>
              {gameHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No games completed</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {Object.entries(getPlayerStats()).map(([player, stats]) => (
                    <div key={player} className={`p-2 border rounded ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="font-medium">{player}</div>
                      <div className="text-xs text-gray-500">
                        Games: {stats.gamesPlayed} • Wins: {stats.wins} • Win Rate: {stats.winRate}% • Avg: {stats.averageScore}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowStats(false)}
                className="w-full py-2 bg-gray-500 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




