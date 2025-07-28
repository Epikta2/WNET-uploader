// 🐌 DSL PROFILE - Rural, older connections (< 50 Mbps)
// Optimized for: Throttled networks, rural connections, older infrastructure
// Settings: 12MB parts, 5 parallel, aggressive optimization for sub-20min uploads

const DSL_PROFILE = {
    name: 'DSL',
    tier: 'DSL',
    
    // Core Performance - rural/throttled (< 50 Mbps)
    partSize: 8 * 1024 * 1024, // 8MB parts - optimized for rural/legacy DSL
    parallel: 2, // Very conservative parallel count
    maxCap: 2, // Maximum parallel cap - avoid retries & timeouts
    minParallel: 1, // Minimum parallel for DSL stability (fixed from 3)
    targetSpeed: 25, // Target < 50 Mbps range
    
    // Adaptive Ramp Logic
    rampUpThreshold: 1.5, // Conservative for 0-50 Mbps
    rampDownThreshold: 0.8, // Better slowdown detection
    backpressureThreshold: 30.0, // 30 Mbps backpressure threshold
    
    // Timing & Control
    staggerDelay: 200, // 200ms stagger delay for DSL
    warmupCount: 8, // Conservative warm-up
    scaleUpCooldown: 12000, // 12s cooldown between scale-ups
    scaleDownCooldown: 20000, // 20s cooldown for scale-downs
    lowSpeedSampleThreshold: 3, // Require 3 samples before scaling down
    
    // Degradation Recovery
    degradationThreshold: 0.5, // 50% degradation threshold
    throttleAmount: 1, // Gentle throttling
    
    // Sweet Spot Protection
    enableSweetSpotProtection: true,
    peakDetectionThreshold: 30, // Mbps threshold for peak detection
    sweetSpotProtectionDuration: 25000, // 25s protection period
    
    // Stall Protection
    minPartSpeed: 0.15, // MB/s - below this is considered slow for DSL
    minPartTimeout: 25000, // ms - kill slow parts after 25s (longer for DSL)
    noProgressTimeout: 60000, // ms - no parts complete = stalled (longer for DSL)
    
    // Reinforcement
    reinforcementSampleCount: 3, // Strong performance samples to lock strategy (conservative)
    emergencyResetThreshold: 5, // Mbps - emergency reset threshold (low for DSL)
    
    // 🚀 DSL-specific staging configuration (IMMEDIATE SATURATION)
    stagingConfig: {
        immediateFullCapacity: true, // Skip staging - launch at full capacity immediately
        initialBatch: 2, // Launch optimal 2 parts immediately
        preflightParts: 0, // No preflight needed
        preflightTimeoutMs: 0, // No timeout needed
        skipStaging: true, // Bypass all staging logic
        maxParallelImmediate: true, // Use maxParallel from the start
        aggressiveStart: true, // Aggressive start for DSL connections
        timingInterval: 3000 // 3s monitoring for DSL feedback
    },
    
    description: 'Rural, older connections, throttled networks — 8MB parts, immediate saturation'
};

// DSL-specific upload logic - IMMEDIATE SATURATION
function createDslUploadStrategy(connectionInfo) {
    console.log(`🐌 DSL PROFILE ACTIVATED: ${(connectionInfo.bandwidth * 8).toFixed(1)} Mbps detected`);
    console.log(`⚡ DSL IMMEDIATE SATURATION: Launching at maximum settings from start`);
    
    const strategy = {
        partSize: DSL_PROFILE.partSize,
        maxParallel: DSL_PROFILE.parallel,
        maxParallelCap: DSL_PROFILE.maxCap,
        profile: DSL_PROFILE,
        immediateFullCapacity: true, // Flag for staging logic to skip ramp-up
        skipGradualRampUp: true, // No gradual scaling
        launchAllPartsImmediately: true // Launch all parts at once
    };
    
    console.log(`🚨 DSL OPTIMIZED: 8MB parts + ${DSL_PROFILE.parallel} parallel + IMMEDIATE saturation`);
    
    return strategy;
}

