module.exports = {
    clearMocks: true,
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: [
         "/node_modules/", 
         "/build/"
    ],
    roots: [
        '<rootDir>'
    ],
}