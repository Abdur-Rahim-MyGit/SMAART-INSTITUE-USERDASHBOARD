/**
 * CareerLockContext.jsx
 * React context that provides career direction lock state across the dashboard and onboarding.
 * Automatically fetches and refreshes lock status from the backend.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchLockStatus } from '@/services/CareerLockService';

const CareerLockContext = createContext(null);

export const CareerLockProvider = ({ children }) => {
    const [lockStatus, setLockStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshLockStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const status = await fetchLockStatus();
            setLockStatus(status);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshLockStatus();
    }, [refreshLockStatus]);

    const isLocked        = lockStatus?.isLocked          ?? false;
    const attemptsUsed    = lockStatus?.attemptsUsed       ?? 0;
    const maxAttempts     = lockStatus?.maxAttempts        ?? 5;
    const remainingAttempts = lockStatus?.remainingAttempts ?? 5;
    const remainingDays   = lockStatus?.remainingDays      ?? 14;
    const firstVisitModalShown = lockStatus?.firstVisitModalShown ?? true;
    const hasAnalysis     = lockStatus?.found              ?? false;

    return (
        <CareerLockContext.Provider value={{
            lockStatus,
            isLocked,
            attemptsUsed,
            maxAttempts,
            remainingAttempts,
            remainingDays,
            firstVisitModalShown,
            hasAnalysis,
            isLoading,
            refreshLockStatus,
        }}>
            {children}
        </CareerLockContext.Provider>
    );
};

export const useCareerLock = () => {
    const ctx = useContext(CareerLockContext);
    if (!ctx) throw new Error('useCareerLock must be used inside CareerLockProvider');
    return ctx;
};

export default CareerLockContext;
