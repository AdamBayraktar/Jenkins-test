module.exports = {
  testEnvironment: "node",
  reporters: [
    "default", // keep default console output
    [ "jest-junit", {
      outputDirectory: "reports/junit",
      outputName: "js-test-results.xml"
    }]
  ]
};