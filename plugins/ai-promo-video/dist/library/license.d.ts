export interface LicenseDecision {
    selectable: boolean;
    requiresAttribution: boolean;
    requiresShareAlike: boolean;
    reason: string;
}
export declare function assessFreeLicense(license: string, options?: {
    includeShareAlike?: boolean;
}): LicenseDecision;
export declare function orientation(width?: number, height?: number): 'landscape' | 'portrait' | 'square' | undefined;
