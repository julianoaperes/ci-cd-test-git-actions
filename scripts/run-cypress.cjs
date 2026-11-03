// Import Node.js's function for starting another process.
// "Sync" means this script waits until that process finishes.
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// Copy the current environment variables.
// This lets us adjust Cypress's environment without changing
// the environment of your Git Bash terminal.
const env = { ...process.env };

// On Windows, remove the inherited SHELL variable.
// In your setup, it points to Git Bash and causes cy.exec()
// to mishandle the space in "Program Files".
// Removing it allows the command runner to use its fallback shell.
if (process.platform === "win32") {
	delete env.SHELL;
}

// Start Cypress and wait for it to finish.
const result = spawnSync(
	// Use the same Node.js executable that is running this script.
	process.execPath,

	// Arguments passed to Node.js:
	[
		// Locate Cypress's package folder, then build its CLI file path.
		path.join(
			path.dirname(require.resolve("cypress/package.json")),
			"bin",
			"cypress",
		),

		// Execute tests instead of opening the Cypress interface.
		"run",

		// Select Chrome as the browser.
		"--browser",
		"chrome",

		// Forward any extra arguments you pass to this launcher.
		// slice(2) removes the Node.js path and this script's path.
		// Example:
		// npm test -- --spec "cypress/e2e/2-advanced-examples/misc.cy.js"
		...process.argv.slice(2),
	],

	// Settings for the new process:
	{
		// Give Cypress the environment we prepared above.
		env,

		// Display Cypress output directly in your terminal
		// and let it use the terminal's input and error streams.
		stdio: "inherit",
	},
);

// Print an error if the process could not start,
// or another process-launch error occurred.
// Ordinary test failures are reported through the exit status.
if (result.error) {
	console.error(result.error);
}

// Return Cypress's exit status to npm and GitHub Actions:
// 0 means success; a nonzero value means failure.
//
// If no exit status is available, use 1 to report failure.
// "??" preserves 0, so successful tests remain successful.
process.exit(result.status ?? 1);
