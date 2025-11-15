// Test script to simulate the distribution logic
const peopleData = require('./src/peopleData.json');

// Simulate the distribution
const numGroups = 2;
const selectedAgeGroups = ['child', 'yong child', 'yong adult', 'adult', 'senior', 'infant'];
const separateSpouses = false;

const people = peopleData.map(p => ({
  id: p.sequence,
  name: p.name,
  ageGroup: p.ageGroup,
  gender: p.gender,
  married: p.married,
  relativeId: p.relativeId,
  sequence: p.sequence
}));

console.log('Total people loaded:', people.length);
console.log('Unique IDs:', new Set(people.map(p => p.id)).size);

// Filter by age groups
const filteredPeople = people.filter(p => selectedAgeGroups.includes(p.ageGroup));
console.log('Filtered people:', filteredPeople.length);

// Initialize groups
const groups = Array.from({ length: numGroups }, () => []);
const assigned = new Set();

// Separate by age group
const byAgeGroup = {
  child: [],
  'yong child': [],
  'yong adult': [],
  adult: [],
  senior: [],
  infant: []
};

filteredPeople.forEach(person => {
  byAgeGroup[person.ageGroup].push(person);
});

console.log('byAgeGroup sizes:', Object.entries(byAgeGroup).map(([ag, arr]) => `${ag}: ${arr.length}`).join(', '));

// Balanced distribution
selectedAgeGroups.forEach(ag => {
  const peopleInAgeGroup = byAgeGroup[ag].filter(p => !assigned.has(p.id));
  
  console.log(`\nProcessing age group: ${ag}, count: ${peopleInAgeGroup.length}`);
  
  peopleInAgeGroup.forEach(person => {
    // Find group with least of this age type
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

console.log('\n=== Distribution Complete ===');
console.log('Total assigned:', assigned.size);
console.log('Group sizes:', groups.map(g => g.length));

const allDistributed = groups.flat();
console.log('Total in groups:', allDistributed.length);
console.log('Unique in groups:', new Set(allDistributed.map(p => p.id)).size);

// Check for duplicates
const idCounts = {};
allDistributed.forEach(p => {
  idCounts[p.id] = (idCounts[p.id] || 0) + 1;
});

const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
if (duplicates.length > 0) {
  console.log('\n⚠️  DUPLICATES FOUND:');
  duplicates.forEach(([id, count]) => {
    const person = people.find(p => p.id == id);
    console.log(`  ID ${id} (${person.name}) appears ${count} times`);
  });
} else {
  console.log('\n✅ No duplicates found!');
}

// Check specifically for سمير معروف (sequence 2)
const samirInGroups = groups.map((g, idx) => ({
  groupIndex: idx,
  hasSamir: g.find(p => p.id === 2)
})).filter(x => x.hasSamir);

console.log(`\nسمير معروف (ID 2) appears in ${samirInGroups.length} group(s):`);
samirInGroups.forEach(x => console.log(`  Group ${x.groupIndex + 1}`));
