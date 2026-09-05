export interface ApiError {
    code: string;
    message: string;
    detail?: string;
    details?: unknown;
    path?: string;
    status?: number;
    timestamp?: string;
}
