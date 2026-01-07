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
 * Camera configuration
 */
export interface Camera {
    id: string;
    name: string;
    url: string;
    zone: string;
    enabled: boolean;
    status?: 'online' | 'offline' | 'error';
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

