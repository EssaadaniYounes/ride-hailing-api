import { prisma } from '../../../lib/prisma.lib';
import { Driver } from '../../../generated/prisma/client';

export interface DriverWithDistance extends Driver {
    distanceToPickup: number; // in km
}

export const DriverMatchingService = {
    async findNearestDrivers(
        lat: number,
        lng: number,
        limit: number = 5
    ): Promise<DriverWithDistance[]> {
        const drivers = await prisma.$queryRaw<DriverWithDistance[]>`
      SELECT *,
        (6371 * acos(
          cos(radians(${lat})) * cos(radians(lat)) *
          cos(radians(lng) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(lat))
        )) AS "distanceToPickup"
      FROM "Driver"
      WHERE "isAvailable" = true
      ORDER BY "distanceToPickup" ASC
      LIMIT ${limit}
    `;

        return drivers;
    }
};
