// Re-export from interfaces for backward compatibility
export type { 
  ICategory, 
  ICategoryHistory, 
  CategoryWithBatteryData, 
  ActionResponse, 
  HistoryEntry,
  IBatterySeries 
} from '@/interfaces';

// Use IBatterySeries directly instead of creating a new interface
export type BatteryData = import('@/interfaces').IBatterySeries;
