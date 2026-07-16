export interface DeliveryCleanupResult {
    outputDir: string;
    kept: string[];
    removed: string[];
}
export declare function cleanDeliveryOutput(outputDir: string, keepFiles: string[]): Promise<DeliveryCleanupResult>;
