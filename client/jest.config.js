module.exports = {
    transform: {
      "^.+\\.(js|jsx)$": "babel-jest",
    },
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['js', 'jsx'],
    setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect']
};