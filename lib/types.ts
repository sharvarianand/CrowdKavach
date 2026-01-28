/**
 * User type for WorkOS authentication
 */
export interface AppUser {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    profilePictureUrl?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    emailVerified?: boolean | null;
}

/**
 * Crowd density standards (people per sq meter)
 * Based on international crowd safety guidelines
 */
export const CROWD_DENSITY_STANDARDS = {
    low: 0.5,      // 0.5 people/sqm - Very comfortable, free movement
    medium: 1.5,   // 1.5 people/sqm - Moderate density, some contact
    high: 2.5,     // 2.5 people/sqm - High density, limited movement (max safe)
} as const;

export type DensityLevel = keyof typeof CROWD_DENSITY_STANDARDS;
export type AreaUnit = 'sqm' | 'sqft';

/**
 * Calculate max safe capacity based on area and density level
 */
export function calculateCapacity(area: number, areaUnit: AreaUnit = 'sqm', densityLevel: DensityLevel = 'medium'): number {
    // Convert to square meters if needed (1 sqft = 0.0929 sqm)
    const areaInSqm = areaUnit === 'sqft' ? area * 0.0929 : area;
    // Calculate capacity based on density standard
    const density = CROWD_DENSITY_STANDARDS[densityLevel];
    return Math.floor(areaInSqm * density);
}

/**
 * Camera configuration with area-based capacity
 */
export interface Camera {
    id: string;
    name: string;
    url: string;
    zone: string;
    enabled: boolean;
    status?: 'online' | 'offline' | 'error';
    // Area configuration for capacity calculation
    area?: number; // Physical area in square meters or square feet
    areaUnit?: AreaUnit; // Square meters or square feet
    capacity?: number; // Calculated or manual max safe capacity
    densityLevel?: DensityLevel; // Crowd density standard to use
    useManualCapacity?: boolean; // Whether to use manual capacity instead of calculated
}

/**
 * Camera analytics data
 */
export interface CameraAnalytics {
    camera_id: string;
    camera_name: string;
    zone: string;
    people_count: number;
    density: number;
    status: 'online' | 'offline';
}

/**
 * Aggregated analytics response
 */
export interface AllCamerasAnalytics {
    total_people_count: number;
    cameras: CameraAnalytics[];
    timestamp: number;
}

