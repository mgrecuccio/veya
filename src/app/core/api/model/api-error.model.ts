export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
    path?: string;
    status?: number;
    timestamp?: string;
}
