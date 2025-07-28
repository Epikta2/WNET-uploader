// ⚡ GIGABIT PROFILE - True gigabit connections (800-950+ Mbps)
// Optimized for: Data centers, enterprise fiber, sustained 800-950 Mbps capacity
// Settings: 250MB parts, 16 parallel, best-in-class performance

const GIGABIT_PROFILE = {
    name: 'GIGABIT',
    tier: 'GIGABIT',
    
    // ⚡ Performance - Gigabit optimization: Larger parts, optimal parallelism, immediate saturation
    partSize: 250 * 1024 * 1024, // 250MB parts - Fewer TCP handshakes, better throughput efficiency
    parallel: 16, // 16 parallel - Pushes saturation near or beyond 900 Mbps
    maxCap: 20, // Limited scaling headroom - assumes highly reliable infrastructure
    minParallel: 14, // High minimum for gigabit stability
    targetSpeed: 850, // Target 850+ Mbps sustained (gigabit-class)
    
    // 📈 Adaptive thresholds (optimized for 250MB parts - GIGABIT TUNED)
    rampUpThreshold: 15.0, // 15.0 MB/s for gigabit ramp-up (250MB parts × 16 parallel)
    rampDownThreshold: 8.0, // 8.0 MB/s conservative ramp-down for gigabit
    backpressureThreshold: 5.0, // 5.0 MB/s per part minimum (16 parts × 5.0 = 80+ MB/s minimum)
    
    // 🔄 Warm-up / cooldown (gigabit-speed tuning)
    warmupCount: 24, // Higher warm-up for 250MB parts
    scaleUpCooldown: 500, // 0.5s ramp interval (faster for gigabit)
    scaleDownCooldown: 8000, // 8s freeze after lock (faster response for gigabit)
    lowSpeedSampleThreshold: 2, // Only 2 samples needed (faster response)
    rampStep: 2, // Increase by 2 parts per interval (conservative for gigabit)
    
    // 🧠 Degradation / protection (gigabit-tuned)
    degradationThreshold: 0.3, // 30% degradation threshold (more sensitive)
    throttleAmount: 1, // Gentle throttling for reliable infrastructure
    
    // 🔐 Sweet spot protection (EARLY LOCK for gigabit performance)
    enableSweetSpotProtection: true,
    peakDetectionThreshold: 500, // 500 Mbps to lock immediately at gigabit speeds
    sweetSpotProtectionDuration: 3000, // 3s freeze after lock (very fast response)
    strongSampleThresholdMbps: 25.0, // >25.0 MB/s per part (gigabit threshold)
    minSamplesToLock: 2, // Lock after only 2 strong samples (early lock-in)
    
    // ⚠️ Failsafe and stall detection (OPTIMIZED for gigabit)
    minPartSpeed: 2.0, // MB/s — below this is considered "zombie" for gigabit
    minPartTimeout: 20000, // ms — kill slow parts after 20s (faster for large parts)
    noProgressTimeout: 60000, // ms — 60s timeout (faster for gigabit stability)
    
    // 🔁 Reinforcement lock-in (gigabit tuning)
    reinforcementSampleCount: 2, // Only 2 samples needed (immediate gigabit lock)
    emergencyResetThreshold: 100, // 100 Mbps emergency threshold (higher for GIGABIT)
    
    // ⚡ GIGABIT-specific staging configuration (IMMEDIATE FULL CAPACITY)
    stagingConfig: {
        immediateFullCapacity: true, // Skip all staging - launch at full capacity immediately
        initialBatch: 16, // Launch optimal 16 parts immediately (GIGABIT PERFORMANCE)
        preflightParts: 0, // No preflight needed - trust GIGABIT profile parameters
        preflightTimeoutMs: 0, // No timeout needed
        skipStaging: true, // Bypass all staging logic
        maxParallelImmediate: true, // Use maxParallel from the start
        aggressiveStart: true, // Maximum aggression for gigabit connections
        timingInterval: 250 // 0.25s monitoring for immediate gigabit feedback
    },
    
    description: 'Sustained 800-950 Mbps capacity, best-in-class — 250MB parts, 16 parallel, immediate gigabit performance'
};

