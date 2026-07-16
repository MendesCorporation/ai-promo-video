export function aggregateWorkerProgress(values, workers) {
    if (!Number.isInteger(workers) || workers < 1)
        throw new Error('workers must be a positive integer');
    let total = 0;
    for (let worker = 0; worker < workers; worker += 1) {
        total += Math.min(1, Math.max(0, values.get(worker) ?? 0));
    }
    return total / workers;
}
//# sourceMappingURL=render-protocol.js.map