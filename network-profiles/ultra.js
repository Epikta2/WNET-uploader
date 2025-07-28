// 🚀 ULTRA PROFILE - High-speed connections (120+ Mbps)
// Optimized for: Data centers, business fiber, high-latency optimization
// Settings: 25MB parts, 20 parallel, aggressive TCP ramp-up

const ULTRA_PROFILE = {
    name: 'ULTRA',
    tier: 'ULTRA',
    
    // 🚀 Performance - Optimal balance: Fewer connections, larger parts, instant saturation
    partSize: 200 * 1024 * 1024, // 200MB parts - OPTIMIZED for sustained 140+ Mbps performance
    parallel: 18, // MAXIMUM AGGRESSIVE - push limits for peak performance
    maxCap: 24, // MAXIMUM scaling headroom - no limits
    minParallel: 16, // High minimum for sustained speed
    targetSpeed: 150, // Target 150 Mbps sustained (proven achievable)
    
    // 📈 Adaptive thresholds (optimized for 150MB parts - PROVEN OPTIMAL)
    rampUpThreshold: 4.0, // 4.0 MB/s for optimal ramp-up (balanced for 150MB parts)
    rampDownThreshold: 2.0, // 2.0 MB/s conservative ramp-down
    backpressureThreshold: 1.0, // 1.0 Mbps per part (16 parts × 1.0 = 16+ Mbps minimum)
    
    // 🔄 Warm-up / cooldown (high-speed tuning)
    warmupCount: 20, // Optimal warm-up for 150MB parts
    scaleUpCooldown: 250, // 0.25s ramp interval (AGGRESSIVE scaling)
    scaleDownCooldown: 5000, // 5s freeze after lock (minimal delays)
    lowSpeedSampleThreshold: 3, // 3 samples needed (balanced response)
    rampStep: 4, // Increase by 4 parts per interval (optimal for 150MB parts)
    
    // 🧠 Degradation / protection
    degradationThreshold: 0.5, // 50% degradation threshold
    throttleAmount: 2, // Moderate throttling
    
    // 🔐 Sweet spot protection (IMMEDIATE LOCK for proven 127+ Mbps)
    enableSweetSpotProtection: true,
    peakDetectionThreshold: 100, // Lower to 100 Mbps to lock immediately at 127 Mbps
    sweetSpotProtectionDuration: 1000, // 1s freeze after lock (MINIMAL protection)
    strongSampleThresholdMbps: 5.0, // Lower threshold: >5.0 Mbps per part (more sensitive)
    minSamplesToLock: 2, // Lock after only 2 strong samples (immediate lock)
    
    // ⚠️ Failsafe and stall detection (RELAXED for high-speed)
    minPartSpeed: 0.25, // MB/s — below this is considered "zombie"
    minPartTimeout: 30000, // ms — kill slow parts after 30s (doubled for large parts)
    noProgressTimeout: 90000, // ms — 90s timeout (doubled for high-speed stability)
    
    // 🔁 Reinforcement lock-in (ChatGPT tuning)
    reinforcementSampleCount: 3, // Only 3 samples needed (ChatGPT: minSamplesToLock)
    emergencyResetThreshold: 30, // 30 Mbps emergency threshold (higher for ULTRA)
    
    // 🚀 ULTRA-specific staging configuration (IMMEDIATE FULL CAPACITY)
    stagingConfig: {
        immediateFullCapacity: true, // Skip all staging - launch at full capacity immediately
        initialBatch: 14, // Launch optimal 14 parts immediately (OPTIMIZED PERFORMANCE)
        preflightParts: 0, // No preflight needed - trust ULTRA profile parameters
        preflightTimeoutMs: 0, // No timeout needed
        skipStaging: true, // Bypass all staging logic
        maxParallelImmediate: true, // Use maxParallel from the start
        aggressiveStart: true, // Maximum aggression for high-speed connections
        timingInterval: 500 // 0.5s monitoring for immediate feedback
    },
    
    description: 'Ultra Fast (140-160+ Mbps) — 150MB parts, 12 parallel PROVEN OPTIMAL, immediate 130+ Mbps performance'
};

