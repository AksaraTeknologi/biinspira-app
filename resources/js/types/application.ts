export interface Application {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    color?: string | null;
    is_active: boolean;
    revision_requests_count?: number;
    created_at?: string;
    updated_at?: string;
}

export const PRESET_APPLICATION_COLORS = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
    '#06B6D4', '#F97316', '#EC4899', '#6366F1', '#84CC16',
];
