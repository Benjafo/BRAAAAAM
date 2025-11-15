"use client";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface ScoreBreakdown {
    total: number;
    baseScore: {
        loadBalancing: number;
        vehicleMatch: number;
        mobilityEquipment: number;
        specialAccommodations: number;
    };
    penalties: {
        unavailable: number;
        concurrentRide: number;
        overMaxRides: number;
    };
    warnings: {
        hasUnavailability: boolean;
        hasConcurrentRide: boolean;
        isOverMaxRides: boolean;
        hasVehicleMismatch: boolean;
    };
}

interface Driver {
    firstName: string;
    lastName: string;
    matchScore: number;
    weeklyRideCount: number;
    maxRidesPerWeek: number | null;
    matchReasons: string[];
    scoreBreakdown: ScoreBreakdown;
    isPerfectMatch: boolean;
}

interface DriverMatchDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    driver: Driver | null;
}

export default function DriverMatchDetailsModal({
    open,
    onOpenChange,
    driver,
}: DriverMatchDetailsModalProps) {
    if (!driver) return null;

    const { scoreBreakdown } = driver;
    const hasWarnings =
        scoreBreakdown.warnings.hasUnavailability ||
        scoreBreakdown.warnings.hasConcurrentRide ||
        scoreBreakdown.warnings.isOverMaxRides ||
        scoreBreakdown.warnings.hasVehicleMismatch;

    // Color coding based on score
    const getScoreColor = (score: number) => {
        if (score >= 70) return "text-green-600";
        if (score >= 40) return "text-yellow-600";
        if (score >= 0) return "text-orange-600";
        return "text-red-600";
    };

    const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
        if (score >= 70) return "default";
        if (score >= 40) return "secondary";
        return "destructive";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>
                            Match Details: {driver.firstName} {driver.lastName}
                        </span>
                        <Badge variant={getScoreBadgeVariant(scoreBreakdown.total)}>
                            Score: {scoreBreakdown.total}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Perfect Match Banner */}
                    {driver.isPerfectMatch && (
                        <div className="border-2 border-green-600 bg-green-50 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-green-900 text-lg">Perfect Match!</h4>
                                    <p className="text-sm text-green-800">
                                        This driver meets all requirements with maximum compatibility and no warnings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Overall Score */}
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Overall Match Score</h3>
                        <div className="flex items-center gap-4">
                            <Progress
                                value={(scoreBreakdown.total + 90) / 1.9}
                                className="flex-1"
                            />
                            <span
                                className={`text-2xl font-bold ${getScoreColor(scoreBreakdown.total)}`}
                            >
                                {scoreBreakdown.total}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Score range: -90 (worst) to +100 (perfect)
                        </p>
                    </div>

                    {/* Warnings Section */}
                    {hasWarnings && (
                        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-yellow-900 mb-2">Warnings</h4>
                                    <ul className="space-y-1 text-sm text-yellow-800">
                                        {scoreBreakdown.warnings.hasUnavailability && (
                                            <li>
                                                • Driver marked as unavailable during appointment
                                                time
                                            </li>
                                        )}
                                        {scoreBreakdown.warnings.hasConcurrentRide && (
                                            <li>
                                                • Driver has another ride scheduled at this time
                                            </li>
                                        )}
                                        {scoreBreakdown.warnings.isOverMaxRides && (
                                            <li>
                                                • Driver at weekly ride limit (
                                                {driver.weeklyRideCount}/{driver.maxRidesPerWeek})
                                            </li>
                                        )}
                                        {scoreBreakdown.warnings.hasVehicleMismatch && (
                                            <li>
                                                • Vehicle type doesn&apos;t match client preference
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Base Score Breakdown */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Score Breakdown</h3>
                        <div className="space-y-3">
                            <ScoreItem
                                label="Load Balancing"
                                score={scoreBreakdown.baseScore.loadBalancing}
                                maxScore={40}
                                description={`Driver has ${driver.weeklyRideCount} ride(s) this week`}
                            />
                            <ScoreItem
                                label="Vehicle Type Match"
                                score={scoreBreakdown.baseScore.vehicleMatch}
                                maxScore={25}
                                description={
                                    scoreBreakdown.baseScore.vehicleMatch < 0
                                        ? "Vehicle does not match preference (-15 penalty)"
                                        : scoreBreakdown.baseScore.vehicleMatch === 25
                                          ? "Perfect vehicle match"
                                          : "No vehicle preference specified"
                                }
                            />
                            <ScoreItem
                                label="Mobility Equipment"
                                score={scoreBreakdown.baseScore.mobilityEquipment}
                                maxScore={20}
                                description="Can accommodate all required equipment"
                            />
                            <ScoreItem
                                label="Special Accommodations"
                                score={scoreBreakdown.baseScore.specialAccommodations}
                                maxScore={15}
                                description="Oxygen, service animal capabilities"
                            />
                        </div>
                    </div>

                    {/* Penalties */}
                    {(scoreBreakdown.penalties.unavailable < 0 ||
                        scoreBreakdown.penalties.concurrentRide < 0 ||
                        scoreBreakdown.penalties.overMaxRides < 0) && (
                        <div>
                            <h3 className="text-sm font-semibold mb-3 text-red-600">
                                Penalties Applied
                            </h3>
                            <div className="space-y-2">
                                {scoreBreakdown.penalties.unavailable < 0 && (
                                    <PenaltyItem
                                        label="Unavailability"
                                        penalty={scoreBreakdown.penalties.unavailable}
                                    />
                                )}
                                {scoreBreakdown.penalties.concurrentRide < 0 && (
                                    <PenaltyItem
                                        label="Concurrent Ride"
                                        penalty={scoreBreakdown.penalties.concurrentRide}
                                    />
                                )}
                                {scoreBreakdown.penalties.overMaxRides < 0 && (
                                    <PenaltyItem
                                        label="Over Ride Limit"
                                        penalty={scoreBreakdown.penalties.overMaxRides}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Match Reasons */}
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Match Summary</h3>
                        <ul className="space-y-1">
                            {driver.matchReasons.map((reason, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                    {reason.startsWith("⚠️") ? (
                                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    )}
                                    <span>{reason.replace("⚠️ ", "")}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Helper component for score items
function ScoreItem({
    label,
    score,
    maxScore,
    description,
}: {
    label: string;
    score: number;
    maxScore: number;
    description: string;
}) {
    const percentage = score < 0 ? 0 : (score / maxScore) * 100;
    const isNegative = score < 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{label}</span>
                <span className={`text-sm font-semibold ${isNegative ? "text-red-600" : ""}`}>
                    {score} / {maxScore}
                </span>
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
    );
}

// Helper component for penalties
function PenaltyItem({ label, penalty }: { label: string; penalty: number }) {
    return (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded px-3 py-2">
            <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">{label}</span>
            </div>
            <span className="text-sm font-semibold text-red-600">{penalty} pts</span>
        </div>
    );
}
