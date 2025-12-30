import { Dumbbell, BookOpen, Languages, type LucideIcon } from 'lucide-react';

/**
 * Activity type definition - shared across all habit tracking components
 */
export type ActivityType = 'exercise' | 'reading' | 'duolingo';

/**
 * Habit type configuration
 */
export interface HabitTypeConfig {
    id: ActivityType;
    label: string;
    color: string;
    icon: LucideIcon;
    unit: string;
}

/**
 * Shared habit types configuration
 */
export const HABIT_TYPES: readonly HabitTypeConfig[] = [
    { id: 'exercise', label: '運動', color: 'orange', icon: Dumbbell, unit: '分鐘' },
    { id: 'reading', label: '閱讀', color: 'blue', icon: BookOpen, unit: '頁' },
    { id: 'duolingo', label: 'Duolingo', color: 'green', icon: Languages, unit: 'XP' },
] as const;

/**
 * Get habit type config by id
 */
export const getHabitConfig = (id: ActivityType): HabitTypeConfig => {
    return HABIT_TYPES.find(t => t.id === id) || HABIT_TYPES[0];
};
