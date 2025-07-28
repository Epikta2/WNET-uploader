// 🏢 ENTERPRISE PROFILE - Data centers, business, studios (500+ Mbps)
// Optimized for: High-end business connections, data centers, professional studios
// Settings: 100MB parts, 16 parallel, maximum throughput

const ENTERPRISE_PROFILE = {
    name: 'ENTERPRISE',
    tier: 'ENTERPRISE',
    
    // Core Performance - enterprise-grade (50-150 Mbps)
    partSize: 40 * 1024 * 1024, // 40MB parts - optimized for stable business-class connections
    parallel: 6, // Moderate parallel count for consistent throughput
    maxCap: 10, // Maximum parallel cap - aggressive scale-up
    minParallel: 4, // Minimum parallel for enterprise stability
    targetSpeed: 100, // Target 75-120 Mbps range (ENTERPRISE tier)
    
    // Adaptive Ramp Logic
    rampUpThreshold: 4.0, // Conservative ramp-up for enterprise stability
    rampDownThreshold: 1.2, // Relaxed threshold for high-speed connections
    backpressureThreshold: 30.0, // 30 Mbps backpressure threshold
    
    // Timing & Control
    staggerDelay: 75, // 50-75ms stagger delay for enterprise
    
    warmupCount: 20, // High warm-up for enterprise
    scaleUpCooldown: 12000, // 12s cooldown between scale-ups
    scaleDownCooldown: 45000, // 45s cooldown for scale-downs (enterprise stability)
    lowSpeedSampleThreshold: 5, // Require 5 samples before scaling down
    
    // Degradation Recovery
    degradationThreshold: 0.5, // 50% degradation threshold
    throttleAmount: 2, // Moderate throttling
    
    // Sweet Spot Protection
    enableSweetSpotProtection: true,
    peakDetectionThreshold: 100, // Mbps threshold for peak detection (realistic for enterprise)
    sweetSpotProtectionDuration: 60000, // 60s protection period
    
    // Stall Protection
    minPartSpeed: 0.5, // MB/s - below this is considered slow for enterprise
    minPartTimeout: 20000, // ms - kill slow parts after 20s (longer for enterprise)
    noProgressTimeout: 50000, // ms - no parts complete = stalled (longer for enterprise)
    
    // Reinforcement
    reinforcementSampleCount: 5, // Strong performance samples to lock strategy (more conservative)
    emergencyResetThreshold: 15, // Mbps - emergency reset threshold (higher for enterprise)
    
    // 🚀 ENTERPRISE-specific staging configuration (IMMEDIATE SATURATION)
    stagingConfig: {
        immediateFullCapacity: true, // Skip staging - launch at full capacity immediately
        initialBatch: 6, // Launch optimal 6 parts immediately
        preflightParts: 0, // No preflight needed
        preflightTimeoutMs: 0, // No timeout needed
        skipStaging: true, // Bypass all staging logic
        maxParallelImmediate: true, // Use maxParallel from the start
        aggressiveStart: true, // Aggressive start for enterprise connections
        timingInterval: 1500 // 1.5s monitoring for enterprise feedback
    },
    
    description: 'Stable business-class connections (50-150 Mbps) — 40MB parts, immediate saturation'
};

// ENTERPRISE-specific upload logic - IMMEDIATE SATURATION
function createEnterpriseUploadStrategy(connectionInfo) {
    console.log(`🏢 ENTERPRISE PROFILE ACTIVATED: ${(connectionInfo.bandwidth * 8).toFixed(1)} Mbps detected`);
    console.log(`⚡ ENTERPRISE IMMEDIATE SATURATION: Launching at maximum settings from start`);
    
    const strategy = {
        partSize: ENTERPRISE_PROFILE.partSize,
        maxParallel: ENTERPRISE_PROFILE.parallel,
        maxParallelCap: ENTERPRISE_PROFILE.maxCap,
        profile: ENTERPRISE_PROFILE,
        immediateFullCapacity: true, // Flag for staging logic to skip ramp-up
        skipGradualRampUp: true, // No gradual scaling
        launchAllPartsImmediately: true // Launch all parts at once
    };
    
    console.log(`🚨 ENTERPRISE OPTIMIZED: 40MB parts + ${ENTERPRISE_PROFILE.parallel} parallel + IMMEDIATE saturation`);
    
    return strategy;
}

