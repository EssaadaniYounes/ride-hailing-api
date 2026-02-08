import { RideState } from '../../generated/prisma/client';
import { BadRequestError } from '../../errors/domain-errors.base';

export const RideStateMachine = {
    getValidTransitions(): Record<RideState, RideState[]> {
        return {
            [RideState.MATCHING]: [RideState.DRIVER_ASSIGNED, RideState.CANCELLED],
            [RideState.DRIVER_ASSIGNED]: [RideState.ARRIVED, RideState.CANCELLED, RideState.MATCHING],
            [RideState.ARRIVED]: [RideState.ONGOING, RideState.CANCELLED],
            [RideState.ONGOING]: [RideState.COMPLETED, RideState.CANCELLED], 
            [RideState.COMPLETED]: [],
            [RideState.CANCELLED]: []
        };
    },

    canTransition(currentState: RideState, nextState: RideState): boolean {
        const validTransitions = this.getValidTransitions();
        return validTransitions[currentState]?.includes(nextState) || false;
    },

    validateTransition(currentState: RideState, nextState: RideState): void {
        if (!this.canTransition(currentState, nextState)) {
            throw new BadRequestError(`Invalid ride state transition: ${currentState} -> ${nextState}`);
        }
    }
};