// GIGABIT-specific upload logic - IMMEDIATE FULL CAPACITY
function createGigabitUploadStrategy(connectionInfo) {
    console.log(`⚡ GIGABIT PROFILE ACTIVATED: ${(connectionInfo.bandwidth * 8).toFixed(1)} Mbps detected`);
    console.log(`🚀 IMMEDIATE GIGABIT SATURATION: Launching at maximum settings from start`);
    
    // GIGABIT: Trust the profile and launch at full capacity immediately
    const strategy = {
        partSize: GIGABIT_PROFILE.partSize,
        maxParallel: GIGABIT_PROFILE.parallel, // Start at 16 immediately
        maxParallelCap: GIGABIT_PROFILE.maxCap,
        profile: GIGABIT_PROFILE,
        immediateFullCapacity: true, // Flag for staging logic to skip ramp-up
        skipGradualRampUp: true, // No gradual scaling
        launchAllPartsImmediately: true // Launch all parts at once
    };
    
    console.log(`🚨 GIGABIT OPTIMIZED: 250MB parts + ${GIGABIT_PROFILE.parallel} parallel + IMMEDIATE 800+ Mbps performance`);
    
    return strategy;
}

// GIGABIT-specific adaptive monitoring - IMMEDIATE LOCK MODE
function createGigabitAdaptiveMonitor(strategy, performanceTracker, context) {
    let avgPartSpeedHistory = [];
    let parallelAdjustmentHistory = [];
    let lastParallelAdjustment = 0;
    let lastScaleDown = 0;
    let lowSpeedSamples = 0;
    let peakPerformanceDetected = true; // START LOCKED - assume peak from maximum launch
    let optimalParallel = strategy.maxParallel; // Lock at maximum parallel from start
    let peakTimestamp = Date.now(); // Set peak time to now (immediate)
    let initialPeakThroughput = 600; // Assume 600 Mbps target from start (will update)
    let lastScaleTime = 0;
    let peakThroughputHistory = [];
    let throughputSmoothingHistory = [];
    let peakResetState = 'locked'; // START IN LOCKED STATE
    let strongPerformanceSamples = 3; // Start with strong samples (immediate lock)
    let lastProgress = Date.now();
    let emergencyResetCounter = 0;
    let lockedPerformance = true; // START LOCKED - no ramp-ups needed (immediate high-speed style)
    
    console.log(`⚡ GIGABIT OPTIMIZED: Starting LOCKED at ${optimalParallel} parallel × 250MB parts for immediate 600+ Mbps performance`);
    
    const monitorInterval = setInterval(async () => {
        if (!context.isUploadActive || context.isUploadCancelled) {
            console.log('GIGABIT adaptive monitor stopping - upload cancelled or inactive');
            clearInterval(monitorInterval);
            return;
        }
        
        // Allow monitoring even when activeUploads is temporarily 0 (between parts)
        if (context.activeUploads === 0 && performanceTracker.partTimes.length === 0) {
            // Only stop if no parts have been processed yet
            return;
        }
        
        try {
            const recentParts = performanceTracker.partTimes.slice(-10);
            if (recentParts.length >= 3) {
                const avgPartSpeed = recentParts.reduce((sum, part) => sum + part.speed, 0) / recentParts.length;
                const avgPartSpeedMbps = avgPartSpeed * 8; // Convert to Mbps for ChatGPT logic
                
                avgPartSpeedHistory.push(avgPartSpeed);
                if (avgPartSpeedHistory.length > 5) avgPartSpeedHistory.shift();
                
                const smoothedPartSpeed = avgPartSpeedHistory.reduce((a, b) => a + b, 0) / avgPartSpeedHistory.length;
                const realThroughputMbps = recentParts.reduce((sum, part) => sum + (part.speed * 8), 0);
                const currentThroughput = realThroughputMbps;
                
                // 🎯 PEAK PERFORMANCE UPDATE: Update peak throughput with real data (already locked)
                if (currentThroughput >= GIGABIT_PROFILE.peakDetectionThreshold && 
                    avgPartSpeedMbps >= GIGABIT_PROFILE.strongSampleThresholdMbps && 
                    peakPerformanceDetected && 
                    currentThroughput > initialPeakThroughput) {
                    // Update peak with better performance data
                    initialPeakThroughput = currentThroughput;
                    peakTimestamp = Date.now();
                    lastProgress = Date.now();
                    strongPerformanceSamples = GIGABIT_PROFILE.reinforcementSampleCount;
                    console.log(`⚡ GIGABIT PEAK UPDATED: ${currentThroughput.toFixed(0)} Mbps sustained at ${context.maxParallel} parallel (${avgPartSpeedMbps.toFixed(1)} MB/s per part) - updating locked performance`);
                }
                
                // 🔒 REINFORCEMENT LOCK-IN: Lock performance after sustained high throughput
                if (peakPerformanceDetected && peakResetState === 'stable' && currentThroughput > 400) { // Lock at 400+ Mbps for gigabit
                    strongPerformanceSamples++;
                    if (strongPerformanceSamples >= GIGABIT_PROFILE.reinforcementSampleCount && !lockedPerformance) {
                        lockedPerformance = true;
                        peakResetState = 'locked';
                        console.log(`🔒 GIGABIT PEAK PERFORMANCE REINFORCED: ${strongPerformanceSamples} strong samples at ${currentThroughput.toFixed(0)} Mbps — disabling ramp-downs`);
                    }
                }
                
                // 🕒 NEXT-LEVEL SMART PEAK DECAY: Enhanced with hysteresis, smoothing, reinforcement, and warnings
                if (peakPerformanceDetected && peakTimestamp && initialPeakThroughput) {
                    const timeSincePeak = Date.now() - peakTimestamp;
                    
                    // 📊 ENHANCEMENT 2: Weighted Moving Average for currentThroughput
                    throughputSmoothingHistory.push(currentThroughput);
                    if (throughputSmoothingHistory.length > 5) throughputSmoothingHistory.shift(); // Keep last 5 readings
                    
                    // Calculate weighted average (more recent samples have higher weight)
                    const weights = [0.4, 0.3, 0.15, 0.1, 0.05]; // Most recent gets 40% weight
                    let weightedSum = 0, totalWeight = 0;
                    for (let i = 0; i < throughputSmoothingHistory.length; i++) {
                        const weight = weights[i] || 0.05;
                        weightedSum += throughputSmoothingHistory[throughputSmoothingHistory.length - 1 - i] * weight;
                        totalWeight += weight;
                    }
                    const averageThroughput = weightedSum / totalWeight;
                    
                    // 🎯 ENHANCEMENT 1: Hysteresis Band with Two Thresholds
                    const dropThreshold = 0.75 * initialPeakThroughput;    // 75% - reset threshold
                    const recoveryThreshold = 0.85 * initialPeakThroughput; // 85% - maintain threshold
                    const warningThreshold = 0.80 * initialPeakThroughput;  // 80% - warning threshold
                    
                    // 🔄 State machine for hysteresis
                    if (averageThroughput < dropThreshold) {
                        peakResetState = 'dropping';
                    } else if (averageThroughput > recoveryThreshold) {
                        peakResetState = 'stable';
                        strongPerformanceSamples++; // Count strong samples for reinforcement
                    } else if (averageThroughput < warningThreshold && peakResetState === 'stable') {
                        peakResetState = 'warning';
                        strongPerformanceSamples = 0; // Reset strong sample counter
                    }
                    
                    // 🚨 ENHANCEMENT 4: Tier Decay Indicator
                    if (peakResetState === 'warning' && timeSincePeak > 20000) { // 20s warning for gigabit
                        console.log(`📉 GIGABIT PERFORMANCE WARNING: Throughput degrading to ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak) — possible tier down soon`);
                    }
                    
                    // 🎯 ENHANCEMENT 3: Peak Reinforcement
                    if (averageThroughput > 0.9 * initialPeakThroughput && timeSincePeak > 30000 && strongPerformanceSamples >= 2) {
                        // Extend protection for another 30s when consistently strong
                        peakTimestamp = Date.now() - 15000; // Reset timer to 15s ago (extends by 15s)
                        strongPerformanceSamples = 0; // Reset counter
                        console.log(`🚀 GIGABIT PEAK REINFORCEMENT: ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak) - extending sweet spot protection by 15s`);
                    }
                    
                    // 🕒 Enhanced reset logic with hysteresis (GIGABIT OPTIMIZED)
                    if (timeSincePeak > 60000) { // 60s for gigabit networks (faster response)
                        if (peakResetState === 'dropping') {
                            // Only reset when in dropping state (below 75% threshold)
                            peakPerformanceDetected = false;
                            peakTimestamp = null;
                            initialPeakThroughput = null;
                            peakResetState = 'stable';
                            strongPerformanceSamples = 0;
                            throughputSmoothingHistory = [];
                            console.log(`🕒 GIGABIT SMART RESET: Performance dropped to ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak) - resetting sweet spot`);
                        } else {
                            // Performance still acceptable - maintain protection
                            const statusEmoji = peakResetState === 'stable' ? '🔒' : '⚠️';
                            const statusText = peakResetState === 'stable' ? 'STRONG' : 'MONITORING';
                            console.log(`${statusEmoji} GIGABIT SWEET SPOT ${statusText}: ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak) - keeping protection`);
                        }
                    }
                }
                
                // 📊 THRASHING PROTECTION: Track performance consistency
                peakThroughputHistory.push(currentThroughput);
                if (peakThroughputHistory.length > 10) peakThroughputHistory.shift(); // Keep last 10 readings
                
                if (peakPerformanceDetected && peakThroughputHistory.length >= 5) {
                    const recentAvg = peakThroughputHistory.slice(-5).reduce((a, b) => a + b, 0) / 5;
                    const peakValue = Math.max(...peakThroughputHistory);
                    
                    // If consistently underperforming (< 90% of peak), consider lowering optimal
                    if (recentAvg < peakValue * 0.9 && context.maxParallel > optimalParallel) {
                        optimalParallel = Math.max(optimalParallel - 1, GIGABIT_PROFILE.parallel);
                        console.log(`📉 GIGABIT PERFORMANCE DECAY: Lowering optimal to ${optimalParallel} (recent: ${recentAvg.toFixed(0)} < 90% of peak: ${peakValue.toFixed(0)})`);
                    }
                }
                
                // ⚡ GIGABIT ADAPTIVE RAMP-UP LOGIC: Based on actual part performance
                const now = Date.now();
                let shouldAdjust = false;
                let newParallel = context.maxParallel;
                let adjustmentReason = '';
                
                // GIGABIT-specific thresholds (OPTIMIZED: 250MB parts)
                const rampUpThreshold = 25.0;   // Higher threshold: >25.0 MB/s per part for ramp-up (250MB parts)
                const rampDownThreshold = 15.0; // Don't downscale unless <15 MB/s per part
                const minParallel = GIGABIT_PROFILE.minParallel;
                
                // Enhanced: Track sustained low performance, but don't downscale if ≥600 Mbps total
                if (smoothedPartSpeed < rampDownThreshold && currentThroughput < 600) {
                    lowSpeedSamples++;
                } else {
                    lowSpeedSamples = 0; // Reset if speed recovers or total ≥600 Mbps
                }
                
                // 🔒 ADAPTIVE LOCK MODE: Allow scaling when locked if performance degrades significantly
                if (lockedPerformance) {
                    // Check if performance has degraded significantly while locked
                    if (currentThroughput < (initialPeakThroughput * 0.6)) {
                        console.log(`🚨 GIGABIT PERFORMANCE DEGRADATION: ${currentThroughput.toFixed(0)} Mbps < 60% of peak ${initialPeakThroughput.toFixed(0)} Mbps - unlocking for adaptation`);
                        lockedPerformance = false;
                        peakPerformanceDetected = false;
                        peakResetState = 'stable';
                        strongPerformanceSamples = 0;
                    } else if (smoothedPartSpeed > rampUpThreshold && context.maxParallel < strategy.maxParallelCap) {
                        console.log(`🔒 GIGABIT LOCKED MODE: Performance locked at ${optimalParallel} parallel - skipping ramp-up (${smoothedPartSpeed.toFixed(1)} MB/s per part)`);
                    }
                } else {
                    // Traditional ramp-up logic (only if not locked)
                    if (smoothedPartSpeed > rampUpThreshold && context.maxParallel < strategy.maxParallelCap) {
                        if (peakPerformanceDetected && context.maxParallel >= optimalParallel) {
                            // Don't ramp up beyond the sweet spot
                            console.log(`🔒 GIGABIT SWEET SPOT PROTECTION: Not ramping beyond ${optimalParallel} parallel (current: ${context.maxParallel})`);
                        } else if (now - lastScaleTime < GIGABIT_PROFILE.scaleUpCooldown) {
                            console.log(`⏱️ GIGABIT SCALE COOLDOWN: ${((GIGABIT_PROFILE.scaleUpCooldown - (now - lastScaleTime)) / 1000).toFixed(1)}s remaining`);
                        } else {
                            newParallel = Math.min(context.maxParallel + GIGABIT_PROFILE.rampStep, strategy.maxParallelCap);
                            shouldAdjust = true;
                            adjustmentReason = `GIGABIT RAMP UP: ${smoothedPartSpeed.toFixed(1)} MB/s per part > ${rampUpThreshold} MB/s threshold (targeting 800+ Mbps)`;
                            lowSpeedSamples = 0;
                            lastScaleTime = now;
                        }
                    }
                }
                
                // GIGABIT: Ramp DOWN when performance is consistently poor
                if (lowSpeedSamples >= GIGABIT_PROFILE.lowSpeedSampleThreshold && 
                   context.maxParallel > minParallel && 
                   (now - lastScaleDown >= GIGABIT_PROFILE.scaleDownCooldown)) {
                    // Allow ramp down even when locked if performance is very poor
                    if (!lockedPerformance || currentThroughput < (initialPeakThroughput * 0.5)) {
                        newParallel = Math.max(context.maxParallel - GIGABIT_PROFILE.throttleAmount, minParallel); // Gentle reduction
                        shouldAdjust = true;
                        adjustmentReason = `GIGABIT SUSTAINED LOW: ${smoothedPartSpeed.toFixed(1)} MB/s per part < ${rampDownThreshold} MB/s for ${lowSpeedSamples} samples`;
                        lastScaleDown = now; // Update cooldown timer
                        lowSpeedSamples = 0; // Reset counter after action
                        
                        // If we're locked and scaling down, unlock for further adaptation
                        if (lockedPerformance) {
                            console.log(`🔓 GIGABIT UNLOCKING: Poor performance detected - allowing adaptive scaling`);
                            lockedPerformance = false;
                            peakPerformanceDetected = false;
                        }
                    }
                }
                
                // Apply adjustment with throttling (minimum 2s between changes for gigabit)
                if (shouldAdjust && (now - lastParallelAdjustment >= 2000)) {
                    console.log(`🔄 GIGABIT ADAPTIVE ADJUSTMENT: ${adjustmentReason} → ${newParallel} parallel (was ${context.maxParallel})`);
                    
                    context.maxParallel = newParallel;
                    lastParallelAdjustment = now;
                    
                    // Track adjustment history
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
                
                // 💀 ZOMBIE PART KILLER: Kill slow parts that are dragging performance
                if (performanceTracker.partTimes && performanceTracker.partTimes.length > 0) {
                    performanceTracker.partTimes.forEach(part => {
                        if (part.speed < GIGABIT_PROFILE.minPartSpeed && (now - part.timestamp) > GIGABIT_PROFILE.minPartTimeout) {
                            console.warn(`💀 GIGABIT ZOMBIE KILLER: Part ${part.partNumber} too slow (${part.speed.toFixed(2)} MB/s < ${GIGABIT_PROFILE.minPartSpeed} MB/s for ${((now - part.timestamp)/1000).toFixed(1)}s)`);
                            // Note: Actual part killing would need to be implemented in the main upload logic
                        }
                    });
                }
                
                // 🛑 NO-PROGRESS WATCHDOG: Detect stalled uploads (OPTIMIZED for gigabit)
                const timeSinceProgress = now - lastProgress;
                if (timeSinceProgress > GIGABIT_PROFILE.noProgressTimeout) {
                    console.error(`🛑 GIGABIT NO-PROGRESS DETECTED: ${(timeSinceProgress/1000).toFixed(1)}s since last progress — reducing parallel`);
                    if (context.maxParallel > minParallel && !lockedPerformance) {
                        context.maxParallel = Math.max(context.maxParallel - GIGABIT_PROFILE.throttleAmount, minParallel); // Gentle reduction
                        console.log(`🔄 GIGABIT STALL RECOVERY: Reduced to ${context.maxParallel} parallel`);
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    } else if (lockedPerformance) {
                        console.log(`🔒 GIGABIT LOCKED MODE: Ignoring stall detection - performance is locked`);
                    }
                    lastProgress = now; // Reset timer
                }
                
                // 📊 CONTINUOUS PROGRESS TRACKING: Update progress when parts are active
                if (context.activeUploads > 0 || recentParts.length > 0) {
                    lastProgress = now; // Keep updating progress as long as parts are active
                }
                
                // 🚨 EMERGENCY RESET: If throughput falls below emergency threshold
                if (currentThroughput < GIGABIT_PROFILE.emergencyResetThreshold) {
                    emergencyResetCounter++;
                    if (emergencyResetCounter >= 3) {
                        console.error(`🚨 GIGABIT EMERGENCY RESET: Throughput ${currentThroughput.toFixed(1)} Mbps < ${GIGABIT_PROFILE.emergencyResetThreshold} Mbps for 3 cycles`);
                        // Reset all performance locks and states
                        peakPerformanceDetected = false;
                        lockedPerformance = false;
                        peakResetState = 'stable';
                        strongPerformanceSamples = 0;
                        emergencyResetCounter = 0;
                        context.maxParallel = GIGABIT_PROFILE.parallel; // Reset to default
                        console.log(`🔄 GIGABIT STRATEGY RESET: Back to ${GIGABIT_PROFILE.parallel} parallel, unlocked performance`);
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                } else {
                    emergencyResetCounter = 0; // Reset counter if performance is good
                    if (recentParts.length > 0) {
                        lastProgress = now; // Update progress timer when parts are completing
                    }
                }
                
                // 🚨 THROTTLED NETWORK AUTO-FALLBACK: Detect underperforming connections
                const elapsedMinutes = (Date.now() - context.uploadStartTime) / 60000;
                const overallSpeed = (context.totalUploaded / 1024 / 1024) / ((Date.now() - context.uploadStartTime) / 1000); // MB/s
                
                // GIGABIT expected speed (aggressive target)
                const realExpectedSpeed = 100.0; // Target 800+ Mbps = 100 MB/s
                
                // If running for >30s and significantly underperforming, switch to conservative mode
                if (elapsedMinutes > 0.5 && overallSpeed < (realExpectedSpeed * 0.3)) {
                    console.log(`🚨 GIGABIT THROTTLED NETWORK DETECTED: ${overallSpeed.toFixed(1)} MB/s << expected ${realExpectedSpeed.toFixed(1)} MB/s`);
                    
                    // Switch to more conservative settings for throttled/unstable networks
                    if (strategy.partSize > 150 * 1024 * 1024) {
                        strategy.partSize = Math.max(strategy.partSize - 50 * 1024 * 1024, 150 * 1024 * 1024); // Smaller parts
                        const newMaxCap = Math.max(strategy.maxParallelCap * 0.8, 12); // Reduce max cap
                        context.maxParallel = Math.min(context.maxParallel, newMaxCap);
                        console.log(`🔄 GIGABIT FALLBACK MODE: ${(strategy.partSize/1024/1024).toFixed(0)}MB parts, ${context.maxParallel} parallel (throttled network)`);
                        
                        // Update performance tracker
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                }
            }
        } catch (error) {
            console.warn('GIGABIT adaptive monitoring failed:', error.message);
        }
    }, 250); // Monitor every 0.25 seconds (immediate feedback for gigabit mode)
    
    return monitorInterval;
}

// Export for use in main upload logic
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GIGABIT_PROFILE,
        createGigabitUploadStrategy,
        createGigabitAdaptiveMonitor
    };
} 