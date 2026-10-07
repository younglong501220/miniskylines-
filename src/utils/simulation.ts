import { CityBudget, CityState, Milestone, TaxRates, TileData, TileType } from '../types/game';
import { GRID_SIZE, INITIAL_MILESTONES, TOOL_DEFINITIONS } from './constants';
import { sound } from './audio';
import confetti from 'canvas-confetti';

export function createEmptyGrid(): TileData[][] {
  const grid: TileData[][] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    grid[x] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      grid[x][y] = {
        x,
        y,
        type: 'empty',
        level: 0,
        variant: Math.floor(Math.random() * 4),
        hasRoad: false,
        powered: false,
        watered: false,
        pop: 0,
        landValue: 30,
        pollution: 0,
        serviceCoverage: {
          education: false,
          healthcare: false,
          fireProtection: false
        },
        constructionTime: 0,
        abandonedTicks: 0
      };
    }
  }
  return grid;
}

export function createStarterCity(): { grid: TileData[][]; statePartial: Partial<CityState> } {
  const grid = createEmptyGrid();
  const mid = Math.floor(GRID_SIZE / 2);

  // Lay starter highway crossroad
  for (let i = mid - 4; i <= mid + 4; i++) {
    grid[i][mid].type = 'road';
    grid[i][mid].level = 1;
    grid[mid][i].type = 'road';
    grid[mid][i].level = 1;
  }

  // Utilities
  grid[mid - 3][mid - 2].type = 'power';
  grid[mid - 3][mid - 2].level = 1;
  grid[mid - 2][mid - 2].type = 'water';
  grid[mid - 2][mid - 2].level = 1;

  // Starter residential zones
  grid[mid + 1][mid - 1].type = 'res';
  grid[mid + 1][mid - 1].level = 1;
  grid[mid + 1][mid - 1].pop = 12;

  grid[mid + 2][mid - 1].type = 'res';
  grid[mid + 2][mid - 1].level = 1;
  grid[mid + 2][mid - 1].pop = 10;

  // Starter commercial & park
  grid[mid + 1][mid + 1].type = 'com';
  grid[mid + 1][mid + 1].level = 1;
  grid[mid + 1][mid + 1].pop = 8;

  grid[mid - 1][mid + 1].type = 'park';
  grid[mid - 1][mid + 1].level = 1;

  return {
    grid,
    statePartial: {
      money: 20000,
      pop: 22,
      jobs: 8
    }
  };
}

// Check if a tile has adjacent road
export function hasAdjacentRoad(grid: TileData[][], gx: number, gy: number): boolean {
  const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0]
  ];
  for (const [dx, dy] of dirs) {
    const nx = gx + dx;
    const ny = gy + dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      if (grid[nx][ny].type === 'road') return true;
    }
  }
  return false;
}

// Calculate distance
function getDist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

export interface SimulationResult {
  nextState: CityState;
  newMilestonesUnlocked: Milestone[];
  events: string[];
}

