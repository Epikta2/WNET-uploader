// 🌐 FIBER PROFILE - Modern high-speed residential (100-500 Mbps)
// Optimized for: Modern fiber connections, high-speed residential
// Settings: 50MB parts, 12 parallel, balanced performance

const FIBER_PROFILE = {
    name: 'FIBER',
    tier: 'FIBER',
    
    // Core Performance - optimized for modern fiber (100-500 Mbps)
    partSize: 75 * 1024 * 1024, // 75MB parts - optimized for better TCP efficiency
    parallel: 8, // Moderate parallel count
    maxCap: 16, // Maximum parallel cap
    minParallel: 6, // Minimum parallel for stability
    targetSpeed: 400, // Target 300-600 Mbps range (FIBER tier)
    
    // Adaptive Ramp Logic
    rampUpThreshold: 2.7, // Quicker scaling under stable conditions
    rampDownThreshold: 1.2, // Wide tolerance for high-speed residential
    backpressureThreshold: 30.0, // 30 Mbps backpressure threshold
    
    // Timing & Control
    staggerDelay: 50, // 25-50ms stagger delay for fiber
    
    warmupCount: 16, // Moderate warm-up
    scaleUpCooldown: 10000, // 10s cooldown between scale-ups
    scaleDownCooldown: 30000, // 30s cooldown for scale-downs
    lowSpeedSampleThreshold: 4, // Require 4 samples before scaling down
    
    // Degradation Recovery
    degradationThreshold: 0.6, // 60% degradation threshold
    throttleAmount: 2, // Moderate throttling
    
    // Sweet Spot Protection
    enableSweetSpotProtection: true,
    peakDetectionThreshold: 80, // Mbps threshold for peak detection
    sweetSpotProtectionDuration: 45000, // 45s protection period
    
    // Stall Protection
    minPartSpeed: 0.35, // MB/s - below this is considered slow
    minPartTimeout: 15000, // ms - kill slow parts after 15s
    noProgressTimeout: 40000, // ms - no parts complete = stalled
    
    // Reinforcement
    reinforcementSampleCount: 4, // Strong performance samples to lock strategy
    emergencyResetThreshold: 12, // Mbps - emergency reset threshold
    
    // 🚀 FIBER-specific staging configuration (IMMEDIATE SATURATION)
    stagingConfig: {
        immediateFullCapacity: true, // Skip staging - launch at full capacity immediately
        initialBatch: 8, // Launch optimal 8 parts immediately
        preflightParts: 0, // No preflight needed
        preflightTimeoutMs: 0, // No timeout needed
        skipStaging: true, // Bypass all staging logic
        maxParallelImmediate: true, // Use maxParallel from the start
        aggressiveStart: true, // Aggressive start for fiber connections
        timingInterval: 1000 // 1s monitoring for fiber feedback
    },
    
    description: 'Modern high-speed residential fiber (100-500 Mbps) — 75MB parts, immediate saturation'
};

// FIBER-specific upload logic - IMMEDIATE SATURATION
function createFiberUploadStrategy(connectionInfo) {
    console.log(`🌐 FIBER PROFILE ACTIVATED: ${(connectionInfo.bandwidth * 8).toFixed(1)} Mbps detected`);
    console.log(`⚡ FIBER IMMEDIATE SATURATION: Launching at maximum settings from start`);
    
    const strategy = {
        partSize: FIBER_PROFILE.partSize,
        maxParallel: FIBER_PROFILE.parallel,
        maxParallelCap: FIBER_PROFILE.maxCap,
        profile: FIBER_PROFILE,
        immediateFullCapacity: true, // Flag for staging logic to skip ramp-up
        skipGradualRampUp: true, // No gradual scaling
        launchAllPartsImmediately: true // Launch all parts at once
    };
    
    console.log(`🚨 FIBER OPTIMIZED: 75MB parts + ${FIBER_PROFILE.parallel} parallel + IMMEDIATE saturation`);
    
    return strategy;
}

