import z from "zod";

export const CreateRideSchema = z.object({
    locationEnabled: z.boolean({
        message: "Location is required"
    }),
    pickupLat: z.number({
        message: "Pickup Lat location is required"
    }),
    pickupLng: z.number({
        message: "Pickup Lng location is required"
    }),
    dropoffLat: z.number({
        message: "Dropoff Lat location is required"
    }),
    dropoffLng: z.number({
        message: "Dropoff Lng location is required"
    })
});

export type CreateRideDto = z.infer<typeof CreateRideSchema>;
