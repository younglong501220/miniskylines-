import { Milestone, ToolType } from '../types/game';

export const GRID_SIZE = 24;
export const TILE_W = 64;
export const TILE_H = 32;

export interface ToolDef {
  id: ToolType;
  name: string;
  nameZh: string;
  category: 'infra' | 'zone' | 'utility' | 'amenity' | 'tool';
  cost: number;
  upkeep: number;
  icon: string;
  descriptionZh: string;
  shortcut: string;
}

export const TOOL_DEFINITIONS: Record<ToolType, ToolDef> = {
  inspect: {
    id: 'inspect',
    name: 'Inspect',
    nameZh: '勘查資訊',
    category: 'tool',
    cost: 0,
    upkeep: 0,
    icon: '🔍',
    descriptionZh: '檢視指定地塊的詳細狀態、供電、供水、地價與升級進度',
    shortcut: 'Q'
  },
  emergency: {
    id: 'emergency',
    name: 'Emergency Response',
    nameZh: '緊急應變',
    category: 'tool',
    cost: 35,
    upkeep: 0,
    icon: '🧯',
    descriptionZh: '派遣應變救援隊撲滅火災、修復震損建物，防止災害持續蔓延擴大',
    shortcut: 'E'
  },
  road: {
    id: 'road',
    name: 'Road',
    nameZh: '雙線道路',
    category: 'infra',
    cost: 25,
    upkeep: 1,
    icon: '🛣️',
    descriptionZh: '連接建築與各區域的交通命脈，所有建築皆需臨路方能發展',
    shortcut: '1'
  },
  res: {
    id: 'res',
    name: 'Residential',
    nameZh: '住宅分區',
    category: 'zone',
    cost: 50,
    upkeep: 0,
    icon: '🟩',
    descriptionZh: '規劃低密度至高密度住宅，吸引市民移居並繳納人頭稅',
    shortcut: '2'
  },
  com: {
    id: 'com',
    name: 'Commercial',
    nameZh: '商業分區',
    category: 'zone',
    cost: 75,
    upkeep: 0,
    icon: '🟦',
    descriptionZh: '規劃商店、商場與企業辦公室，提供就業並促進商品流通',
    shortcut: '3'
  },
  ind: {
    id: 'ind',
    name: 'Industrial',
    nameZh: '工業分區',
    category: 'zone',
    cost: 100,
    upkeep: 0,
    icon: '🟧',
    descriptionZh: '製造業與工廠，創造就業機會但會產生鄰近污染',
    shortcut: '4'
  },
  power: {
    id: 'power',
    name: 'Power Plant',
    nameZh: '火力發電廠',
    category: 'utility',
    cost: 1200,
    upkeep: 80,
    icon: '⚡',
    descriptionZh: '為城市提供 180 MW 電力容量。發電廠本身具微幅污染',
    shortcut: '5'
  },
  water: {
    id: 'water',
    name: 'Water Station',
    nameZh: '水庫水泵站',
    category: 'utility',
    cost: 800,
    upkeep: 50,
    icon: '💧',
    descriptionZh: '提供 140 m³ 乾淨用水，確保住宅衛生與工業運作',
    shortcut: '6'
  },
  park: {
    id: 'park',
    name: 'City Park',
    nameZh: '市民休閒公園',
    category: 'amenity',
    cost: 180,
    upkeep: 10,
    icon: '🌳',
    descriptionZh: '顯著提升周遭 3 格內地價與市民滿意度，加速高級住宅升級',
    shortcut: '7'
  },
  school: {
    id: 'school',
    name: 'Elementary School',
    nameZh: '社區小學',
    category: 'amenity',
    cost: 650,
    upkeep: 45,
    icon: '🏫',
    descriptionZh: '提升周遭 4 格市民教育水平，使商業大樓更易升級為摩天樓',
    shortcut: '8'
  },
  hospital: {
    id: 'hospital',
    name: 'Clinic / Hospital',
    nameZh: '市民診所醫院',
    category: 'amenity',
    cost: 750,
    upkeep: 50,
    icon: '🏥',
    descriptionZh: '保障市民醫療健康，抵消工業污染負面影響並增加人口移入速度',
    shortcut: '9'
  },
  fire_station: {
    id: 'fire_station',
    name: 'Fire Station',
    nameZh: '消防防護局',
    category: 'amenity',
    cost: 600,
    upkeep: 40,
    icon: '🚒',
    descriptionZh: '降低工業區與密集商業區的火災風險，維護市民安全',
    shortcut: '0'
  },
  demolish: {
    id: 'demolish',
    name: 'Bulldozer',
    nameZh: '重型推土機',
    category: 'tool',
    cost: 10,
    upkeep: 0,
    icon: '🚜',
    descriptionZh: '拆除指定地塊上的任何建築或道路，騰出空間',
    shortcut: 'X'
  }
};

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'hamlet',
    name: 'Hamlet',
    chineseName: '開拓村落',
    popRequired: 50,
    rewardCash: 3000,
    unlocked: false,
    description: '城市初具規模，解鎖公共休閒設施補貼'
  },
  {
    id: 'village',
    name: 'Village',
    chineseName: '繁榮市鎮',
    popRequired: 150,
    rewardCash: 6000,
    unlocked: false,
    description: '小鎮初具雛形，獲得市政獎勵金'
  },
  {
    id: 'town',
    name: 'Town',
    chineseName: '新興城鎮',
    popRequired: 350,
    rewardCash: 12000,
    unlocked: false,
    description: '人口穩步增長，商業活動蓬勃展開'
  },
  {
    id: 'city',
    name: 'City',
    chineseName: '現代都市',
    popRequired: 700,
    rewardCash: 25000,
    unlocked: false,
    description: '高樓拔地而起，邁入繁華現代城市行列'
  },
  {
    id: 'metropolis',
    name: 'Metropolis',
    chineseName: '天際大都會',
    popRequired: 1500,
    rewardCash: 50000,
    unlocked: false,
    description: '天際線雄偉壯麗，成為區域經濟核心大都會'
  }
];