// FIBER-specific adaptive monitoring with complete logic from index.html
function createFiberAdaptiveMonitor(strategy, performanceTracker, context) {
    let avgPartSpeedHistory = [];
    let parallelAdjustmentHistory = [];
    let lastParallelAdjustment = 0;
    let lastScaleDown = 0;
    let lowSpeedSamples = 0;
    let peakPerformanceDetected = false;
    let maxParallel = strategy.maxParallel; // Initialize maxParallel from strategy
    let optimalParallel = strategy.maxParallel;
    let peakTimestamp = null;
    let initialPeakThroughput = null;
    let lastScaleTime = 0;
    let peakThroughputHistory = [];
    let throughputSmoothingHistory = [];
    let peakResetState = 'stable';
    let strongPerformanceSamples = 0;
    let lastProgress = Date.now();
    let emergencyResetCounter = 0;
    let lockedPerformance = false;
    
    const monitorInterval = setInterval(async () => {
        if (!context.isUploadActive || context.isUploadCancelled) {
            console.log('FIBER adaptive monitor stopping - upload cancelled or inactive');
            clearInterval(monitorInterval);
            return;
        }
        
        // Allow monitoring even when activeUploads is temporarily 0 (between parts)
        if (context.activeUploads === 0 && performanceTracker.partTimes.length === 0) {
            // Only stop if no parts have been processed yet
            return;
        }
        
        try {
            const recentParts = performanceTracker.partTimes.slice(-8);
            if (recentParts.length >= 3) {
                const avgPartSpeed = recentParts.reduce((sum, part) => sum + part.speed, 0) / recentParts.length;
                
                avgPartSpeedHistory.push(avgPartSpeed);
                if (avgPartSpeedHistory.length > 5) avgPartSpeedHistory.shift();
                
                const smoothedPartSpeed = avgPartSpeedHistory.reduce((a, b) => a + b, 0) / avgPartSpeedHistory.length;
                const realThroughputMbps = recentParts.reduce((sum, part) => sum + (part.speed * 8), 0);
                const currentThroughput = realThroughputMbps;
                
                // 🎯 PEAK PERFORMANCE DETECTION: Lock in sweet spot when hitting good performance
                if (currentThroughput >= FIBER_PROFILE.peakDetectionThreshold && !peakPerformanceDetected && recentParts.length >= 6) {
                    peakPerformanceDetected = true;
                    optimalParallel = context.maxParallel;
                    peakTimestamp = Date.now();
                    initialPeakThroughput = currentThroughput;
                    lastProgress = Date.now(); // Reset progress timer
                    console.log(`🎯 FIBER PEAK DETECTED: ${currentThroughput.toFixed(0)} Mbps sustained at ${context.maxParallel} parallel - locking sweet spot`);
                }
                
                // 🔒 REINFORCEMENT LOCK-IN: Lock performance after sustained high throughput
                if (peakPerformanceDetected && peakResetState === 'stable' && currentThroughput > FIBER_PROFILE.peakDetectionThreshold) {
                    strongPerformanceSamples++;
                    if (strongPerformanceSamples >= FIBER_PROFILE.reinforcementSampleCount && !lockedPerformance) {
                        lockedPerformance = true;
                        peakResetState = 'locked';
                        console.log(`🔒 FIBER PERFORMANCE REINFORCED: ${strongPerformanceSamples} strong samples — maintaining optimal parallel (${optimalParallel})`);
                    }
                }
                
                // 🕒 SMART PEAK DECAY: Enhanced with hysteresis for FIBER
                if (peakPerformanceDetected && peakTimestamp && initialPeakThroughput) {
                    const timeSincePeak = Date.now() - peakTimestamp;
                    
                    // Weighted Moving Average for currentThroughput
                    throughputSmoothingHistory.push(currentThroughput);
                    if (throughputSmoothingHistory.length > 5) throughputSmoothingHistory.shift();
                    
                    const weights = [0.4, 0.3, 0.15, 0.1, 0.05];
                    let weightedSum = 0, totalWeight = 0;
                    for (let i = 0; i < throughputSmoothingHistory.length; i++) {
                        const weight = weights[i] || 0.05;
                        weightedSum += throughputSmoothingHistory[throughputSmoothingHistory.length - 1 - i] * weight;
                        totalWeight += weight;
                    }
                    const averageThroughput = weightedSum / totalWeight;
                    
                    // Hysteresis Band with Two Thresholds
                    const dropThreshold = 0.70 * initialPeakThroughput;    // 70% - reset threshold
                    const recoveryThreshold = 0.80 * initialPeakThroughput; // 80% - maintain threshold
                    const warningThreshold = 0.75 * initialPeakThroughput;  // 75% - warning threshold
                    
                    // State machine for hysteresis
                    if (averageThroughput < dropThreshold) {
                        peakResetState = 'dropping';
                    } else if (averageThroughput > recoveryThreshold) {
                        peakResetState = 'stable';
                        strongPerformanceSamples++;
                    } else if (averageThroughput < warningThreshold && peakResetState === 'stable') {
                        peakResetState = 'warning';
                        strongPerformanceSamples = 0;
                    }
                    
                    // Performance warnings
                    if (peakResetState === 'warning' && timeSincePeak > 30000) {
                        console.log(`📉 FIBER PERFORMANCE WARNING: Throughput degrading to ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak)`);
                    }
                    
                    // Peak Reinforcement
                    if (averageThroughput > 0.85 * initialPeakThroughput && timeSincePeak > 45000 && strongPerformanceSamples >= 3) {
                        peakTimestamp = Date.now() - 20000; // Reset timer to 20s ago
                        strongPerformanceSamples = 0;
                        console.log(`🚀 FIBER PEAK REINFORCEMENT: ${averageThroughput.toFixed(0)} Mbps - extending sweet spot protection`);
                    }
                    
                    // Enhanced reset logic with hysteresis
                    if (timeSincePeak > 90000) { // 90s for FIBER
                        if (peakResetState === 'dropping') {
                            if (now - lastScaleDown > FIBER_PROFILE.scaleDownCooldown) {
                                context.maxParallel = Math.max(context.maxParallel - FIBER_PROFILE.throttleAmount, FIBER_PROFILE.minParallel);
                                console.warn(`⚠️ FIBER: Reducing parallel to ${context.maxParallel} due to sustained drop`);
                                lastScaleDown = now;
                                peakPerformanceDetected = false;
                                lockedPerformance = false;
                                strongPerformanceSamples = 0;
                                peakResetState = 'stable';
                                throughputSmoothingHistory = [];
                                performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                            }
                        } else {
                            const statusEmoji = peakResetState === 'stable' ? '🔒' : '⚠️';
                            const statusText = peakResetState === 'stable' ? 'STRONG' : 'MONITORING';
                            console.log(`${statusEmoji} FIBER SWEET SPOT ${statusText}: ${averageThroughput.toFixed(0)} Mbps - keeping protection`);
                        }
                    }
                }
                
                // THRASHING PROTECTION
                peakThroughputHistory.push(currentThroughput);
                if (peakThroughputHistory.length > 10) peakThroughputHistory.shift();
                
                if (peakPerformanceDetected && peakThroughputHistory.length >= 5) {
                    const recentAvg = peakThroughputHistory.slice(-5).reduce((a, b) => a + b, 0) / 5;
                    const peakValue = Math.max(...peakThroughputHistory);
                    
                    if (recentAvg < peakValue * 0.85 && context.maxParallel > optimalParallel) {
                        optimalParallel = Math.max(optimalParallel - 1, FIBER_PROFILE.parallel);
                        console.log(`📉 FIBER PERFORMANCE DECAY: Lowering optimal to ${optimalParallel}`);
                    }
                }
                
                // 🎯 FIBER ADAPTIVE RAMP-UP LOGIC
                const now = Date.now();
                let shouldAdjust = false;
                let newParallel = context.maxParallel;
                let adjustmentReason = '';
                
                // FIBER-specific thresholds
                const rampUpThreshold = FIBER_PROFILE.rampUpThreshold;   // 2.7 - Quicker scaling under stable conditions
                const rampDownThreshold = FIBER_PROFILE.rampDownThreshold; // 1.2 - Wide tolerance for high-speed residential
                const minParallel = FIBER_PROFILE.minParallel;
                
                // Track sustained low performance
                if (smoothedPartSpeed < rampDownThreshold) {
                    lowSpeedSamples++;
                } else {
                    lowSpeedSamples = 0;
                }
                
                // Ramp UP logic
                if (smoothedPartSpeed > rampUpThreshold && context.maxParallel < strategy.maxParallelCap) {
                    if (peakPerformanceDetected && context.maxParallel >= optimalParallel) {
                        console.log(`🔒 FIBER SWEET SPOT PROTECTION: Not ramping beyond ${optimalParallel} parallel`);
                    } else if (now - lastScaleTime < FIBER_PROFILE.scaleUpCooldown) {
                        console.log(`⏱️ FIBER SCALE COOLDOWN: ${((FIBER_PROFILE.scaleUpCooldown - (now - lastScaleTime)) / 1000).toFixed(0)}s remaining`);
                    } else {
                        newParallel = Math.min(context.maxParallel + (peakPerformanceDetected ? 1 : 2), strategy.maxParallelCap);
                        shouldAdjust = true;
                        adjustmentReason = `FIBER RAMP UP: ${smoothedPartSpeed.toFixed(1)} MB/s per part > ${rampUpThreshold} MB/s threshold`;
                        lowSpeedSamples = 0;
                        lastScaleTime = now;
                    }
                }
                // Ramp DOWN logic (but not if locked)
                else if (lowSpeedSamples >= FIBER_PROFILE.lowSpeedSampleThreshold && 
                         context.maxParallel > FIBER_PROFILE.minParallel && 
                         (now - lastScaleDown >= FIBER_PROFILE.scaleDownCooldown) &&
                         !lockedPerformance) { // Don't ramp down if performance is locked
                    newParallel = Math.max(context.maxParallel - 2, FIBER_PROFILE.minParallel);
                    shouldAdjust = true;
                    adjustmentReason = `FIBER SUSTAINED LOW: ${smoothedPartSpeed.toFixed(1)} MB/s per part < ${rampDownThreshold} MB/s for ${lowSpeedSamples} samples`;
                    lastScaleDown = now;
                    lowSpeedSamples = 0;
                }
                
                // Apply adjustment with throttling
                if (shouldAdjust && (now - lastParallelAdjustment >= 5000)) {
                    console.log(`🔄 FIBER ADAPTIVE ADJUSTMENT: ${adjustmentReason} → ${newParallel} parallel (was ${context.maxParallel})`);
                    
                    context.maxParallel = newParallel;
                    lastParallelAdjustment = now;
                    
                    parallelAdjustmentHistory.push({
                        timestamp: now,
                        from: context.maxParallel,
                        to: newParallel,
                        reason: adjustmentReason,
                        partSpeed: smoothedPartSpeed
                    });
                    
                    // Update performance tracker
                    performanceTracker.updateStrategy(strategy.partSize, newParallel, Math.ceil(context.file.size / strategy.partSize));
                }
                
                // 🧟 ZOMBIE PART KILLER: Kill slow parts that are dragging performance
                if (performanceTracker.partTimes && performanceTracker.partTimes.length > 0) {
                    performanceTracker.partTimes.forEach(part => {
                        if (part.speed < FIBER_PROFILE.minPartSpeed && (now - part.timestamp) > FIBER_PROFILE.minPartTimeout) {
                            console.warn(`🧟 FIBER ZOMBIE KILLER: Part ${part.partNumber} too slow (${part.speed.toFixed(2)} MB/s < ${FIBER_PROFILE.minPartSpeed} MB/s for ${((now - part.timestamp)/1000).toFixed(1)}s)`);
                            // Note: Actual part killing would need to be implemented in the main upload logic
                        }
                    });
                }
                
                // 🛑 NO-PROGRESS WATCHDOG: Detect stalled uploads
                const timeSinceProgress = now - lastProgress;
                if (timeSinceProgress > FIBER_PROFILE.noProgressTimeout) {
                    console.error(`🛑 FIBER NO-PROGRESS DETECTED: ${(timeSinceProgress/1000).toFixed(1)}s since last progress — triggering soft restart or throttle`);
                    if (context.maxParallel > FIBER_PROFILE.minParallel) {
                        context.maxParallel = Math.max(context.maxParallel - 2, FIBER_PROFILE.minParallel);
                        console.log(`🔄 FIBER STALL RECOVERY: Reduced to ${context.maxParallel} parallel`);
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                    lastProgress = now; // Reset timer
                }
                
                // 🚨 EMERGENCY RESET: If throughput falls below emergency threshold
                if (currentThroughput < FIBER_PROFILE.emergencyResetThreshold) {
                    emergencyResetCounter++;
                    if (emergencyResetCounter >= 3) {
                        console.error(`🚨 FIBER EMERGENCY RESET: Throughput ${currentThroughput.toFixed(1)} Mbps < ${FIBER_PROFILE.emergencyResetThreshold} Mbps for 3 cycles`);
                        // Reset all performance locks and states
                        peakPerformanceDetected = false;
                        lockedPerformance = false;
                        peakResetState = 'stable';
                        strongPerformanceSamples = 0;
                        emergencyResetCounter = 0;
                        context.maxParallel = FIBER_PROFILE.parallel; // Reset to default
                        console.log(`🔄 FIBER STRATEGY RESET: Back to ${FIBER_PROFILE.parallel} parallel, unlocked performance`);
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                } else {
                    emergencyResetCounter = 0; // Reset counter if performance is good
                    if (recentParts.length > 0) {
                        lastProgress = now; // Update progress timer when parts are completing
                    }
                }
                
                // 🚨 THROTTLED NETWORK AUTO-FALLBACK
                const elapsedMinutes = (Date.now() - context.uploadStartTime) / 60000;
                const overallSpeed = (context.totalUploaded / 1024 / 1024) / ((Date.now() - context.uploadStartTime) / 1000);
                
                const realExpectedSpeed = 6.3; // Target 50+ Mbps = 6.3 MB/s
                
                if (elapsedMinutes > 0.5 && overallSpeed < (realExpectedSpeed * 0.4)) {
                    console.log(`🚨 FIBER THROTTLED NETWORK DETECTED: ${overallSpeed.toFixed(1)} MB/s << expected ${realExpectedSpeed.toFixed(1)} MB/s`);
                    
                    if (strategy.partSize < 40 * 1024 * 1024) {
                        strategy.partSize = Math.min(strategy.partSize + 5 * 1024 * 1024, 50 * 1024 * 1024);
                        const newMaxCap = Math.max(strategy.maxParallelCap * 0.7, 8);
                        context.maxParallel = Math.min(context.maxParallel, newMaxCap);
                        console.log(`🔄 FIBER FALLBACK MODE: ${(strategy.partSize/1024/1024).toFixed(0)}MB parts, ${context.maxParallel} parallel`);
                        
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                }
            }
        } catch (error) {
            console.warn('FIBER adaptive monitoring failed:', error.message);
        }
    }, 3000); // Adaptive monitor every 3 seconds
    
    return monitorInterval;
}

// Export for use in main upload logic
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FIBER_PROFILE,
        createFiberUploadStrategy,
        createFiberAdaptiveMonitor
    };
} 