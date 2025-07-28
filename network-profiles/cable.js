// 📡 CABLE PROFILE - Most suburban broadband (50-100 Mbps)
// Optimized for: Basic fiber, suburban broadband
// Settings: 25MB parts, 8 parallel, balanced for 50-100 Mbps

const CABLE_PROFILE = {
    name: 'CABLE',
    tier: 'CABLE',
    partSize: 20 * 1024 * 1024, // 20MB parts - optimized for shared-bandwidth environments
    parallel: 6, // AGGRESSIVE parallel count for CABLE speeds
    maxCap: 10, // MAXIMUM cap - push cable limits
    targetSpeed: 75, // Target 8-75 Mbps range (CABLE tier)
    
    // Adaptive thresholds
    rampUpThreshold: 2.0, // Balanced for 10-50 Mbps
    rampDownThreshold: 1.2, // Better slowdown detection
    
    // Backpressure settings
    backpressureThreshold: 30.0, // 30 Mbps backpressure threshold (original setting)
    
    // Stagger settings
    staggerDelay: 100, // 100ms stagger delay for cable
    
    // Connection settings
    warmupCount: 12, // Moderate warm-up
    minParallel: 2, // Reasonable minimum for cable
    
    // Performance tuning
    degradationThreshold: 0.6, // 60% degradation threshold
    throttleAmount: 1, // MINIMAL throttling - push performance
    
    // Timing settings
    scaleUpCooldown: 8000, // 8s cooldown between scale-ups
    scaleDownCooldown: 25000, // 25s cooldown for scale-downs
    lowSpeedSampleThreshold: 4, // Require 4 samples before scaling down
    
    // Sweet spot protection
    enableSweetSpotProtection: true,
    peakDetectionThreshold: 60, // Mbps threshold for peak detection
    sweetSpotProtectionDuration: 30000, // 30s protection period
    
    // 🚀 CABLE-specific staging configuration (IMMEDIATE SATURATION)
    stagingConfig: {
        immediateFullCapacity: true, // Skip staging - launch at full capacity immediately
        initialBatch: 4, // Launch optimal 4 parts immediately
        preflightParts: 0, // No preflight needed
        preflightTimeoutMs: 0, // No timeout needed
        skipStaging: true, // Bypass all staging logic
        maxParallelImmediate: true, // Use maxParallel from the start
        aggressiveStart: true, // Aggressive start for cable connections
        timingInterval: 2000 // 2s monitoring for cable feedback
    },
    
    description: 'Most suburban broadband, basic fiber (50-100 Mbps) — 20MB parts, immediate saturation'
};

// CABLE-specific upload logic - IMMEDIATE SATURATION
function createCableUploadStrategy(connectionInfo) {
    console.log(`📡 CABLE PROFILE ACTIVATED: ${(connectionInfo.bandwidth * 8).toFixed(1)} Mbps detected`);
    console.log(`⚡ CABLE IMMEDIATE SATURATION: Launching at maximum settings from start`);
    
    const strategy = {
        partSize: CABLE_PROFILE.partSize,
        maxParallel: CABLE_PROFILE.parallel,
        maxParallelCap: CABLE_PROFILE.maxCap,
        profile: CABLE_PROFILE,
        immediateFullCapacity: true, // Flag for staging logic to skip ramp-up
        skipGradualRampUp: true, // No gradual scaling
        launchAllPartsImmediately: true // Launch all parts at once
    };
    
    console.log(`🚨 CABLE OPTIMIZED: 20MB parts + ${CABLE_PROFILE.parallel} parallel + IMMEDIATE saturation`);
    
    return strategy;
}

