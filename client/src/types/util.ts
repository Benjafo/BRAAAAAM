export type ApiResponse = {
    message: string,
    details?: any, //eslint-disable-line
    error?: any //eslint-disable-line
}
/**@TODO Remove any from either linting or replace with more definitive type */