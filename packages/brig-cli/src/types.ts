export interface SeaConfig {
  name: string;
  created: string;
  harbor: string;
  islands: string[];
  crew: string[];
  charts: string[];
}

export interface BrigConfig {
  currentSea?: string;
  knownSeas: string[];
  globalHarbor?: string;
}

export interface IslandConfig {
  name: string;
  description: string;
  resources: string[];
  climate: 'calm' | 'busy' | 'stormy' | 'tropical' | 'arctic';
  events: IslandEvent[];
  created: string;
  state: IslandState;
}

export interface IslandEvent {
  type: 'tide' | 'storm' | 'volcano' | 'festival' | 'treasure' | 'pirates';
  schedule?: string; // cron expression
  trigger?: string;  // condition
  action: string;
}

export interface IslandState {
  weather: 'calm' | 'partly-cloudy' | 'stormy' | 'foggy';
  inhabitants: number;
  lastActivity: string;
  treasures: number;
  storms: number;
}

export interface CrewMember {
  name: string;
  role: string;
  status: 'sailing' | 'anchored' | 'ashore' | 'lost';
  currentIsland?: string;
  pid?: number;
  created: string;
}

export interface Chart {
  name: string;
  description: string;
  route: RouteStep[];
}

export interface RouteStep {
  island: string;
  action: string;
  duration?: string;
  params?: Record<string, any>;
}

export interface Voyage {
  id: string;
  chart: string;
  status: 'planning' | 'sailing' | 'completed' | 'aborted';
  currentStep: number;
  startTime: string;
  endTime?: string;
  results?: any[];
}