export interface LocationService {
    /**@TODO */
}

export type Location = {
    id: string,
    aliasName: string | null,
    addressLine1: string,
    addressLine2: string | null,
    city: string,
    state: string,
    zip: string,
    country: string,
    addressValidated: boolean,
    createdAt: string,
    updatedAt: string,
}