// CABLE-specific adaptive monitoring with complete logic from index.html
function createCableAdaptiveMonitor(strategy, performanceTracker, context) {
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
    
    const monitorInterval = setInterval(async () => {
        if (!context.isUploadActive || context.isUploadCancelled) {
            console.log('CABLE adaptive monitor stopping - upload cancelled or inactive');
            clearInterval(monitorInterval);
            return;
        }
        
        // Allow monitoring even when activeUploads is temporarily 0 (between parts)
        if (context.activeUploads === 0 && performanceTracker.partTimes.length === 0) {
            // Only stop if no parts have been processed yet
            return;
        }
        
        try {
            const recentParts = performanceTracker.partTimes.slice(-6);
            if (recentParts.length >= 3) {
                const avgPartSpeed = recentParts.reduce((sum, part) => sum + part.speed, 0) / recentParts.length;
                
                avgPartSpeedHistory.push(avgPartSpeed);
                if (avgPartSpeedHistory.length > 5) avgPartSpeedHistory.shift();
                
                const smoothedPartSpeed = avgPartSpeedHistory.reduce((a, b) => a + b, 0) / avgPartSpeedHistory.length;
                const realThroughputMbps = recentParts.reduce((sum, part) => sum + (part.speed * 8), 0);
                const currentThroughput = realThroughputMbps;
                
                // 🎯 PEAK PERFORMANCE DETECTION: Lock in sweet spot when hitting good performance
                if (currentThroughput >= CABLE_PROFILE.peakDetectionThreshold && !peakPerformanceDetected && recentParts.length >= 4) {
                    peakPerformanceDetected = true;
                    optimalParallel = maxParallel;
                    peakTimestamp = Date.now();
                    initialPeakThroughput = currentThroughput;
                    console.log(`🎯 CABLE PEAK DETECTED: ${currentThroughput.toFixed(0)} Mbps sustained at ${maxParallel} parallel - locking sweet spot`);
                }
                
                // 🕒 SMART PEAK DECAY: Enhanced with hysteresis for CABLE
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
                    
                    // Hysteresis Band with Two Thresholds (cable-tuned)
                    const dropThreshold = 0.65 * initialPeakThroughput;    // 65% - reset threshold
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
                    if (peakResetState === 'warning' && timeSincePeak > 25000) {
                        console.log(`📉 CABLE PERFORMANCE WARNING: Throughput degrading to ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak)`);
                    }
                    
                    // Peak Reinforcement
                    if (averageThroughput > 0.8 * initialPeakThroughput && timeSincePeak > 35000 && strongPerformanceSamples >= 3) {
                        peakTimestamp = Date.now() - 15000; // Reset timer to 15s ago
                        strongPerformanceSamples = 0;
                        console.log(`🚀 CABLE PEAK REINFORCEMENT: ${averageThroughput.toFixed(0)} Mbps - extending sweet spot protection`);
                    }
                    
                    // Enhanced reset logic with hysteresis
                    if (timeSincePeak > 60000) { // 60s for CABLE
                        if (peakResetState === 'dropping') {
                            peakPerformanceDetected = false;
                            peakTimestamp = null;
                            initialPeakThroughput = null;
                            peakResetState = 'stable';
                            strongPerformanceSamples = 0;
                            throughputSmoothingHistory = [];
                            console.log(`🕒 CABLE SMART RESET: Performance dropped to ${averageThroughput.toFixed(0)} Mbps - resetting sweet spot`);
                        } else {
                            const statusEmoji = peakResetState === 'stable' ? '🔒' : '⚠️';
                            const statusText = peakResetState === 'stable' ? 'STRONG' : 'MONITORING';
                            console.log(`${statusEmoji} CABLE SWEET SPOT ${statusText}: ${averageThroughput.toFixed(0)} Mbps - keeping protection`);
                        }
                    }
                }
                
                // THRASHING PROTECTION
                peakThroughputHistory.push(currentThroughput);
                if (peakThroughputHistory.length > 8) peakThroughputHistory.shift();
                
                if (peakPerformanceDetected && peakThroughputHistory.length >= 4) {
                    const recentAvg = peakThroughputHistory.slice(-4).reduce((a, b) => a + b, 0) / 4;
                    const peakValue = Math.max(...peakThroughputHistory);
                    
                    if (recentAvg < peakValue * 0.8 && maxParallel > optimalParallel) {
                        optimalParallel = Math.max(optimalParallel - 1, CABLE_PROFILE.parallel);
                        console.log(`📉 CABLE PERFORMANCE DECAY: Lowering optimal to ${optimalParallel}`);
                    }
                }
                
                // 🎯 CABLE ADAPTIVE RAMP-UP LOGIC
                const now = Date.now();
                let shouldAdjust = false;
                let newParallel = maxParallel;
                let adjustmentReason = '';
                
                // Track low speed samples
                if (smoothedPartSpeed < CABLE_PROFILE.rampDownThreshold) {
                    lowSpeedSamples++;
                } else {
                    lowSpeedSamples = 0;
                }
                
                // CABLE-specific thresholds
                const rampUpThreshold = CABLE_PROFILE.rampUpThreshold;   // 2.0 - Balanced for 50-100 Mbps
                const rampDownThreshold = CABLE_PROFILE.rampDownThreshold; // 1.2 - Better slowdown detection
                const minParallel = CABLE_PROFILE.minParallel;
                
                // Track sustained low performance
                if (smoothedPartSpeed < rampDownThreshold) {
                    lowSpeedSamples++;
                } else {
                    lowSpeedSamples = 0;
                }
                
                // Ramp UP logic
                if (smoothedPartSpeed > rampUpThreshold && maxParallel < strategy.maxParallelCap) {
                    if (peakPerformanceDetected && maxParallel >= optimalParallel) {
                        console.log(`🔒 CABLE SWEET SPOT PROTECTION: Not ramping beyond ${optimalParallel} parallel`);
                    } else if (now - lastScaleTime < CABLE_PROFILE.scaleUpCooldown) {
                        console.log(`⏱️ CABLE SCALE COOLDOWN: ${((CABLE_PROFILE.scaleUpCooldown - (now - lastScaleTime)) / 1000).toFixed(0)}s remaining`);
                    } else {
                        newParallel = Math.min(maxParallel + (peakPerformanceDetected ? 1 : 2), strategy.maxParallelCap);
                        shouldAdjust = true;
                        adjustmentReason = `CABLE RAMP UP: ${smoothedPartSpeed.toFixed(1)} MB/s per part > ${rampUpThreshold} MB/s threshold`;
                        lowSpeedSamples = 0;
                        lastScaleTime = now;
                    }
                }
                // Ramp DOWN logic
                else if (lowSpeedSamples >= CABLE_PROFILE.lowSpeedSampleThreshold && 
                         maxParallel > minParallel && 
                         (now - lastScaleDown >= CABLE_PROFILE.scaleDownCooldown)) {
                    newParallel = Math.max(maxParallel - 2, minParallel);
                    shouldAdjust = true;
                    adjustmentReason = `CABLE SUSTAINED LOW: ${smoothedPartSpeed.toFixed(1)} MB/s per part < ${rampDownThreshold} MB/s for ${lowSpeedSamples} samples`;
                    lastScaleDown = now;
                    lowSpeedSamples = 0;
                }
                
                // Apply adjustment with throttling
                if (shouldAdjust && (now - lastParallelAdjustment >= 5000)) {
                    console.log(`🔄 CABLE ADAPTIVE ADJUSTMENT: ${adjustmentReason} → ${newParallel} parallel (was ${maxParallel})`);
                    
                    maxParallel = newParallel;
                    lastParallelAdjustment = now;
                    
                    parallelAdjustmentHistory.push({
                        timestamp: now,
                        from: maxParallel,
                        to: newParallel,
                        reason: adjustmentReason,
                        partSpeed: smoothedPartSpeed
                    });
                    
                    // Update performance tracker
                    performanceTracker.updateStrategy(strategy.partSize, newParallel, Math.ceil(context.fileSize / strategy.partSize));
                }
                
                // 🚨 THROTTLED NETWORK AUTO-FALLBACK
                const elapsedMinutes = (Date.now() - context.uploadStartTime) / 60000;
                const overallSpeed = (context.totalUploaded / 1024 / 1024) / ((Date.now() - context.uploadStartTime) / 1000);
                
                const realExpectedSpeed = 9.4; // Target 75 Mbps = 9.4 MB/s
                
                if (elapsedMinutes > 0.5 && overallSpeed < (realExpectedSpeed * 0.4)) {
                    console.log(`🚨 CABLE THROTTLED NETWORK DETECTED: ${overallSpeed.toFixed(1)} MB/s << expected ${realExpectedSpeed.toFixed(1)} MB/s`);
                    
                    // Always apply throttled network adjustments
                    if (strategy.partSize <= 20 * 1024 * 1024) {
                        strategy.partSize = Math.min(strategy.partSize + 3 * 1024 * 1024, 25 * 1024 * 1024);
                    }
                    const newMaxCap = Math.max(strategy.maxParallelCap * 0.7, 2);
                    maxParallel = Math.min(maxParallel, newMaxCap);
                    console.log(`🔄 CABLE FALLBACK MODE: ${(strategy.partSize/1024/1024).toFixed(0)}MB parts, ${maxParallel} parallel`);
                    
                    performanceTracker.updateStrategy(strategy.partSize, maxParallel, Math.ceil(context.fileSize / strategy.partSize));
                }
            }
        } catch (error) {
            console.warn('CABLE adaptive monitoring failed:', error.message);
        }
    }, 3000);
    
    return monitorInterval;
}

// Export for use in main upload logic
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CABLE_PROFILE,
        createCableUploadStrategy,
        createCableAdaptiveMonitor
    };
} 