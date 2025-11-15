import React, { useState, useEffect } from 'react';
import './App.css';
import peopleData from './peopleData.json';

interface Person {
  id: number;
  name: string;
  ageGroup: AgeGroup;
  gender?: string;
  married?: string;
  relativeId?: number | null;
  sequence?: number;
}

type AgeGroup = 'child' | 'yong child' | 'yong adult' | 'adult' | 'senior' | 'infant';

interface DistributionConfig {
  selectedAgeGroups: AgeGroup[];
  numGroups: number;
  distributionLogic: 'balanced' | 'sequential';
  separateSpouses: boolean;
}

const App: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState<string>('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('child');
  const [distributedGroups, setDistributedGroups] = useState<Person[][]>([]);
  const [csvInput, setCsvInput] = useState<string>('');
  const [csvError, setCsvError] = useState<string>('');
  const [groupLayout, setGroupLayout] = useState<'grid' | 'stacked'>('grid');
  const [configExpanded, setConfigExpanded] = useState<boolean>(true);
  const [addPeopleExpanded, setAddPeopleExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'distribution' | 'battle'>('distribution');
  
  // Password Protection
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const correctPassword = '16112025';
  
  // Battle Mode States
  const [player1, setPlayer1] = useState<Person | null>(null);
  const [player2, setPlayer2] = useState<Person | null>(null);
  const [challenge, setChallenge] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [battleTeamSize, setBattleTeamSize] = useState<number>(1);
  const [battleAgeGroups, setBattleAgeGroups] = useState<AgeGroup[]>(['child', 'yong child', 'yong adult', 'adult', 'senior', 'infant']);
  const [team1, setTeam1] = useState<Person[]>([]);
  const [team2, setTeam2] = useState<Person[]>([]);
  
  const allChallenges = [
    'شد الحبل',
    'سباق',
    'سؤال رياضيات',
    'سؤال معلومات عامة'
  ];
  
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([...allChallenges]);
  
  // Distribution Configuration
  const [config, setConfig] = useState<DistributionConfig>({
    selectedAgeGroups: ['child', 'yong child', 'yong adult', 'adult', 'senior', 'infant'],
    numGroups: 2,
    distributionLogic: 'balanced',
    separateSpouses: false
  });

  const ageGroups: AgeGroup[] = ['child', 'yong child', 'yong adult', 'adult', 'senior', 'infant'];

  // Load people from JSON on component mount
  useEffect(() => {
    console.log('useEffect: Loading people data');
    const loadedPeople: Person[] = peopleData.map((person: any) => ({
      id: person.sequence,
      name: person.name,
      ageGroup: person.ageGroup as AgeGroup,
      gender: person.gender,
      married: person.married,
      relativeId: person.relativeId,
      sequence: person.sequence
    }));
    console.log('useEffect: Loaded people count:', loadedPeople.length);
    const uniqueIds = new Set(loadedPeople.map(p => p.id));
    console.log('useEffect: Unique IDs:', uniqueIds.size);
    if (uniqueIds.size !== loadedPeople.length) {
      console.error('WARNING: Duplicate IDs found in loaded data!');
    }
    setPeople(loadedPeople);
  }, []);

  const addPerson = (): void => {
    if (name.trim()) {
      setPeople([...people, { id: Date.now(), name: name.trim(), ageGroup }]);
      setName('');
    }
  };

  const removePerson = (id: number): void => {
    setPeople(people.filter(person => person.id !== id));
  };

  const findSpouse = (person: Person, allPeople: Person[]): Person | null => {
    // If person is married and is adult/senior
    if (person.married?.toLowerCase() !== 'y') return null;
    if (person.ageGroup !== 'adult' && person.ageGroup !== 'senior') return null;

    // Find spouse: someone with the same relativeId or whose relativeId points to this person
    const spouse = allPeople.find(p => {
      if (p.id === person.id) return false; // Not self
      if (p.married?.toLowerCase() !== 'y') return false; // Must be married
      if (p.ageGroup !== 'adult' && p.ageGroup !== 'senior') return false; // Must be adult/senior
      
      // Check if they are linked by relativeId
      const sameFamily = (
        (person.relativeId === p.sequence) || 
        (p.relativeId === person.sequence) ||
        (person.relativeId && p.relativeId && person.relativeId === p.relativeId)
      );
      
      // Must be opposite gender
      const oppositeGender = person.gender !== p.gender;
      
      return sameFamily && oppositeGender;
    });

    return spouse || null;
  };

  const distributeGroups = (): void => {
    const { selectedAgeGroups, numGroups, separateSpouses } = config;
    
    if (numGroups < 1) return;

    // Filter people by selected age groups
    const filteredPeople = people.filter(person => 
      selectedAgeGroups.includes(person.ageGroup)
    );

    if (filteredPeople.length === 0) return;

    // Initialize groups with empty arrays
    const groups: Person[][] = Array.from({ length: numGroups }, () => []);
    
    // Track which people have been assigned
    const assigned = new Set<number>();
    
    console.log('=== Distribution Started ===');
    console.log('Total people:', people.length);
    console.log('Unique people IDs:', new Set(people.map(p => p.id)).size);
    console.log('Filtered people:', filteredPeople.length);
    console.log('Selected age groups:', selectedAgeGroups);
    console.log('Unique selected age groups:', new Set(selectedAgeGroups).size);
    
    // Separate people by age group
    const byAgeGroup: Record<AgeGroup, Person[]> = {
      child: [],
      'yong child': [],
      'yong adult': [],
      adult: [],
      senior: [],
      infant: []
    };
    
    filteredPeople.forEach((person: Person) => {
      byAgeGroup[person.ageGroup].push(person);
    });
    
    console.log('byAgeGroup sizes:', Object.entries(byAgeGroup).map(([ag, arr]) => `${ag}: ${arr.length}`).join(', '));
    console.log('Total in byAgeGroup:', Object.values(byAgeGroup).flat().length);

    // If separating spouses, handle married adults/seniors first
    if (separateSpouses && numGroups >= 2) {
      const marriedAdults = [...byAgeGroup.adult, ...byAgeGroup.senior].filter(p => 
        p.married?.toLowerCase() === 'y'
      );

      marriedAdults.forEach(person => {
        if (assigned.has(person.id)) return;

        const spouse = findSpouse(person, filteredPeople);
        
        if (spouse && !assigned.has(spouse.id)) {
          // Find group with least people of this age type
          let minGroupIndex = 0;
          let minCount = groups[0].filter(p => p.ageGroup === person.ageGroup).length;
          
          for (let i = 1; i < groups.length; i++) {
            const count = groups[i].filter(p => p.ageGroup === person.ageGroup).length;
            if (count < minCount) {
              minCount = count;
              minGroupIndex = i;
            }
          }
          
          // Assign person to group with least of their age type
          groups[minGroupIndex].push(person);
          assigned.add(person.id);
          
          // Assign spouse to a different group with least of their age type
          const spouseGroupOptions = groups
            .map((g, idx) => ({ idx, count: g.filter(p => p.ageGroup === spouse.ageGroup).length }))
            .filter(g => g.idx !== minGroupIndex) // Different group
            .sort((a, b) => a.count - b.count);
          
          if (spouseGroupOptions.length > 0) {
            groups[spouseGroupOptions[0].idx].push(spouse);
            assigned.add(spouse.id);
          }
        }
      });
    }

    // Balanced distribution logic for remaining people:
    selectedAgeGroups.forEach(ag => {
      const peopleInAgeGroup = byAgeGroup[ag].filter(p => !assigned.has(p.id));
      
      peopleInAgeGroup.forEach((person) => {
        // Find the group with the least people of this age type
        let minGroupIndex = 0;
        let minCount = groups[0].filter(p => p.ageGroup === ag).length;
        
        for (let i = 1; i < groups.length; i++) {
          const count = groups[i].filter(p => p.ageGroup === ag).length;
          if (count < minCount) {
            minCount = count;
            minGroupIndex = i;
          }
        }
        
        groups[minGroupIndex].push(person);
        assigned.add(person.id);
      });
    });
    
    console.log('=== Distribution Complete ===');
    console.log('Total assigned:', assigned.size);
    console.log('Group sizes:', groups.map(g => g.length));
    const allDistributed = groups.flat();
    console.log('Total in groups:', allDistributed.length);
    const uniqueIdsInGroups = new Set(allDistributed.map(p => p.id));
    console.log('Unique in groups:', uniqueIdsInGroups.size);
    
    // Check for duplicates
    if (uniqueIdsInGroups.size !== allDistributed.length) {
      console.error('⚠️ DUPLICATES DETECTED!');
      const idCounts: Record<number, number> = {};
      allDistributed.forEach(p => {
        idCounts[p.id] = (idCounts[p.id] || 0) + 1;
      });
      Object.entries(idCounts).forEach(([id, count]) => {
        if (count > 1) {
          const person = people.find(p => p.id === parseInt(id));
          console.error(`  ID ${id} (${person?.name}) appears ${count} times`);
        }
      });
    } else {
      console.log('✅ No duplicates - each person appears exactly once');
    }

    // Sort each group by age priority: seniors -> adults -> yong adults -> children -> yong children -> infants
    const agePriority: Record<AgeGroup, number> = {
      'senior': 1,
      'adult': 2,
      'yong adult': 3,
      'child': 4,
      'yong child': 5,
      'infant': 6
    };

    groups.forEach(group => {
      group.sort((a, b) => agePriority[a.ageGroup] - agePriority[b.ageGroup]);
    });

    setDistributedGroups(groups);
  };

  const clearAll = (): void => {
    setPeople([]);
    setDistributedGroups([]);
  };

  const randomizeBattle = (): void => {
    // Filter people by selected age groups
    const filteredPeople = people.filter(p => battleAgeGroups.includes(p.ageGroup));
    
    if (filteredPeople.length < battleTeamSize * 2) return;
    
    // Reset everything first to restart animation
    setPlayer1(null);
    setPlayer2(null);
    setTeam1([]);
    setTeam2([]);
    setChallenge('');
    setIsAnimating(true);
    
    // Random selection
    const shuffled = [...filteredPeople].sort(() => Math.random() - 0.5);
    const selectedTeam1 = shuffled.slice(0, battleTeamSize);
    const selectedTeam2 = shuffled.slice(battleTeamSize, battleTeamSize * 2);
    const randomChallenge = selectedChallenges[Math.floor(Math.random() * selectedChallenges.length)];
    
    // For backward compatibility, set player1 and player2 for single-player mode
    if (battleTeamSize === 1) {
      setTimeout(() => {
        setPlayer1(selectedTeam1[0]);
      }, 300);
      
      setTimeout(() => {
        setPlayer2(selectedTeam2[0]);
      }, 600);
    } else {
      // Team mode
      setTimeout(() => {
        setTeam1(selectedTeam1);
      }, 300);
      
      setTimeout(() => {
        setTeam2(selectedTeam2);
      }, 600);
    }
    
    setTimeout(() => {
      setChallenge(randomChallenge);
      setIsAnimating(false);
    }, 1200);
  };

  const toggleBattleAgeGroup = (ag: AgeGroup): void => {
    const isSelected = battleAgeGroups.includes(ag);
    if (isSelected) {
      if (battleAgeGroups.length === 1) return; // Keep at least one
      setBattleAgeGroups(battleAgeGroups.filter(group => group !== ag));
    } else {
      setBattleAgeGroups([...battleAgeGroups, ag]);
    }
  };

  const toggleChallenge = (challengeName: string): void => {
    const isSelected = selectedChallenges.includes(challengeName);
    if (isSelected) {
      if (selectedChallenges.length === 1) return; // Keep at least one
      setSelectedChallenges(selectedChallenges.filter(c => c !== challengeName));
    } else {
      setSelectedChallenges([...selectedChallenges, challengeName]);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPasswordInput('');
    }
  };

  const loadDefaultData = (): void => {
    const loadedPeople: Person[] = peopleData.map((person: any) => ({
      id: person.sequence,
      name: person.name,
      ageGroup: person.ageGroup as AgeGroup,
      gender: person.gender,
      married: person.married,
      relativeId: person.relativeId,
      sequence: person.sequence
    }));
    setPeople(loadedPeople);
    setDistributedGroups([]);
  };

  const isValidAgeGroup = (value: string): value is AgeGroup => {
    const normalizedValue = value.toLowerCase();
    return ageGroups.includes(normalizedValue as AgeGroup);
  };

  const importFromCSV = (): void => {
    setCsvError('');
    if (!csvInput.trim()) {
      setCsvError('Please enter CSV data');
      return;
    }

    try {
      const lines = csvInput.trim().split('\n');
      const newPeople: Person[] = [];
      const errors: string[] = [];

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return; // Skip empty lines

        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length !== 2) {
          errors.push(`Line ${index + 1}: Expected format "Name,AgeGroup"`);
          return;
        }

        const [personName, personAgeGroup] = parts;

        if (!personName) {
          errors.push(`Line ${index + 1}: Name is required`);
          return;
        }

        if (!isValidAgeGroup(personAgeGroup)) {
          errors.push(`Line ${index + 1}: Invalid age group "${personAgeGroup}". Valid options: ${ageGroups.map(capitalizeAgeGroup).join(', ')}`);
          return;
        }

        newPeople.push({
          id: Date.now() + index,
          name: personName,
          ageGroup: personAgeGroup.toLowerCase() as AgeGroup
        });
      });

      if (errors.length > 0) {
        setCsvError(errors.join('\n'));
        return;
      }

      if (newPeople.length === 0) {
        setCsvError('No valid people found in CSV');
        return;
      }

      setPeople([...people, ...newPeople]);
      setCsvInput('');
      setCsvError('');
    } catch (error) {
      setCsvError('Error parsing CSV. Please check the format.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      addPerson();
    }
  };

  const handleNumGroupsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setConfig({ ...config, numGroups: value });
  };

  const toggleAgeGroup = (ageGroup: AgeGroup): void => {
    const isSelected = config.selectedAgeGroups.includes(ageGroup);
    if (isSelected) {
      // Don't allow deselecting all age groups
      if (config.selectedAgeGroups.length === 1) return;
      setConfig({
        ...config,
        selectedAgeGroups: config.selectedAgeGroups.filter(ag => ag !== ageGroup)
      });
    } else {
      setConfig({
        ...config,
        selectedAgeGroups: [...config.selectedAgeGroups, ageGroup]
      });
    }
  };

  const capitalizeAgeGroup = (ageGroup: string): string => {
    return ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1);
  };

  // Show password screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="container">
          <div className="password-screen">
            <h1>🔒 Group Distributor</h1>
            <p className="subtitle">Please enter the password to access the system</p>
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className="password-input"
                autoFocus
              />
              <button type="submit" className="btn btn-login">
                Login
              </button>
            </form>
            {passwordError && <div className="password-error">{passwordError}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <h1>Group Distributor</h1>
        <p className="subtitle">Evenly distribute people across groups</p>

        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'distribution' ? 'active' : ''}`}
            onClick={() => setActiveTab('distribution')}
          >
            Distribution Mode
          </button>
          <button 
            className={`tab-btn ${activeTab === 'battle' ? 'active' : ''}`}
            onClick={() => setActiveTab('battle')}
          >
            Battle Mode ⚔️
          </button>
        </div>

        {activeTab === 'distribution' && (
        <>
        <div className="input-section">
          <h2 
            onClick={() => setAddPeopleExpanded(!addPeopleExpanded)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            {addPeopleExpanded ? '▼' : '▶'} Add People
          </h2>
          {addPeopleExpanded && (
          <>
          <div className="input-group">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter name"
              className="name-input"
            />
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
              className="age-select"
            >
              {ageGroups.map(ag => (
                <option key={ag} value={ag}>{capitalizeAgeGroup(ag)}</option>
              ))}
            </select>
            <button onClick={addPerson} className="btn btn-add">Add</button>
          </div>

          <div className="csv-section">
            <h3>Or Import from CSV</h3>
            <p className="csv-hint">Format: Name,AgeGroup (one person per line)</p>
            <p className="csv-example">Example: John Doe,adult (or Adult)</p>
            <textarea
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="John Doe,Adult&#10;Jane Smith,Teen&#10;Bob Johnson,Senior"
              className="csv-input"
              rows={5}
            />
            {csvError && <div className="csv-error">{csvError}</div>}
            <button onClick={importFromCSV} className="btn btn-import">
              Import CSV
            </button>
          </div>

          {people.length > 0 && (
            <div className="people-list">
              <h3>People ({people.length})</h3>
              <div className="people-grid">
                {people.map(person => (
                  <div key={person.id} className="person-card">
                    <div className="person-info">
                      <span className="person-name">{person.name}</span>
                      <span className={`age-badge ${person.ageGroup}`}>
                        {capitalizeAgeGroup(person.ageGroup)}
                      </span>
                    </div>
                    <button
                      onClick={() => removePerson(person.id)}
                      className="btn-remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
          )}
        </div>

        {people.length > 0 && (
          <div className="distribute-section">
            <h2 
              onClick={() => setConfigExpanded(!configExpanded)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {configExpanded ? '▼' : '▶'} Distribution Configuration
            </h2>
            
            {configExpanded && (
            <>
            <div className="config-section">
              <h3>1. Select Age Groups to Include</h3>
              <div className="age-group-checkboxes">
                {ageGroups.map(ag => (
                  <label key={ag} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.selectedAgeGroups.includes(ag)}
                      onChange={() => toggleAgeGroup(ag)}
                    />
                    <span className={`age-badge ${ag}`}>
                      {capitalizeAgeGroup(ag)}
                    </span>
                    <span className="count">
                      ({people.filter(p => p.ageGroup === ag).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="config-section">
              <h3>2. Number of Groups</h3>
              <div className="distribute-controls">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={config.numGroups}
                  onChange={handleNumGroupsChange}
                  className="num-input-large"
                />
                <span className="info-text">
                  Selected: {people.filter(p => config.selectedAgeGroups.includes(p.ageGroup)).length} people
                </span>
              </div>
            </div>

            <div className="config-section">
              <h3>3. Distribution Options</h3>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={config.separateSpouses}
                  onChange={(e) => setConfig({ ...config, separateSpouses: e.target.checked })}
                />
                <span className="option-text">
                  <strong>Separate Spouses / توزيع الأزواج في مجموعات مختلفة</strong>
                  <span className="option-description">
                    Married adults will be placed in different groups
                  </span>
                </span>
              </label>
            </div>

            <div className="config-section">
              <h3>4. Distribute</h3>
              <div className="distribute-controls">
                <button onClick={distributeGroups} className="btn btn-distribute">
                  Distribute into Groups
                </button>
                <button onClick={loadDefaultData} className="btn btn-load">
                  Load Default Data
                </button>
                <button onClick={clearAll} className="btn btn-clear">
                  Clear All
                </button>
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {distributedGroups.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h2>Distributed Groups</h2>
              <div className="layout-toggle">
                <button
                  className={`layout-btn ${groupLayout === 'grid' ? 'active' : ''}`}
                  onClick={() => setGroupLayout('grid')}
                  title="Grid Layout"
                >
                  <span>⊞</span> Grid
                </button>
                <button
                  className={`layout-btn ${groupLayout === 'stacked' ? 'active' : ''}`}
                  onClick={() => setGroupLayout('stacked')}
                  title="Stacked Layout"
                >
                  <span>☰</span> Stacked
                </button>
              </div>
            </div>
            <div className={`groups-container ${groupLayout === 'stacked' ? 'stacked' : 'grid'}`}>
              {distributedGroups.map((group, index) => {
                // Calculate stats for this group
                const stats = config.selectedAgeGroups.map(ag => ({
                  ageGroup: ag,
                  count: group.filter(p => p.ageGroup === ag).length
                }));

                return (
                  <div key={index} className="group-card">
                    <h3>Group {index + 1}</h3>
                    <p className="group-count">{group.length} people</p>
                    
                    <div className="group-stats">
                      {stats.map(stat => (
                        stat.count > 0 && (
                          <div key={stat.ageGroup} className="stat-item">
                            <span className={`age-badge ${stat.ageGroup}`}>
                              {capitalizeAgeGroup(stat.ageGroup)}
                            </span>
                            <span className="stat-count">×{stat.count}</span>
                          </div>
                        )
                      ))}
                    </div>

                    <div className="group-members">
                      {group.map(person => (
                        <div key={person.id} className="member">
                          <span className="member-name">{person.name}</span>
                          <span className={`age-badge ${person.ageGroup}`}>
                            {capitalizeAgeGroup(person.ageGroup)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </>
        )}

        {activeTab === 'battle' && (
          <div className="battle-mode">
            <div className="battle-config">
              <div className="config-row">
                <div className="config-item">
                  <label>Team Size:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={battleTeamSize}
                    onChange={(e) => setBattleTeamSize(parseInt(e.target.value) || 1)}
                    className="team-size-input"
                  />
                  <span className="config-hint">members per team</span>
                </div>
              </div>

              <div className="config-row">
                <label className="config-label">Select Age Groups:</label>
                <div className="age-group-checkboxes">
                  {ageGroups.map(ag => (
                    <label key={ag} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={battleAgeGroups.includes(ag)}
                        onChange={() => toggleBattleAgeGroup(ag)}
                      />
                      <span className={`age-badge ${ag}`}>
                        {capitalizeAgeGroup(ag)}
                      </span>
                      <span className="count">
                        ({people.filter(p => p.ageGroup === ag).length})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="config-row">
                <label className="config-label">Select Challenges:</label>
                <div className="challenges-checkboxes">
                  {allChallenges.map(ch => (
                    <label key={ch} className="challenge-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedChallenges.includes(ch)}
                        onChange={() => toggleChallenge(ch)}
                      />
                      <span className="challenge-text">{ch}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="battle-controls">
              <button 
                onClick={randomizeBattle} 
                className="btn btn-randomize"
                disabled={
                  people.filter(p => battleAgeGroups.includes(p.ageGroup)).length < battleTeamSize * 2 || 
                  isAnimating || 
                  selectedChallenges.length === 0
                }
              >
                🎲 Randomize Battle
              </button>
            </div>

            {(player1 || player2 || team1.length > 0 || team2.length > 0 || challenge) && (
              <div className="battle-arena">
                <div className="battle-row">
                  <div className={`battle-team ${player1 || team1.length > 0 ? 'show' : ''}`}>
                    {player1 ? (
                      <>
                        <div className="player-name">{player1.name}</div>
                        <div className={`age-badge ${player1.ageGroup}`}>
                          {capitalizeAgeGroup(player1.ageGroup)}
                        </div>
                      </>
                    ) : (
                      <div className="team-members">
                        <div className="team-label">Team 1</div>
                        {team1.map((member, idx) => (
                          <div key={member.id} className="team-member">
                            <span className="member-name">{member.name}</span>
                            <span className={`age-badge ${member.ageGroup}`}>
                              {capitalizeAgeGroup(member.ageGroup)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={`battle-vs ${challenge ? 'show' : ''}`}>
                    VS
                  </div>

                  <div className={`battle-team ${player2 || team2.length > 0 ? 'show' : ''}`}>
                    {player2 ? (
                      <>
                        <div className="player-name">{player2.name}</div>
                        <div className={`age-badge ${player2.ageGroup}`}>
                          {capitalizeAgeGroup(player2.ageGroup)}
                        </div>
                      </>
                    ) : (
                      <div className="team-members">
                        <div className="team-label">Team 2</div>
                        {team2.map((member, idx) => (
                          <div key={member.id} className="team-member">
                            <span className="member-name">{member.name}</span>
                            <span className={`age-badge ${member.ageGroup}`}>
                              {capitalizeAgeGroup(member.ageGroup)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {challenge && (
                  <div className="battle-challenge">
                    <div className="challenge-label">التحدي</div>
                    <div className="challenge-name">{challenge}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
