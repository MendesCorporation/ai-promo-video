export declare const helpKinds: readonly ["tool", "component", "transition", "topic"];
export type HelpKind = typeof helpKinds[number];
export interface HelpParameter {
    type: string;
    required?: boolean;
    default?: unknown;
    accepted?: string;
    recommended?: string;
    description: string;
    constraints?: string[];
}
export interface HelpEntry {
    kind: HelpKind;
    id: string;
    title: string;
    summary: string;
    whenToUse?: string[];
    avoidWhen?: string[];
    prerequisites?: string[];
    parameters?: Record<string, HelpParameter>;
    workflow?: string[];
    example?: string;
    pitfalls?: string[];
    validation?: string[];
    related?: string[];
    sourceExports?: string[];
    tags?: string[];
    moods?: string[];
    energy?: string[];
    notes?: string;
    contractLevel?: 'catalog' | 'calibrated';
}
/**
 * Detailed operational notes live here instead of in the MCP server instructions.
 * The host only loads one selected entry through the help tool.
 */
export declare const toolHelpEntries: HelpEntry[];
export interface GetHelpOptions {
    target?: string;
    kind?: HelpKind;
    id?: string;
    query?: string;
    limit?: number;
}
export declare function getContextualHelp(options?: GetHelpOptions): {
    mode: string;
    target: string;
    help: HelpEntry;
    requested?: undefined;
    suggestions?: undefined;
    candidates?: undefined;
    query?: undefined;
    results?: undefined;
    purpose?: undefined;
    usage?: undefined;
    counts?: undefined;
    componentCategories?: undefined;
    topics?: undefined;
    note?: undefined;
} | {
    mode: string;
    requested: string;
    suggestions: {
        contractLevel?: "catalog" | "calibrated" | undefined;
        target: string;
        title: string;
        summary: string;
    }[];
    target?: undefined;
    help?: undefined;
    candidates?: undefined;
    query?: undefined;
    results?: undefined;
    purpose?: undefined;
    usage?: undefined;
    counts?: undefined;
    componentCategories?: undefined;
    topics?: undefined;
    note?: undefined;
} | {
    mode: string;
    requested: string;
    candidates: {
        contractLevel?: "catalog" | "calibrated" | undefined;
        target: string;
        title: string;
        summary: string;
    }[];
    target?: undefined;
    help?: undefined;
    suggestions?: undefined;
    query?: undefined;
    results?: undefined;
    purpose?: undefined;
    usage?: undefined;
    counts?: undefined;
    componentCategories?: undefined;
    topics?: undefined;
    note?: undefined;
} | {
    mode: string;
    query: string;
    results: {
        contractLevel?: "catalog" | "calibrated" | undefined;
        target: string;
        title: string;
        summary: string;
    }[];
    target?: undefined;
    help?: undefined;
    requested?: undefined;
    suggestions?: undefined;
    candidates?: undefined;
    purpose?: undefined;
    usage?: undefined;
    counts?: undefined;
    componentCategories?: undefined;
    topics?: undefined;
    note?: undefined;
} | {
    mode: string;
    purpose: string;
    usage: ({
        query: {
            query: string;
        };
        exactTarget?: undefined;
        exactFields?: undefined;
        transition?: undefined;
    } | {
        exactTarget: {
            target: string;
        };
        query?: undefined;
        exactFields?: undefined;
        transition?: undefined;
    } | {
        exactFields: {
            kind: string;
            id: string;
        };
        query?: undefined;
        exactTarget?: undefined;
        transition?: undefined;
    } | {
        transition: {
            kind: string;
            id: string;
        };
        query?: undefined;
        exactTarget?: undefined;
        exactFields?: undefined;
    })[];
    counts: {
        tools: number;
        components: number;
        transitions: number;
        topics: number;
    };
    componentCategories: {
        [k: string]: number;
    };
    topics: {
        contractLevel?: "catalog" | "calibrated" | undefined;
        target: string;
        title: string;
        summary: string;
    }[];
    note: string;
    target?: undefined;
    help?: undefined;
    requested?: undefined;
    suggestions?: undefined;
    candidates?: undefined;
    query?: undefined;
    results?: undefined;
};