export function runSimulationTick(
  grid: TileData[][],
  currentState: CityState,
  milestones: Milestone[]
): SimulationResult {
  const events: string[] = [];
  const newMilestonesUnlocked: Milestone[] = [];

  // Advance Calendar
  let { day, month, year } = currentState;
  day += 1;
  if (day > 30) {
    day = 1;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  // Auto-Tax Balancing System
  // 當財政赤字時，根據 RCI 需求強度動態調升稅率（上限 15%），當預算盈餘豐厚時調降稅率以鼓勵市民發展
  const nextTaxRates: TaxRates = { ...currentState.taxRates };
  if (currentState.autoTaxEnabled) {
    const prevNet = currentState.budget?.netCashflow ?? 0;

    // 1. 財政赤字 (netCashflow < 0)：依據 RCI 需求強度動態調升稅率，上限 15%
    if (prevNet < 0) {
      // 住宅需求充沛 (rDemand >= 40) 代表市民流入意願強，可優先提高住宅稅率以彌補財政
      if (currentState.rDemand >= 40 && nextTaxRates.res < 15) {
        nextTaxRates.res = Math.min(15, nextTaxRates.res + 1);
      } else if (currentState.rDemand >= 20 && nextTaxRates.res < 12) {
        nextTaxRates.res = Math.min(15, nextTaxRates.res + 1);
      }

      // 商業需求充沛 (cDemand >= 40) 代表商機旺盛，適度調升商業營業稅
      if (currentState.cDemand >= 40 && nextTaxRates.com < 15) {
        nextTaxRates.com = Math.min(15, nextTaxRates.com + 1);
      } else if (currentState.cDemand >= 20 && nextTaxRates.com < 12) {
        nextTaxRates.com = Math.min(15, nextTaxRates.com + 1);
      }

      // 工業需求充沛 (iDemand >= 40) 代表產能擴張，調升工業稅率
      if (currentState.iDemand >= 40 && nextTaxRates.ind < 15) {
        nextTaxRates.ind = Math.min(15, nextTaxRates.ind + 1);
      } else if (currentState.iDemand >= 20 && nextTaxRates.ind < 12) {
        nextTaxRates.ind = Math.min(15, nextTaxRates.ind + 1);
      }

      // 若赤字龐大 (<-25) 且個別需求未達門檻，強制對所有未滿 14% 的分區實施微幅增稅以防破產
      if (prevNet < -25) {
        if (nextTaxRates.res < 15) nextTaxRates.res = Math.min(15, nextTaxRates.res + 1);
        if (nextTaxRates.com < 15) nextTaxRates.com = Math.min(15, nextTaxRates.com + 1);
        if (nextTaxRates.ind < 15) nextTaxRates.ind = Math.min(15, nextTaxRates.ind + 1);
      }
    }
    // 2. 預算盈餘豐厚 (netCashflow > 35)：調降稅率以鼓勵市民遷入、促進商業與工業蓬勃發展
    else if (prevNet > 35) {
      // 依序調降各區稅率（最低降至 5%）
      if (nextTaxRates.res > 6) {
        nextTaxRates.res = Math.max(5, nextTaxRates.res - 1);
      }
      if (nextTaxRates.com > 6) {
        nextTaxRates.com = Math.max(5, nextTaxRates.com - 1);
      }
      if (nextTaxRates.ind > 6) {
        nextTaxRates.ind = Math.max(5, nextTaxRates.ind - 1);
      }
    }
  }

  // 1. Gather Municipal Capacities and Amenity Locations
  let totalPowerCapacity = 0;
  let totalWaterCapacity = 0;
  const parks: { x: number; y: number }[] = [];
  const schools: { x: number; y: number }[] = [];
  const hospitals: { x: number; y: number }[] = [];
  const fireStations: { x: number; y: number }[] = [];
  const industrialZones: { x: number; y: number }[] = [];
  let roadCount = 0;

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const tile = grid[x][y];
      if (tile.type === 'power') totalPowerCapacity += 180;
      else if (tile.type === 'water') totalWaterCapacity += 140;
      else if (tile.type === 'park') parks.push({ x, y });
      else if (tile.type === 'school') schools.push({ x, y });
      else if (tile.type === 'hospital') hospitals.push({ x, y });
      else if (tile.type === 'fire_station') fireStations.push({ x, y });
      else if (tile.type === 'ind') industrialZones.push({ x, y });
      else if (tile.type === 'road') roadCount++;
    }
  }

  // 2. Calculate Environmental Factors (Land Value, Pollution, Service Coverage)
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const tile = grid[x][y];

      // Base Land Value
      let lv = 35;

      // Proximity to parks (+12 max per park within 4 tiles)
      parks.forEach((p) => {
        const d = getDist(x, y, p.x, p.y);
        if (d <= 4) {
          lv += Math.round((5 - d) * 6);
        }
      });

      // Proximity to industry generates pollution and drops land value
      let pollution = 0;
      industrialZones.forEach((ind) => {
        const d = getDist(x, y, ind.x, ind.y);
        if (d <= 3.5) {
          pollution += Math.round((4 - d) * 12);
        }
      });
      tile.pollution = Math.min(100, pollution);
      lv -= Math.round(tile.pollution * 0.4);

      // Service Coverage
      tile.serviceCoverage.education = schools.some((s) => getDist(x, y, s.x, s.y) <= 4.5);
      tile.serviceCoverage.healthcare = hospitals.some((h) => getDist(x, y, h.x, h.y) <= 4.5);
      tile.serviceCoverage.fireProtection = fireStations.some((f) => getDist(x, y, f.x, f.y) <= 4.5);

      if (tile.serviceCoverage.education) lv += 10;
      if (tile.serviceCoverage.healthcare) lv += 10;
      if (tile.serviceCoverage.fireProtection) lv += 5;

      tile.landValue = Math.max(10, Math.min(100, lv));
    }
  }

  // 3. Power, Water, Road Access and Development Processing
  let usedPower = 0;
  let usedWater = 0;
  let totalPop = 0;
  let totalJobs = 0;
  let didUpgradeHappen = false;

  // Track and process ongoing disasters
  let activeFireCount = 0;
  let activeDamagedCount = 0;

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const tile = grid[x][y];

      // Handle ongoing fire
      if (tile.disasterState === 'fire') {
        activeFireCount++;
        // If covered by fire station, firefighters help contain it
        if (tile.serviceCoverage.fireProtection) {
          tile.fireIntensity = (tile.fireIntensity || 2) - 1;
          if (tile.fireIntensity <= 0) {
            tile.disasterState = 'none';
            tile.fireIntensity = 0;
            events.push(`🚒 消防分局迅速撲滅了位於 [${x}, ${y}] 的火勢！`);
          }
        } else {
          tile.fireIntensity = (tile.fireIntensity || 1) + 1;
          // Chance to spread to adjacent building
          if (Math.random() < 0.25) {
            const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const adj = grid[nx][ny];
              if (['res', 'com', 'ind'].includes(adj.type) && adj.disasterState !== 'fire') {
                adj.disasterState = 'fire';
                adj.fireIntensity = 2;
                events.push(`🔥 火勢蔓延至相鄰的 [${nx}, ${ny}]！`);
              }
            }
          }
          // High intensity burns down the building into damaged rubble
          if (tile.fireIntensity >= 5) {
            tile.disasterState = 'damaged';
            tile.fireIntensity = 0;
            tile.pop = 0;
            events.push(`⚠️ 位於 [${x}, ${y}] 的建築不堪大火焚燒而坍塌！`);
          }
        }
      } else if (tile.disasterState === 'damaged') {
        activeDamagedCount++;
      }

      if (tile.type === 'empty' || tile.type === 'road') {
        tile.hasRoad = false;
        tile.powered = false;
        tile.watered = false;
        continue;
      }

      // Check Road Access
      tile.hasRoad = hasAdjacentRoad(grid, x, y);

      // Power / Water Demands
      let tilePowerNeed = 0;
      let tileWaterNeed = 0;

      if (tile.type === 'res') {
        tilePowerNeed = (tile.level || 1) * 3;
        tileWaterNeed = (tile.level || 1) * 2;
      } else if (tile.type === 'com') {
        tilePowerNeed = (tile.level || 1) * 4;
        tileWaterNeed = (tile.level || 1) * 3;
      } else if (tile.type === 'ind') {
        tilePowerNeed = (tile.level || 1) * 6;
        tileWaterNeed = (tile.level || 1) * 5;
      } else if (tile.type === 'school' || tile.type === 'hospital' || tile.type === 'fire_station') {
        tilePowerNeed = 5;
        tileWaterNeed = 4;
      } else if (tile.type === 'park') {
        tilePowerNeed = 0;
        tileWaterNeed = 1;
      }

      // Check if grid has capacity
      tile.powered = usedPower + tilePowerNeed <= totalPowerCapacity;
      tile.watered = usedWater + tileWaterNeed <= totalWaterCapacity;

      if (tile.powered) usedPower += tilePowerNeed;
      if (tile.watered) usedWater += tileWaterNeed;

      // Burning or damaged tiles cannot grow or house citizens
      if (tile.disasterState === 'fire' || tile.disasterState === 'damaged') {
        tile.pop = Math.max(0, Math.floor(tile.pop * 0.5));
        continue;
      }

      // Handle Abandonment if lacking necessities
      if (['res', 'com', 'ind'].includes(tile.type)) {
        if (!tile.powered || !tile.watered || !tile.hasRoad) {
          tile.abandonedTicks++;
          if (tile.abandonedTicks > 12) {
            if (tile.level > 0) {
              tile.level = Math.max(0, tile.level - 1);
              tile.pop = Math.floor(tile.pop * 0.4);
            }
          }
        } else {
          tile.abandonedTicks = Math.max(0, tile.abandonedTicks - 1);

          // Growth and Upgrade Logic
          const canGrow = tile.hasRoad && tile.powered && tile.watered;
          if (canGrow) {
            // Residential
            if (tile.type === 'res' && currentState.rDemand > 25) {
              if (tile.level === 0) {
                tile.level = 1;
                tile.pop = Math.floor(8 + Math.random() * 6);
                didUpgradeHappen = true;
              } else if (tile.level === 1 && tile.landValue >= 45 && Math.random() < 0.2) {
                tile.level = 2;
                tile.pop = Math.floor(28 + Math.random() * 16);
                didUpgradeHappen = true;
              } else if (tile.level === 2 && tile.landValue >= 70 && tile.serviceCoverage.education && Math.random() < 0.15) {
                tile.level = 3;
                tile.pop = Math.floor(85 + Math.random() * 45);
                didUpgradeHappen = true;
              }
            }

            // Commercial
            if (tile.type === 'com' && currentState.cDemand > 25) {
              if (tile.level === 0) {
                tile.level = 1;
                tile.pop = Math.floor(6 + Math.random() * 6);
                didUpgradeHappen = true;
              } else if (tile.level === 1 && tile.landValue >= 45 && Math.random() < 0.18) {
                tile.level = 2;
                tile.pop = Math.floor(22 + Math.random() * 14);
                didUpgradeHappen = true;
              } else if (tile.level === 2 && tile.landValue >= 65 && Math.random() < 0.12) {
                tile.level = 3;
                tile.pop = Math.floor(65 + Math.random() * 35);
                didUpgradeHappen = true;
              }
            }

            // Industrial
            if (tile.type === 'ind' && currentState.iDemand > 25) {
              if (tile.level === 0) {
                tile.level = 1;
                tile.pop = Math.floor(12 + Math.random() * 8);
                didUpgradeHappen = true;
              } else if (tile.level === 1 && Math.random() < 0.16) {
                tile.level = 2;
                tile.pop = Math.floor(32 + Math.random() * 16);
                didUpgradeHappen = true;
              } else if (tile.level === 2 && Math.random() < 0.1) {
                tile.level = 3;
                tile.pop = Math.floor(75 + Math.random() * 25);
                didUpgradeHappen = true;
              }
            }
          }
        }

        // Tally Population & Jobs
        if (tile.type === 'res') totalPop += tile.pop;
        else if (tile.type === 'com' || tile.type === 'ind') totalJobs += tile.pop;
      }
    }
  }

  // Random Disaster Event Engine
  let activeDisaster = currentState.activeDisaster;

  if (activeDisaster) {
    activeDisaster.remainingTicks--;
    if (activeFireCount === 0 && activeDamagedCount === 0) {
      activeDisaster = null;
      events.push('✅ 城市所有險情已成功排除！市民深表感激。');
    } else if (activeDisaster.remainingTicks <= 0 && activeFireCount === 0) {
      activeDisaster = null;
    }
  } else {
    // Occasional disaster trigger if city has established buildings
    const occupiedTiles: { x: number; y: number }[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const t = grid[x][y];
        if (['res', 'com', 'ind'].includes(t.type) && t.level > 0 && !t.disasterState) {
          occupiedTiles.push({ x, y });
        }
      }
    }

    // ~3.5% chance per tick when city has at least 4 developed buildings
    if (occupiedTiles.length >= 4 && Math.random() < 0.035) {
      const isEarthquake = Math.random() < 0.45;
      if (isEarthquake) {
        // Earthquake Event
        const epicenter = occupiedTiles[Math.floor(Math.random() * occupiedTiles.length)];
        let hitCount = 0;
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            const nx = epicenter.x + dx;
            const ny = epicenter.y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              const t = grid[nx][ny];
              if (['res', 'com', 'ind'].includes(t.type) && Math.random() < 0.5) {
                t.disasterState = 'damaged';
                hitCount++;
              }
            }
          }
        }
        sound.playEarthquake();
        activeDisaster = {
          type: 'earthquake',
          message: `震央位於 [${epicenter.x}, ${epicenter.y}]，請立即使用【緊急應變】(E) 搶修！`,
          remainingTicks: 25,
          epicenter
        };
        events.push(`🌋 突發災難：強烈地震突襲！${hitCount} 棟建築受損，請使用【緊急應變】(E) 修復！`);
      } else {
        // Fire Event
        const target = occupiedTiles[Math.floor(Math.random() * occupiedTiles.length)];
        const targetTile = grid[target.x][target.y];
        targetTile.disasterState = 'fire';
        targetTile.fireIntensity = 3;
        sound.playSiren();
        activeDisaster = {
          type: 'fire',
          message: `火勢在 [${target.x}, ${target.y}] 迅速蔓延，請使用【緊急應變】(E) 滅火！`,
          remainingTicks: 20,
          epicenter: target
        };
        events.push(`🚨 突發火災：[${target.x}, ${target.y}] 發生猛烈大火！請使用【緊急應變】(E) 搶險！`);
      }
    }
  }

  if (didUpgradeHappen) {
    sound.playUpgrade();
  }

  // 4. Budget & Financial Accounting
  const taxRateRes = nextTaxRates.res / 100;
  const taxRateCom = nextTaxRates.com / 100;
  const taxRateInd = nextTaxRates.ind / 100;

  const incomeRes = Math.floor(totalPop * 5.2 * (taxRateRes / 0.09));
  const incomeCom = Math.floor(totalJobs * 3.8 * (taxRateCom / 0.09) * (currentState.cDemand / 50));
  const incomeInd = Math.floor(totalJobs * 3.2 * (taxRateInd / 0.09) * (currentState.iDemand / 50));
  const totalIncome = incomeRes + incomeCom + incomeInd;

  const powerPlantCount = totalPowerCapacity / 180;
  const waterStationCount = totalWaterCapacity / 140;

  const expensePower = Math.floor(powerPlantCount * TOOL_DEFINITIONS.power.upkeep);
  const expenseWater = Math.floor(waterStationCount * TOOL_DEFINITIONS.water.upkeep);
  const expenseRoads = Math.floor(roadCount * TOOL_DEFINITIONS.road.upkeep);
  const expenseParks = Math.floor(parks.length * TOOL_DEFINITIONS.park.upkeep);
  const expenseServices = Math.floor(
    schools.length * TOOL_DEFINITIONS.school.upkeep +
      hospitals.length * TOOL_DEFINITIONS.hospital.upkeep +
      fireStations.length * TOOL_DEFINITIONS.fire_station.upkeep
  );
  const totalExpense = expensePower + expenseWater + expenseRoads + expenseParks + expenseServices;
  const netCashflow = totalIncome - totalExpense;

  const newMoney = Math.max(-5000, currentState.money + netCashflow);

  // 5. Dynamic RCI Demands
  // Residential: boosted when jobs > pop, lowered by high taxes or low happiness
  const jobDeficitOrSurplus = totalJobs - totalPop;
  let targetR = 50 + Math.floor(jobDeficitOrSurplus * 0.8) - (nextTaxRates.res - 9) * 4;
  targetR = Math.max(5, Math.min(95, targetR));

  // Commercial: boosted by population purchasing power, adjusted by tax
  let targetC = 30 + Math.floor(totalPop * 0.4) - Math.floor(totalJobs * 0.3) - (nextTaxRates.com - 9) * 3;
  targetC = Math.max(5, Math.min(95, targetC));

  // Industrial: boosted by available workers, adjusted by tax
  let targetI = 35 + Math.floor((totalPop - totalJobs) * 0.5) - (nextTaxRates.ind - 9) * 3;
  targetI = Math.max(5, Math.min(95, targetI));

  // 6. Citizen Happiness (0-100)
  let happiness = 85;
  if (usedPower > totalPowerCapacity) happiness -= 25;
  if (usedWater > totalWaterCapacity) happiness -= 25;
  if (nextTaxRates.res > 11) happiness -= (nextTaxRates.res - 11) * 3;
  if (nextTaxRates.res < 9) happiness += (9 - nextTaxRates.res) * 2;
  if (activeDisaster) happiness -= 18; // Citizen distress during disaster
  happiness += Math.min(15, parks.length * 3);
  happiness += Math.min(10, schools.length * 3);
  happiness += Math.min(10, hospitals.length * 3);
  happiness = Math.max(10, Math.min(100, happiness));

  // 7. Check Milestones
  const updatedMilestones = milestones.map((m) => {
    if (!m.unlocked && totalPop >= m.popRequired) {
      newMilestonesUnlocked.push(m);
      events.push(`🎉 城市晉級：【${m.chineseName}】（人口達 ${m.popRequired}），獲得撥款 $${m.rewardCash.toLocaleString()}！`);
      sound.playMilestone();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore if confetti blocked
      }
      return { ...m, unlocked: true };
    }
    return m;
  });

  let milestoneRewardCash = 0;
  newMilestonesUnlocked.forEach((m) => {
    milestoneRewardCash += m.rewardCash;
  });

  const budget: CityBudget = {
    incomeRes,
    incomeCom,
    incomeInd,
    totalIncome,
    expensePower,
    expenseWater,
    expenseRoads,
    expenseParks,
    expenseServices,
    totalExpense,
    netCashflow
  };

  const nextState: CityState = {
    ...currentState,
    money: newMoney + milestoneRewardCash,
    pop: totalPop,
    jobs: totalJobs,
    happiness,
    day,
    month,
    year,
    powerCapacity: totalPowerCapacity,
    powerDemand: usedPower,
    waterCapacity: totalWaterCapacity,
    waterDemand: usedWater,
    rDemand: targetR,
    cDemand: targetC,
    iDemand: targetI,
    taxRates: nextTaxRates,
    budget,
    activeDisaster
  };

  return {
    nextState,
    newMilestonesUnlocked,
    events
  };
}