// ENTERPRISE-specific adaptive monitoring with complete logic from index.html
function createEnterpriseAdaptiveMonitor(strategy, performanceTracker, context) {
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
            console.log('ENTERPRISE adaptive monitor stopping - upload cancelled or inactive');
            clearInterval(monitorInterval);
            return;
        }
        
        // Allow monitoring even when activeUploads is temporarily 0 (between parts)
        if (context.activeUploads === 0 && performanceTracker.partTimes.length === 0) {
            // Only stop if no parts have been processed yet
            return;
        }
        
        try {
            const recentParts = performanceTracker.partTimes.slice(-12); // Larger sample for enterprise
            if (recentParts.length >= 4) {
                const avgPartSpeed = recentParts.reduce((sum, part) => sum + part.speed, 0) / recentParts.length;
                
                avgPartSpeedHistory.push(avgPartSpeed);
                if (avgPartSpeedHistory.length > 6) avgPartSpeedHistory.shift(); // Longer history for enterprise
                
                const smoothedPartSpeed = avgPartSpeedHistory.reduce((a, b) => a + b, 0) / avgPartSpeedHistory.length;
                const realThroughputMbps = recentParts.reduce((sum, part) => sum + (part.speed * 8), 0);
                const currentThroughput = realThroughputMbps;
                
                // 🎯 PEAK PERFORMANCE DETECTION: Lock in sweet spot when hitting enterprise performance
                if (currentThroughput >= ENTERPRISE_PROFILE.peakDetectionThreshold && !peakPerformanceDetected && recentParts.length >= 6) {
                    peakPerformanceDetected = true;
                    optimalParallel = context.maxParallel;
                    peakTimestamp = Date.now();
                    initialPeakThroughput = currentThroughput;
                    lastProgress = Date.now(); // Reset progress timer
                    console.log(`🎯 ENTERPRISE PEAK DETECTED: ${currentThroughput.toFixed(0)} Mbps sustained at ${context.maxParallel} parallel - locking sweet spot`);
                }
                
                // 🔒 REINFORCEMENT LOCK-IN: Lock performance after sustained high throughput
                if (peakPerformanceDetected && peakResetState === 'stable' && currentThroughput > ENTERPRISE_PROFILE.peakDetectionThreshold) {
                    strongPerformanceSamples++;
                    if (strongPerformanceSamples >= ENTERPRISE_PROFILE.reinforcementSampleCount && !lockedPerformance) {
                        lockedPerformance = true;
                        peakResetState = 'locked';
                        console.log(`🔒 ENTERPRISE PERFORMANCE REINFORCED: ${strongPerformanceSamples} strong samples — maintaining optimal parallel (${optimalParallel})`);
                    }
                }
                
                // 🕒 SMART PEAK DECAY: Enhanced with hysteresis for ENTERPRISE
                if (peakPerformanceDetected && peakTimestamp && initialPeakThroughput) {
                    const timeSincePeak = Date.now() - peakTimestamp;
                    
                    // Weighted Moving Average for currentThroughput
                    throughputSmoothingHistory.push(currentThroughput);
                    if (throughputSmoothingHistory.length > 6) throughputSmoothingHistory.shift(); // Longer for enterprise
                    
                    const weights = [0.4, 0.25, 0.15, 0.1, 0.05, 0.05];
                    let weightedSum = 0, totalWeight = 0;
                    for (let i = 0; i < throughputSmoothingHistory.length; i++) {
                        const weight = weights[i] || 0.05;
                        weightedSum += throughputSmoothingHistory[throughputSmoothingHistory.length - 1 - i] * weight;
                        totalWeight += weight;
                    }
                    const averageThroughput = weightedSum / totalWeight;
                    
                    // Hysteresis Band with Two Thresholds (enterprise-tuned)
                    const dropThreshold = 0.65 * initialPeakThroughput;    // 65% - reset threshold (more conservative)
                    const recoveryThreshold = 0.75 * initialPeakThroughput; // 75% - maintain threshold
                    const warningThreshold = 0.70 * initialPeakThroughput;  // 70% - warning threshold
                    
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
                    if (peakResetState === 'warning' && timeSincePeak > 40000) {
                        console.log(`📉 ENTERPRISE PERFORMANCE WARNING: Throughput degrading to ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak)`);
                    }
                    
                    // Peak Reinforcement
                    if (averageThroughput > 0.8 * initialPeakThroughput && timeSincePeak > 60000 && strongPerformanceSamples >= 4) {
                        peakTimestamp = Date.now() - 30000; // Reset timer to 30s ago
                        strongPerformanceSamples = 0;
                        console.log(`🚀 ENTERPRISE PEAK REINFORCEMENT: ${averageThroughput.toFixed(0)} Mbps - extending sweet spot protection`);
                    }
                    
                    // Peak Reinforcement
                    if (averageThroughput >= recoveryThreshold && strongPerformanceSamples >= 3) {
                        // Reset peak timestamp to extend sweet spot protection
                        peakTimestamp = Date.now();
                        console.log(`✅ ENTERPRISE PEAK REINFORCED: ${averageThroughput.toFixed(0)} Mbps - maintaining sweet spot`);
                    }

                    // Drop peak detection if performance has degraded for too long
                    if (peakResetState === 'dropping' && timeSincePeak > ENTERPRISE_PROFILE.sweetSpotProtectionDuration) {
                        peakPerformanceDetected = false;
                        initialPeakThroughput = null;
                        peakTimestamp = null;
                        strongPerformanceSamples = 0;
                        lockedPerformance = false;
                        console.log('🧯 ENTERPRISE PEAK LOST: Performance dropped below sustained threshold - re-evaluating');
                    }
                    
                    // Enhanced reset logic with hysteresis
                    if (timeSincePeak > 120000) { // 120s for ENTERPRISE
                        if (peakResetState === 'dropping') {
                            if (Date.now() - lastScaleDown > ENTERPRISE_PROFILE.scaleDownCooldown) {
                                context.maxParallel = Math.max(context.maxParallel - ENTERPRISE_PROFILE.throttleAmount, ENTERPRISE_PROFILE.minParallel);
                                console.warn(`⚠️ ENTERPRISE: Reducing parallel to ${context.maxParallel} due to sustained drop`);
                                lastScaleDown = Date.now();
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
                            console.log(`${statusEmoji} ENTERPRISE SWEET SPOT ${statusText}: ${averageThroughput.toFixed(0)} Mbps - keeping protection`);
                        }
                    }
                }
                
                // THRASHING PROTECTION
                peakThroughputHistory.push(currentThroughput);
                if (peakThroughputHistory.length > 12) peakThroughputHistory.shift(); // Longer for enterprise
                
                if (peakPerformanceDetected && peakThroughputHistory.length >= 6) {
                    const recentAvg = peakThroughputHistory.slice(-6).reduce((a, b) => a + b, 0) / 6;
                    const peakValue = Math.max(...peakThroughputHistory);
                    
                    if (recentAvg < peakValue * 0.8 && context.maxParallel > optimalParallel) {
                        optimalParallel = Math.max(optimalParallel - 1, ENTERPRISE_PROFILE.parallel);
                        console.log(`📉 ENTERPRISE PERFORMANCE DECAY: Lowering optimal to ${optimalParallel}`);
                    }
                }
                
                // Adaptive scaling logic (only if not in sweet spot)
                if (!peakPerformanceDetected || !lockedPerformance) {
                    const now = Date.now();
                    const avgSpeedPerPart = smoothedPartSpeed;

                    if (avgSpeedPerPart >= ENTERPRISE_PROFILE.rampUpThreshold && context.maxParallel < strategy.maxParallelCap && Date.now() - lastParallelAdjustment > ENTERPRISE_PROFILE.scaleUpCooldown) {
                        context.maxParallel++;
                        lastParallelAdjustment = Date.now();
                        console.log(`📈 ENTERPRISE SCALE UP: Increased parallel to ${context.maxParallel}`);
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    } else if (avgSpeedPerPart <= ENTERPRISE_PROFILE.rampDownThreshold) {
                        lowSpeedSamples++;
                        if (lowSpeedSamples >= ENTERPRISE_PROFILE.lowSpeedSampleThreshold && Date.now() - lastScaleDown > ENTERPRISE_PROFILE.scaleDownCooldown) {
                            context.maxParallel = Math.max(context.maxParallel - ENTERPRISE_PROFILE.throttleAmount, ENTERPRISE_PROFILE.minParallel);
                            lowSpeedSamples = 0;
                                            lastScaleDown = Date.now();
                lastParallelAdjustment = Date.now();
                            console.log(`📉 ENTERPRISE SCALE DOWN: Reduced parallel to ${context.maxParallel}`);
                            performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                        }
                    } else {
                        lowSpeedSamples = 0; // Reset if speed is healthy
                    }
                }
                
                // 🧟 ZOMBIE PART KILLER: Kill slow parts that are dragging performance
                if (performanceTracker.partTimes && performanceTracker.partTimes.length > 0) {
                    performanceTracker.partTimes.forEach(part => {
                        if (part.speed < ENTERPRISE_PROFILE.minPartSpeed && (Date.now() - part.timestamp) > ENTERPRISE_PROFILE.minPartTimeout) {
                            console.warn(`🧟 ENTERPRISE ZOMBIE KILLER: Part ${part.partNumber} too slow (${part.speed.toFixed(2)} MB/s < ${ENTERPRISE_PROFILE.minPartSpeed} MB/s for ${((Date.now() - part.timestamp)/1000).toFixed(1)}s)`);
                            // Note: Actual part killing would need to be implemented in the main upload logic
                        }
                    });
                }
                
                // 🛑 NO-PROGRESS WATCHDOG: Detect stalled uploads
                const timeSinceProgress = Date.now() - lastProgress;
                if (timeSinceProgress > ENTERPRISE_PROFILE.noProgressTimeout) {
                    console.error(`🛑 ENTERPRISE NO-PROGRESS DETECTED: ${(timeSinceProgress/1000).toFixed(1)}s since last progress — triggering soft restart or throttle`);
                    if (context.maxParallel > ENTERPRISE_PROFILE.minParallel) {
                        context.maxParallel = Math.max(context.maxParallel - 2, ENTERPRISE_PROFILE.minParallel);
                        console.log(`🔄 ENTERPRISE STALL RECOVERY: Reduced to ${context.maxParallel} parallel`);
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                    lastProgress = Date.now(); // Reset timer
                }
                
                // 🚨 EMERGENCY RESET: If throughput falls below emergency threshold
                if (currentThroughput < ENTERPRISE_PROFILE.emergencyResetThreshold) {
                    emergencyResetCounter++;
                    if (emergencyResetCounter >= 3) {
                        console.error(`🚨 ENTERPRISE EMERGENCY RESET: Throughput ${currentThroughput.toFixed(1)} Mbps < ${ENTERPRISE_PROFILE.emergencyResetThreshold} Mbps for 3 cycles`);
                        // Reset all performance locks and states
                        peakPerformanceDetected = false;
                        lockedPerformance = false;
                        peakResetState = 'stable';
                        strongPerformanceSamples = 0;
                        emergencyResetCounter = 0;
                        context.maxParallel = ENTERPRISE_PROFILE.parallel; // Reset to default
                        console.log(`🔄 ENTERPRISE STRATEGY RESET: Back to ${ENTERPRISE_PROFILE.parallel} parallel, unlocked performance`);
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                } else {
                    emergencyResetCounter = 0; // Reset counter if performance is good
                    if (recentParts.length > 0) {
                        lastProgress = Date.now(); // Update progress timer when parts are completing
                    }
                }
                
                // 🚨 THROTTLED NETWORK AUTO-FALLBACK
                const elapsedMinutes = (Date.now() - context.uploadStartTime) / 60000;
                const overallSpeed = (context.totalUploaded / 1024 / 1024) / ((Date.now() - context.uploadStartTime) / 1000);
                
                const realExpectedSpeed = 6.25; // Target 50-150 Mbps = 6.25 MB/s (enterprise realistic)
                
                if (elapsedMinutes > 0.5 && overallSpeed < (realExpectedSpeed * 0.4)) {
                    console.log(`🚨 ENTERPRISE THROTTLED NETWORK DETECTED: ${overallSpeed.toFixed(1)} MB/s << expected ${realExpectedSpeed.toFixed(1)} MB/s`);
                    
                    if (strategy.partSize < 40 * 1024 * 1024) {
                        strategy.partSize = Math.min(strategy.partSize + 5 * 1024 * 1024, 50 * 1024 * 1024);
                        const newMaxCap = Math.max(strategy.maxParallelCap * 0.8, 6);
                        context.maxParallel = Math.min(context.maxParallel, newMaxCap);
                        console.log(`🔄 ENTERPRISE FALLBACK MODE: ${(strategy.partSize/1024/1024).toFixed(0)}MB parts, ${context.maxParallel} parallel`);
                        
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                }
            }
        } catch (err) {
            console.error('🚨 ENTERPRISE adaptive monitor error:', err);
        }
    }, 2500); // Every 2.5 seconds for enterprise monitoring
    
    return monitorInterval;
}

// Export for use in main upload logic
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ENTERPRISE_PROFILE,
        createEnterpriseUploadStrategy,
        createEnterpriseAdaptiveMonitor
    };
} 