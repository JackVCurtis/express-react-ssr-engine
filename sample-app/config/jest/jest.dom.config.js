module.exports = {
    name: "dom-tests",
    displayName: "DOM Tests",
    clearMocks: true,
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: [
        '<rootDir>/../../server/views',
        '<rootDir>/../../server/components'
    ],
}