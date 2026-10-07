export type TileType =
  | 'empty'
  | 'water_body'
  | 'road'
  | 'res'
  | 'com'
  | 'ind'
  | 'power'
  | 'water'
  | 'park'
  | 'school'
  | 'hospital'
  | 'fire_station';

export type ToolType =
  | 'inspect'
  | 'demolish'
  | 'emergency'
  | 'road'
  | 'res'
  | 'com'
  | 'ind'
  | 'power'
  | 'water'
  | 'park'
  | 'school'
  | 'hospital'
  | 'fire_station';

export type DisasterType = 'fire' | 'earthquake' | null;

export interface TileData {
  x: number;
  y: number;
  type: TileType;
  level: number; // 0: zoned/unbuilt, 1-3: developed
  variant: number; // visual variety seed (0-3)
  hasRoad: boolean;
  powered: boolean;
  watered: boolean;
  pop: number; // residents (res) or workers (com/ind)
  landValue: number; // 0 - 100
  pollution: number; // 0 - 100
  serviceCoverage: {
    education: boolean;
    healthcare: boolean;
    fireProtection: boolean;
  };
  constructionTime: number; // tick count when built
  abandonedTicks: number; // ticks lacking water/power
  disasterState?: 'none' | 'fire' | 'damaged';
  fireIntensity?: number; // 1 to 5
}

export interface TaxRates {
  res: number; // percentage (e.g. 9 for 9%)
  com: number;
  ind: number;
}

export interface CityBudget {
  incomeRes: number;
  incomeCom: number;
  incomeInd: number;
  totalIncome: number;
  expensePower: number;
  expenseWater: number;
  expenseRoads: number;
  expenseParks: number;
  expenseServices: number;
  totalExpense: number;
  netCashflow: number;
}

export interface Milestone {
  id: string;
  name: string;
  chineseName: string;
  popRequired: number;
  rewardCash: number;
  unlocked: boolean;
  description: string;
}

export interface Vehicle {
  id: string;
  x: number; // grid coords float
  y: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  color: string;
  speed: number;
}

export type DayNightCycle = 'day' | 'sunset' | 'night' | 'cycle';

export interface ActiveDisaster {
  type: 'fire' | 'earthquake';
  message: string;
  remainingTicks: number;
  epicenter?: { x: number; y: number };
}

export interface CityState {
  cityName: string;
  money: number;
  pop: number;
  jobs: number;
  happiness: number;
  day: number;
  month: number;
  year: number;
  speed: 0 | 1 | 2 | 3;
  powerCapacity: number;
  powerDemand: number;
  waterCapacity: number;
  waterDemand: number;
  rDemand: number; // 0 - 100
  cDemand: number; // 0 - 100
  iDemand: number; // 0 - 100
  taxRates: TaxRates;
  autoTaxEnabled: boolean;
  budget: CityBudget;
  selectedTool: ToolType;
  timeOfDay: DayNightCycle;
  soundEnabled: boolean;
  gridVisible: boolean;
  rotation: 0 | 1 | 2 | 3; // 0: 0deg, 1: 90deg, 2: 180deg, 3: 270deg
  activeDisaster: ActiveDisaster | null;
}
