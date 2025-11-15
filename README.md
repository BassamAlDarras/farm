# Group Distributor

A React + TypeScript application for evenly distributing people across groups based on their age categories.

## Features

- **Pre-loaded Data**: Automatically loads 130 people from JSON data on startup
- **Manual Entry**: Add people individually with name and age group
- **CSV Import**: Bulk import people using CSV format (Name,AgeGroup)
- **Age Groups**: 
  - Infant
  - Child
  - Teen
  - Adult
  - Senior

### Distribution Configuration

1. **Select Age Groups**: Choose which age groups to include in distribution
   - Check/uncheck age groups to filter who gets distributed
   - Shows count for each age group
   - Must have at least one age group selected

2. **Number of Groups**: Set how many groups to create (1-20)
   - Shows total count of selected people

3. **Distribution Options**:
   - **Separate Spouses / توزيع الأزواج في مجموعات مختلفة**: 
     - When enabled, married adult/senior couples will be placed in different groups
     - Algorithm identifies spouses by:
       - Both marked as married ('y')
       - Both are adults or seniors
       - Linked by relativeId
       - Opposite genders
     - Requires at least 2 groups to function

4. **Balanced Distribution Algorithm**: 
   - Distributes people evenly across groups
   - Each group gets similar numbers of people from each age type
   - Algorithm fills groups with smallest count first for each age group
   - Results show statistics per group

### Additional Features

- **Person Management**: Remove individual people or clear all data
- **Load Default**: Reset to the original 130 people from the JSON data
- **Group Statistics**: View breakdown of age groups in each distributed group
- **Relationship Visualization**:
  - Shows relationship arrows between related people in the same group
  - 💑 icon indicates spouses (married couples)
  - 👥 icon indicates other family members
  - People list shows count of relatives for each person
  - Hover over members to see highlights

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

## Data Structure

Each person has:
- `sequence`: Unique identifier
- `name`: Person's name (supports Arabic text)
- `ageGroup`: infant | child | teen | adult | senior
- `gender`: male | female
- `married`: y | n
- `relativeId`: Reference to related person's sequence

## CSV Import Format

```
Name,AgeGroup
John Doe,adult
Jane Smith,teen
```

Age groups are case-insensitive (adult, Adult, ADULT all work).

## Distribution Algorithm

The balanced distribution algorithm ensures equal representation:

1. **Filter by Selection**: Only includes people from selected age groups

2. **Spouse Separation** (if enabled):
   - Identifies married couples (adult/senior pairs)
   - Assigns each spouse to different groups
   - Maintains age-type balance while separating

3. **Group by Age Type**: Separates remaining people into their age categories

4. **Balanced Assignment**: For each age group:
   - Finds the group with the fewest people of that age type
   - Assigns the next person to that group
   - Continues until all people are distributed

5. **Result**: Each group has approximately equal numbers of each age type

Example: With 12 adults (6 couples), 6 children, and 3 groups:
- With spouse separation OFF: Each group gets 4 adults, 2 children
- With spouse separation ON: Each group gets 4 adults (2 from different couples), 2 children
- Maintains balance across all age types while keeping spouses apart
