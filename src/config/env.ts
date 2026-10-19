import "dotenv/config";

// Reads a value from .env and stops the server if it is missing.
// Returning `string` (not `string | undefined`) means the rest of the code
// can use these values without extra checks.
function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set in .env file`);
    }
    return value;
}

export const env = {
    MONGODB_URI: required("MONGODB_URI"),
    JWT_SECRET: required("JWT_SECRET"),
    JWT_EXPIRY: required("JWT_EXPIRY"),
    SECURITY_KEY: required("SECURITY_KEY"),
    CLOUDINARY_CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME"),
    CLOUDINARY_API_KEY: required("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: required("CLOUDINARY_API_SECRET"),
    PORT: Number(process.env.PORT) || 3000,
};
