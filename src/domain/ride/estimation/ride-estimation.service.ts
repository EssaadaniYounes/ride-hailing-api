import { config } from "../../../config/env";
import logger from "../../../lib/logger.lib";
import { CreateRideDto } from "../ride.schema";
import axios from 'axios';
export const RideEstimationService = {

    async estimateRide(payload: Omit<CreateRideDto, "locationEnabled">) {
        const { pickupLng, pickupLat, dropoffLat, dropoffLng } = payload;
        const response = await axios.get(`
            ${config.rides.mapBoxBaseURL}/v1/mapbox/driving/${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}
        `, {
            params: {
                annotations: "distance,duration",
                access_token: config.rides.mapBoxApiKey
            }
        });
        if (response.status !== 200) {
            logger.error(`MapBox API Error: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to estimate ride`);
        }
        const data = response.data;
        logger.info(`Estimated ride: ${JSON.stringify(data)}`);
        const distance = data.distances[0][1];  // in meters
        const duration = data.durations[0][1]; // in seconds

        const price = config.rides.pricePerMeter * distance;
        return {
            distanceKm: distance / 1000,
            etaMinutes: duration / 60,
            price
        }
    }

}