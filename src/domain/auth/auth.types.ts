import { Role } from "../../config/role.enum";

export type RegisterPayloadDto = {
    email: string;
    password: string;
    role: Role
}

export type LoginPayloadDto = {
    email: string;
    password: string;
}