/**
 * Get current time in milliseconds using performance.now()
 */
export function now(): number {
    return performance.now();
}

/**
 * Get elapsed time in milliseconds since `start`
 */
export function timeElapsed(start: number): string {
    return (performance.now() - start).toFixed(2);
}