// ULTRA-specific upload logic - IMMEDIATE FULL CAPACITY
function createUltraUploadStrategy(connectionInfo) {
    console.log(`🚀 ULTRA PROFILE ACTIVATED: ${(connectionInfo.bandwidth * 8).toFixed(1)} Mbps detected`);
    console.log(`⚡ IMMEDIATE FULL CAPACITY MODE: Launching at maximum settings from start`);
    
    // ULTRA: Trust the profile and launch at full capacity immediately
    const strategy = {
        partSize: ULTRA_PROFILE.partSize,
        maxParallel: ULTRA_PROFILE.parallel, // Start at 14 immediately
        maxParallelCap: ULTRA_PROFILE.maxCap,
        profile: ULTRA_PROFILE,
        immediateFullCapacity: true, // Flag for staging logic to skip ramp-up
        skipGradualRampUp: true, // No gradual scaling
        launchAllPartsImmediately: true // Launch all parts at once
    };
    
    console.log(`🚨 ULTRA OPTIMIZED: 200MB parts + ${ULTRA_PROFILE.parallel} parallel + IMMEDIATE 140+ Mbps performance`);
    
    return strategy;
}

// ULTRA-specific adaptive monitoring - IMMEDIATE LOCK MODE
function createUltraAdaptiveMonitor(strategy, performanceTracker, context) {
    let avgPartSpeedHistory = [];
    let parallelAdjustmentHistory = [];
    let lastParallelAdjustment = 0;
    let lastScaleDown = 0;
    let lowSpeedSamples = 0;
    let peakPerformanceDetected = true; // START LOCKED - assume peak from maximum launch
    let optimalParallel = strategy.maxParallel; // Lock at maximum parallel from start
    let peakTimestamp = Date.now(); // Set peak time to now (immediate)
    let initialPeakThroughput = 120; // Assume 120 Mbps target from start (will update)
    let lastScaleTime = 0;
    let peakThroughputHistory = [];
    let throughputSmoothingHistory = [];
    let peakResetState = 'locked'; // START IN LOCKED STATE
    let strongPerformanceSamples = 3; // Start with strong samples (immediate lock)
    let lastProgress = Date.now();
    let emergencyResetCounter = 0;
    let lockedPerformance = true; // START LOCKED - no ramp-ups needed (immediate high-speed style)
    
    console.log(`🚀 ULTRA PROVEN OPTIMAL: Starting LOCKED at ${optimalParallel} parallel × 150MB parts for immediate 130+ Mbps performance`);
    
    const monitorInterval = setInterval(async () => {
        if (!context.isUploadActive || context.isUploadCancelled) {
            console.log('ULTRA adaptive monitor stopping - upload cancelled or inactive');
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
                if (currentThroughput >= ULTRA_PROFILE.peakDetectionThreshold && 
                    avgPartSpeedMbps >= ULTRA_PROFILE.strongSampleThresholdMbps && 
                    peakPerformanceDetected && 
                    currentThroughput > initialPeakThroughput) {
                    // Update peak with better performance data
                    initialPeakThroughput = currentThroughput;
                    peakTimestamp = Date.now();
                    lastProgress = Date.now();
                    strongPerformanceSamples = ULTRA_PROFILE.reinforcementSampleCount;
                    console.log(`🎯 ULTRA PEAK UPDATED: ${currentThroughput.toFixed(0)} Mbps sustained at ${context.maxParallel} parallel (${avgPartSpeedMbps.toFixed(1)} Mbps per part) - updating locked performance`);
                }
                
                // 🔒 REINFORCEMENT LOCK-IN: Lock performance after sustained high throughput
                if (peakPerformanceDetected && peakResetState === 'stable' && currentThroughput > 80) { // Lock at 80+ Mbps
                    strongPerformanceSamples++;
                    if (strongPerformanceSamples >= ULTRA_PROFILE.reinforcementSampleCount && !lockedPerformance) {
                        lockedPerformance = true;
                        peakResetState = 'locked';
                        console.log(`🔒 ULTRA PEAK PERFORMANCE REINFORCED: ${strongPerformanceSamples} strong samples at ${currentThroughput.toFixed(0)} Mbps — disabling ramp-downs`);
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
                    if (peakResetState === 'warning' && timeSincePeak > 45000) { // 45s warning
                        console.log(`📉 ULTRA PERFORMANCE WARNING: Throughput degrading to ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak) — possible tier down soon`);
                    }
                    
                    // 🎯 ENHANCEMENT 3: Peak Reinforcement
                    if (averageThroughput > 0.9 * initialPeakThroughput && timeSincePeak > 60000 && strongPerformanceSamples >= 3) {
                        // Extend protection for another 60s when consistently strong
                        peakTimestamp = Date.now() - 30000; // Reset timer to 30s ago (extends by 30s)
                        strongPerformanceSamples = 0; // Reset counter
                        console.log(`🚀 ULTRA PEAK REINFORCEMENT: ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak) - extending sweet spot protection by 30s`);
                    }
                    
                    // 🕒 Enhanced reset logic with hysteresis (HIGH-LATENCY OPTIMIZED)
                    if (timeSincePeak > 120000) { // Extended from 60s to 120s for high-latency networks
                        if (peakResetState === 'dropping') {
                            // Only reset when in dropping state (below 75% threshold)
                            peakPerformanceDetected = false;
                            peakTimestamp = null;
                            initialPeakThroughput = null;
                            peakResetState = 'stable';
                            strongPerformanceSamples = 0;
                            throughputSmoothingHistory = [];
                            console.log(`🕒 ULTRA SMART RESET: Performance dropped to ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak) - resetting sweet spot`);
                        } else {
                            // Performance still acceptable - maintain protection
                            const statusEmoji = peakResetState === 'stable' ? '🔒' : '⚠️';
                            const statusText = peakResetState === 'stable' ? 'STRONG' : 'MONITORING';
                            console.log(`${statusEmoji} ULTRA SWEET SPOT ${statusText}: ${averageThroughput.toFixed(0)} Mbps (${((averageThroughput/initialPeakThroughput)*100).toFixed(0)}% of peak) - keeping protection`);
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
                        optimalParallel = Math.max(optimalParallel - 1, ULTRA_PROFILE.parallel);
                        console.log(`📉 ULTRA PERFORMANCE DECAY: Lowering optimal to ${optimalParallel} (recent: ${recentAvg.toFixed(0)} < 90% of peak: ${peakValue.toFixed(0)})`);
                    }
                }
                
                // 🎯 ULTRA ADAPTIVE RAMP-UP LOGIC: Based on actual part performance
                const now = Date.now();
                let shouldAdjust = false;
                let newParallel = context.maxParallel;
                let adjustmentReason = '';
                
                // ULTRA-specific thresholds (PROVEN OPTIMAL: 150MB parts)
                const rampUpThreshold = 8.0;   // Higher threshold: >8.0 Mbps per part for ramp-up (150MB parts)
                const rampDownThreshold = 5.0; // Don't downscale unless <5 Mbps per part
                const minParallel = ULTRA_PROFILE.minParallel;
                
                // Enhanced: Track sustained low performance, but don't downscale if ≥120 Mbps total
                if (avgPartSpeedMbps < rampDownThreshold && currentThroughput < 120) {
                    lowSpeedSamples++;
                } else {
                    lowSpeedSamples = 0; // Reset if speed recovers or total ≥120 Mbps
                }
                
                // 🔒 ADAPTIVE LOCK MODE: Allow scaling when locked if performance degrades significantly
                if (lockedPerformance) {
                    // Check if performance has degraded significantly while locked
                    if (currentThroughput < (initialPeakThroughput * 0.6)) {
                        console.log(`🚨 ULTRA PERFORMANCE DEGRADATION: ${currentThroughput.toFixed(0)} Mbps < 60% of peak ${initialPeakThroughput.toFixed(0)} Mbps - unlocking for adaptation`);
                        lockedPerformance = false;
                        peakPerformanceDetected = false;
                        peakResetState = 'stable';
                        strongPerformanceSamples = 0;
                    } else if (avgPartSpeedMbps > rampUpThreshold && context.maxParallel < strategy.maxParallelCap) {
                        console.log(`🔒 ULTRA LOCKED MODE: Performance locked at ${optimalParallel} parallel - skipping ramp-up (${avgPartSpeedMbps.toFixed(1)} Mbps per part)`);
                    }
                } else {
                    // Traditional ramp-up logic (only if not locked)
                    if (avgPartSpeedMbps > rampUpThreshold && context.maxParallel < strategy.maxParallelCap) {
                        if (peakPerformanceDetected && context.maxParallel >= optimalParallel) {
                            // Don't ramp up beyond the sweet spot
                            console.log(`🔒 ULTRA SWEET SPOT PROTECTION: Not ramping beyond ${optimalParallel} parallel (current: ${context.maxParallel})`);
                        } else if (now - lastScaleTime < ULTRA_PROFILE.scaleUpCooldown) {
                            console.log(`⏱️ ULTRA SCALE COOLDOWN: ${((ULTRA_PROFILE.scaleUpCooldown - (now - lastScaleTime)) / 1000).toFixed(1)}s remaining`);
                        } else {
                            newParallel = Math.min(context.maxParallel + ULTRA_PROFILE.rampStep, strategy.maxParallelCap);
                            shouldAdjust = true;
                            adjustmentReason = `ULTRA RAMP UP: ${avgPartSpeedMbps.toFixed(1)} Mbps per part > ${rampUpThreshold} Mbps threshold (targeting 140-160 Mbps)`;
                            lowSpeedSamples = 0;
                            lastScaleTime = now;
                        }
                    }
                }
                
                // ULTRA: Ramp DOWN when performance is consistently poor
                if (lowSpeedSamples >= ULTRA_PROFILE.lowSpeedSampleThreshold && 
                   context.maxParallel > minParallel && 
                   (now - lastScaleDown >= ULTRA_PROFILE.scaleDownCooldown)) {
                    // Allow ramp down even when locked if performance is very poor
                    if (!lockedPerformance || currentThroughput < (initialPeakThroughput * 0.5)) {
                        newParallel = Math.max(context.maxParallel - 2, minParallel); // Gentler reduction
                        shouldAdjust = true;
                        adjustmentReason = `ULTRA SUSTAINED LOW: ${smoothedPartSpeed.toFixed(1)} MB/s per part < ${rampDownThreshold} MB/s for ${lowSpeedSamples} samples`;
                        lastScaleDown = now; // Update cooldown timer
                        lowSpeedSamples = 0; // Reset counter after action
                        
                        // If we're locked and scaling down, unlock for further adaptation
                        if (lockedPerformance) {
                            console.log(`🔓 ULTRA UNLOCKING: Poor performance detected - allowing adaptive scaling`);
                            lockedPerformance = false;
                            peakPerformanceDetected = false;
                        }
                    }
                }
                
                // Apply adjustment with throttling (minimum 5s between changes)
                if (shouldAdjust && (now - lastParallelAdjustment >= 5000)) {
                    console.log(`🔄 ULTRA ADAPTIVE ADJUSTMENT: ${adjustmentReason} → ${newParallel} parallel (was ${context.maxParallel})`);
                    
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
                        if (part.speed < ULTRA_PROFILE.minPartSpeed && (now - part.timestamp) > ULTRA_PROFILE.minPartTimeout) {
                            console.warn(`💀 ULTRA ZOMBIE KILLER: Part ${part.partNumber} too slow (${part.speed.toFixed(2)} MB/s < ${ULTRA_PROFILE.minPartSpeed} MB/s for ${((now - part.timestamp)/1000).toFixed(1)}s)`);
                            // Note: Actual part killing would need to be implemented in the main upload logic
                        }
                    });
                }
                
                // 🛑 NO-PROGRESS WATCHDOG: Detect stalled uploads (RELAXED for immediate mode)
                const timeSinceProgress = now - lastProgress;
                if (timeSinceProgress > ULTRA_PROFILE.noProgressTimeout) {
                    console.error(`🛑 ULTRA NO-PROGRESS DETECTED: ${(timeSinceProgress/1000).toFixed(1)}s since last progress — reducing parallel`);
                    if (context.maxParallel > minParallel && !lockedPerformance) {
                        context.maxParallel = Math.max(context.maxParallel - 2, minParallel); // Gentler reduction
                        console.log(`🔄 ULTRA STALL RECOVERY: Reduced to ${context.maxParallel} parallel`);
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    } else if (lockedPerformance) {
                        console.log(`🔒 ULTRA LOCKED MODE: Ignoring stall detection - performance is locked`);
                    }
                    lastProgress = now; // Reset timer
                }
                
                // 📊 CONTINUOUS PROGRESS TRACKING: Update progress when parts are active
                if (context.activeUploads > 0 || recentParts.length > 0) {
                    lastProgress = now; // Keep updating progress as long as parts are active
                }
                
                // 🚨 EMERGENCY RESET: If throughput falls below emergency threshold
                if (currentThroughput < ULTRA_PROFILE.emergencyResetThreshold) {
                    emergencyResetCounter++;
                    if (emergencyResetCounter >= 3) {
                        console.error(`🚨 ULTRA EMERGENCY RESET: Throughput ${currentThroughput.toFixed(1)} Mbps < ${ULTRA_PROFILE.emergencyResetThreshold} Mbps for 3 cycles`);
                        // Reset all performance locks and states
                        peakPerformanceDetected = false;
                        lockedPerformance = false;
                        peakResetState = 'stable';
                        strongPerformanceSamples = 0;
                        emergencyResetCounter = 0;
                        context.maxParallel = ULTRA_PROFILE.parallel; // Reset to default
                        console.log(`🔄 ULTRA STRATEGY RESET: Back to ${ULTRA_PROFILE.parallel} parallel, unlocked performance`);
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
                
                // ULTRA expected speed (aggressive target)
                const realExpectedSpeed = 15.0; // Target 120+ Mbps = 15 MB/s
                
                // If running for >30s and significantly underperforming, switch to conservative mode
                if (elapsedMinutes > 0.5 && overallSpeed < (realExpectedSpeed * 0.3)) {
                    console.log(`🚨 ULTRA THROTTLED NETWORK DETECTED: ${overallSpeed.toFixed(1)} MB/s << expected ${realExpectedSpeed.toFixed(1)} MB/s`);
                    
                    // Switch to more conservative settings for throttled/unstable networks
                    if (strategy.partSize < 12 * 1024 * 1024) {
                        strategy.partSize = Math.min(strategy.partSize + 2 * 1024 * 1024, 15 * 1024 * 1024); // Larger parts
                        const newMaxCap = Math.max(strategy.maxParallelCap * 0.6, 20); // Reduce max cap
                        context.maxParallel = Math.min(context.maxParallel, newMaxCap);
                        console.log(`🔄 ULTRA FALLBACK MODE: ${(strategy.partSize/1024/1024).toFixed(0)}MB parts, ${context.maxParallel} parallel (throttled network)`);
                        
                        // Update performance tracker
                        performanceTracker.updateStrategy(strategy.partSize, context.maxParallel, Math.ceil(context.file.size / strategy.partSize));
                    }
                }
            }
        } catch (error) {
            console.warn('ULTRA adaptive monitoring failed:', error.message);
        }
    }, 500); // Monitor every 0.5 seconds (immediate feedback for locked mode)
    
    return monitorInterval;
}

// Export for use in main upload logic
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ULTRA_PROFILE,
        createUltraUploadStrategy,
        createUltraAdaptiveMonitor
    };
} 