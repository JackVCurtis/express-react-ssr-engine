module.exports = {
    name: "node-tests",
    displayName: "Node Tests",
    clearMocks: true,
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: [
        "/dist/",
         "/node_modules/", 
         "/views/",
         "/components/"
    ],
    roots: [
        '<rootDir>/../../'
    ],
}