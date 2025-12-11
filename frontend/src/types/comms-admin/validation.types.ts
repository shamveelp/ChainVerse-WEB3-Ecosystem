export interface ValidationResponse {
    success: boolean;
    available?: boolean;
    exists?: boolean;
    error?: string;
    message?: string;
}

export interface ValidationFormResult {
    isValid: boolean;
    errors: Record<string, string>;
}
