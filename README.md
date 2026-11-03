# ci-cd-teste-exemplo

A learning project for practicing continuous integration (CI) with Cypress and GitHub Actions. It contains JavaScript end-to-end tests and a workflow that runs them automatically when changes reach `main`.

The tests exercise Cypress's public example website and demo API. They cover a to-do application, browser interactions, assertions, network requests, fixtures, file operations, and other Cypress commands. You do not need to start a local application server.

## Requirements

- Node.js and npm. The GitHub Actions workflow uses Node.js 18.
- Google Chrome installed and available to Cypress, because the test launcher selects Chrome explicitly.
- Internet access to install dependencies and reach `example.cypress.io` and `jsonplaceholder.cypress.io` during tests.

The Cypress dependency is declared as `^14.5.4` in `package.json`. The `package-lock.json` file records resolved dependency versions.

## Install dependencies

From the project root, run:

```sh
npm install
```

This installs the project dependencies, including Cypress and its browser-testing binary.

## Run tests

Run the entire suite in Chrome without opening an interactive browser window:

```sh
npm test
```

Run a single spec while working on a particular example:

```sh
npm test -- --spec "cypress/e2e/1-getting-started/todo.cy.js"
```

Show the Chrome browser during a test run:

```sh
npm test -- --headed
```

The `--` after `npm test` forwards additional arguments to the launcher, which passes them to Cypress. Test output appears in the terminal. A successful run returns exit code `0`; a failed run returns a nonzero code so npm and GitHub Actions can detect the failure.

## How the test launcher works

The `test` script in `package.json` runs `scripts/run-cypress.cjs`. This launcher:

1. Copies the current environment variables for the Cypress process.
2. Removes the inherited `SHELL` variable on Windows. This addresses a Git Bash path issue where spaces in `Program Files` can interfere with the example that uses `cy.exec()`.
3. Finds the installed Cypress CLI and starts it with the same Node.js executable running the launcher.
4. Runs `cypress run --browser chrome`, forwarding any additional command-line arguments.
5. Streams Cypress output to the terminal and returns its exit status. If Cypress cannot start or no exit status is available, the launcher reports failure.

The environment adjustment applies to the child process; it does not change your terminal's environment. Using `npm test` applies this launcher behavior both locally and in CI.

## Project structure

```text
.github/workflows/ci-test.js.yml  GitHub Actions workflow
scripts/run-cypress.cjs          Cypress launcher used by npm test
cypress.config.js               Cypress end-to-end configuration
cypress/
  e2e/
    1-getting-started/           To-do application examples
    2-advanced-examples/         Examples of Cypress commands and APIs
  fixtures/                     JSON data loaded or written by tests
  support/
    e2e.js                      Support file loaded before spec files
    commands.js                 Place to add reusable Cypress commands
  screenshots/                  Screenshots produced by test runs
  downloads/                    Download output from test runs
package.json                    Project metadata, dependencies, and test script
package-lock.json               Resolved dependency versions
.gitignore                      Files and directories excluded from Git tracking
```

`cypress.config.js` enables end-to-end testing and provides an empty `setupNodeEvents` hook for future Node-side event handlers. Tests currently use full URLs directly rather than a configured `baseUrl`.

Some examples intentionally write files. The file tests write `cypress/fixtures/users.json` and `cypress/fixtures/profile.json`, and the screenshot example creates `my-image.png` under `cypress/screenshots/`. Running the suite can therefore produce changes in your working directory.

## Continuous integration

The workflow is defined in `.github/workflows/ci-test.js.yml` and appears as **CI Tests - Cypress** in the repository's **Actions** tab.

It runs on pushes to `main`, including pushes caused by merging a pull request into that branch. Opening a pull request alone does not trigger this workflow.

The job performs these steps in order:

1. Starts a fresh GitHub-hosted runner using `ubuntu-latest`.
2. Checks out the repository with `actions/checkout@v4`.
3. Sets up Node.js 18 with `actions/setup-node@v4` and enables npm's download cache to speed up later installations.
4. Runs `npm install` to install dependencies. The npm cache does not replace this step.
5. Runs `npm test`, using the same Cypress launcher as local execution.

If the install or test command fails, the job fails. Open the workflow run in the **Actions** tab and expand the failed step to inspect its logs. The current workflow runs tests; it does not deploy an application or upload screenshots as workflow artifacts.

## Adding tests

Create a `*.cy.js` file under `cypress/e2e/`, write your test cases, and run it with `npm test -- --spec "path/to/your-test.cy.js"`. Store reusable test data in `cypress/fixtures/` and add shared Cypress commands in `cypress/support/commands.js`.

## Troubleshooting

- **Chrome cannot be found:** Install Google Chrome and rerun `npm test`; the launcher explicitly requests that browser.
- **A page or API cannot be reached:** Check internet access to the external demo services used by the tests.
- **A Windows `cy.exec()` failure mentions Git Bash or `Program Files`:** Run through `npm test` so the launcher's `SHELL` adjustment is applied.
- **A test fails in CI:** Inspect the **Execute tests** step in GitHub Actions, then run the failing spec locally using the `--spec` example above.
