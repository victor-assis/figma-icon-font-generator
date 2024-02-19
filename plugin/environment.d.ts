// Declare environment variables types
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            EXAMPLE_API_KEY: string
        }
    }
}

// Convert the file into a module by adding an empty export statement
export { }