// DSL-specific adaptive monitoring with complete logic from index.html
function createDslAdaptiveMonitor(strategy, performanceTracker, context) {
    let avgPartSpeedHistory = [];
    let parallelAdjustmentHistory = [];
    let lastParallelAdjustment = 0;
    let lastScaleDown = 0;
    let lowSpeedSamples = 0;
    let peakPerformanceDetected = false;
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
            console.log('DSL adaptive monitor stopping - upload cancelled or inactive');
            clearInterval(monitorInterval);
            return;
        }
        
        // Allow monitoring even when activeUploads is temporarily 0 (between parts)
        if (context.activeUploads === 0 && performanceTracker.partTimes.length === 0) {
            // Only stop if no parts have been processed yet
            return;
        }
        
        try {
            const recentParts = performanceTracker.partTimes.slice(-5);
            if (recentParts.length >= 2) { // Lower threshold for DSL
                const avgPartSpeed = recentParts.reduce((sum, part) => sum + part.speed, 0) / recentParts.length;
                
                avgPartSpeedHistory.push(avgPartSpeed);
                if (avgPartSpeedHistory.length > 4) avgPartSpeedHistory.shift(); // Shorter history for DSL
                
                const smoothedPartSpeed = avgPartSpeedHistory.reduce((a, b) => a + b, 0) / avgPartSpeedHistory.length;
                const realThroughputMbps = recentParts.reduce((sum, part) => sum + (part.speed * 8), 0);
                const currentThroughput = realThroughputMbps;
                
                // 🎯 PEAK PERFORMANCE DETECTION: Lock in sweet spot when hitting good performance for DSL
                if (currentThroughput >= DSL_PROFILE.peakDetectionThreshold && !peakPerformanceDetected && recentParts.length >= 3) {
                    peakPerformanceDetected = true;
                    optimalParallel = context.maxParallel;
                    peakTimestamp = Date.now();
                    initialPeakThroughput = currentThroughput;
                    lastProgress = Date.now(); // Reset progress timer
                    console.log(`🎯 DSL PEAK DETECTED: ${currentThroughput.toFixed(0)} Mbps sustained at ${context.maxParallel} parallel - locking sweet spot`);
                }
                
                // 🔒 REINFORCEMENT LOCK-IN: Lock performance after sustained high throughput
                if (peakPerformanceDetected && peakResetState === 'stable' && currentThroughput > DSL_PROFILE.peakDetectionThreshold) {
                    strongPerformanceSamples++;
                    if (strongPerformanceSamples >= DSL_PROFILE.reinforcementSampleCount && !lockedPerformance) {
                        lockedPerformance = true;
                        peakResetState = 'locked';
                        console.log(`🔒 DSL PERFORMANCE REINFORCED: ${strongPerformanceSamples} strong samples — maintaining optimal parallel (${optimalParallel})`);
                    }
                }
                
                // 🕒 SMART PEAK DECAY: Enhanced with hysteresis for DSL (conservative)
                if (peakPerformanceDetected && peakTimestamp && initialPeakThroughput) {
                    const timeSincePeak = Date.now() - peakTimestamp;
                    
                    // Weighted Moving Average for currentThroughput (shorter for DSL)
                    throughputSmoothingHistory.push(currentThroughput);
                    if (throughputSmoothingHistory.length > 4) throughputSmoothingHistory.shift(); // Shorter for DSL
                    
                    const weights = [0.5, 0.3, 0.15, 0.05]; // More weight on recent for DSL
                    let weightedSum = 0, totalWeight = 0;
                    for (let i = 0; i < throughputSmoothingHistory.length; i++) {
                        const weight = weights[i] || 0.05;
                        weightedSum += throughputSmoothingHistory[throughputSmoothingHistory.length - 1 - i] * weight;
                        totalWeight += weight;
                    }
                    const averageThroughput = weightedSum / totalWeight;
                    
                    // Hysteresis Band with Two Thresholds (DSL-tuned - more conservative)
                    const dropThreshold = 0.60 * initialPeakThroughput;    // 60% - reset threshold (conservative)
                    const recoveryThreshold = 0.70 * initialPeakThroughput; // 70% - maintain threshold
                    const warningThreshold = 0.65 * initialPeakThroughput;  // 65% - warning threshold
                    
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
                    
                    // Performance warnings (shorter for DSL)
                    if (peakResetState === 'warning' && timeSincePeak > 20000) {
                        console.log(`📉 DSL PERFORMANCE WARNING: Throughput degrading to ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak)`);
                    }
                    
                    // Peak Reinforcement (shorter for DSL)
                    if (averageThroughput > 0.75 * initialPeakThroughput && timeSincePeak > 30000 && strongPerformanceSamples >= 2) {
                        peakTimestamp = Date.now() - 10000; // Reset timer to 10s ago
                        strongPerformanceSamples = 0;
                        console.log(`🚀 DSL PEAK REINFORCEMENT: ${averageThroughput.toFixed(0)} Mbps - extending sweet spot protection`);
                    }
                    
                    // Peak Reinforcement
                    if (averageThroughput >= recoveryThreshold && strongPerformanceSamples >= 2) {
                        // Reset peak timestamp to extend sweet spot protection
                        peakTimestamp = Date.now();
                        console.log(`✅ DSL PEAK REINFORCED: ${averageThroughput.toFixed(0)} Mbps - maintaining sweet spot`);
                    }

                    // Drop peak detection if performance has degraded for too long
                    if (peakResetState === 'dropping' && timeSincePeak > DSL_PROFILE.sweetSpotProtectionDuration) {
                        peakPerformanceDetected = false;
                        initialPeakThroughput = null;
                        peakTimestamp = null;
                        strongPerformanceSamples = 0;
                        lockedPerformance = false;
                        console.log('🧯 DSL PEAK LOST: Performance dropped below sustained threshold - re-evaluating');
                    }
                    
                    // Enhanced reset logic with hysteresis (shorter for DSL)
                    if (timeSincePeak > 45000) { // 45s for DSL
                        if (peakResetState === 'dropping') {
                            const now = Date.now();
                            if (now - lastScaleDown > DSL_PROFILE.scaleDownCooldown) {
                                context.maxParallel = Math.max(context.maxParallel - DSL_PROFILE.throttleAmount, DSL_PROFILE.minParallel);
                                console.warn(`⚠️ DSL: Reducing parallel to ${context.maxParallel} due to sustained drop`);
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
                            console.log(`${statusEmoji} DSL SWEET SPOT ${statusText}: ${averageThroughput.toFixed(0)} Mbps - keeping protection`);
                        }
                    }
                }
                
                // THRASHING PROTECTION (smaller for DSL)
                peakThroughputHistory.push(currentThroughput);
                if (peakThroughputHistory.length > 6) peakThroughputHistory.shift(); // Smaller for DSL
                
                if (peakPerformanceDetected && peakThroughputHistory.length >= 3) {
                    const recentAvg = peakThroughputHistory.slice(-3).reduce((a, b) => a + b, 0) / 3;
                    const peakValue = Math.max(...peakThroughputHistory);
                    
                    if (recentAvg < peakValue * 0.75 && context.maxParallel > optimalParallel) {
                        optimalParallel = Math.max(optimalParallel - 1, DSL_PROFILE.parallel);
                        console.log(`📉 DSL PERFORMANCE DECAY: Lowering optimal to ${optimalParallel}`);
                    }
                }
                
                // Adaptive scaling logic (only if not in sweet spot)
                if (!peakPerformanceDetected || !lockedPerformance) {
                    const now = Date.now();
                    const avgSpeedPerPart = smoothedPartSpeed;

                    if (avgSpeedPerPart >= DSL_PROFILE.rampUpThreshold && context.maxParallel < strategy.maxParallelCap && now - lastParallelAdjustment > DSL_PROFILE.scaleUpCooldown) {
                        context.maxParallel++;
                        lastParallelAdjustment = now;
                        console.log(`📈 DSL SCALE UP: Increased parallel to ${context.maxParallel}`);
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    } else if (avgSpeedPerPart <= DSL_PROFILE.rampDownThreshold) {
                        lowSpeedSamples++;
                        if (lowSpeedSamples >= DSL_PROFILE.lowSpeedSampleThreshold && now - lastScaleDown > DSL_PROFILE.scaleDownCooldown) {
                            context.maxParallel = Math.max(context.maxParallel - DSL_PROFILE.throttleAmount, DSL_PROFILE.minParallel);
                            lowSpeedSamples = 0;
                            lastScaleDown = now;
                            lastParallelAdjustment = now;
                            console.log(`📉 DSL SCALE DOWN: Reduced parallel to ${context.maxParallel}`);
                            performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                        }
                    } else {
                        lowSpeedSamples = 0; // Reset if speed is healthy
                    }
                }
                
                // 🧟 ZOMBIE PART KILLER: Kill slow parts that are dragging performance
                const now = Date.now(); // Add missing variable declaration
                if (performanceTracker.partTimes && performanceTracker.partTimes.length > 0) {
                    performanceTracker.partTimes.forEach(part => {
                        if (part.speed < DSL_PROFILE.minPartSpeed && (now - part.timestamp) > DSL_PROFILE.minPartTimeout) {
                            console.warn(`🧟 DSL ZOMBIE KILLER: Part ${part.partNumber} too slow (${part.speed.toFixed(2)} MB/s < ${DSL_PROFILE.minPartSpeed} MB/s for ${((now - part.timestamp)/1000).toFixed(1)}s)`);
                            // Note: Actual part killing would need to be implemented in the main upload logic
                        }
                    });
                }
                
                // 🛑 NO-PROGRESS WATCHDOG: Detect stalled uploads
                const timeSinceProgress = now - lastProgress;
                if (timeSinceProgress > DSL_PROFILE.noProgressTimeout) {
                    console.error(`🛑 DSL NO-PROGRESS DETECTED: ${(timeSinceProgress/1000).toFixed(1)}s since last progress — triggering soft restart or throttle`);
                    if (context.maxParallel > DSL_PROFILE.minParallel) {
                        context.maxParallel = Math.max(context.maxParallel - 1, DSL_PROFILE.minParallel);
                        console.log(`🔄 DSL STALL RECOVERY: Reduced to ${context.maxParallel} parallel`);
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                    lastProgress = now; // Reset timer
                }
                
                // 🚨 EMERGENCY RESET: If throughput falls below emergency threshold
                if (currentThroughput < DSL_PROFILE.emergencyResetThreshold) {
                    emergencyResetCounter++;
                    if (emergencyResetCounter >= 3) {
                        console.error(`🚨 DSL EMERGENCY RESET: Throughput ${currentThroughput.toFixed(1)} Mbps < ${DSL_PROFILE.emergencyResetThreshold} Mbps for 3 cycles`);
                        // Reset all performance locks and states
                        peakPerformanceDetected = false;
                        lockedPerformance = false;
                        peakResetState = 'stable';
                        strongPerformanceSamples = 0;
                        emergencyResetCounter = 0;
                        context.maxParallel = DSL_PROFILE.parallel; // Reset to default
                        console.log(`🔄 DSL STRATEGY RESET: Back to ${DSL_PROFILE.parallel} parallel, unlocked performance`);
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                } else {
                    emergencyResetCounter = 0; // Reset counter if performance is good
                    if (recentParts.length > 0) {
                        lastProgress = now; // Update progress timer when parts are completing
                    }
                }
                
                // 🚨 THROTTLED NETWORK AUTO-FALLBACK (DSL-specific)
                const elapsedMinutes = (Date.now() - context.uploadStartTime) / 60000;
                const overallSpeed = (context.totalUploaded / 1024 / 1024) / ((Date.now() - context.uploadStartTime) / 1000);
                
                const realExpectedSpeed = 3.1; // Target 25 Mbps = 3.1 MB/s for DSL
                
                if (elapsedMinutes > 1.0 && overallSpeed < (realExpectedSpeed * 0.5)) { // More time for DSL
                    console.log(`🚨 DSL THROTTLED NETWORK DETECTED: ${overallSpeed.toFixed(1)} MB/s << expected ${realExpectedSpeed.toFixed(1)} MB/s`);
                    
                    if (strategy.partSize > 3 * 1024 * 1024) { // Don't go below 3MB for DSL
                        strategy.partSize = Math.max(strategy.partSize - 1 * 1024 * 1024, 3 * 1024 * 1024);
                        const newMaxCap = Math.max(strategy.maxParallelCap * 0.6, 1);
                        context.maxParallel = Math.min(context.maxParallel, newMaxCap);
                        console.log(`🔄 DSL FALLBACK MODE: ${(strategy.partSize/1024/1024).toFixed(0)}MB parts, ${context.maxParallel} parallel`);
                        
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                }
            }
        } catch (err) {
            console.error('🚨 DSL adaptive monitor error:', err);
        }
    }, 4000); // Every 4 seconds for DSL monitoring (slower for stability)
    
    return monitorInterval;
}

// Export for use in main upload logic
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DSL_PROFILE,
        createDslUploadStrategy,
        createDslAdaptiveMonitor
    };
} 