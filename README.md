# ci-cd-teste-exemplo

A learning project for practicing continuous integration and report delivery with Cypress, Allure, GitHub Actions, and GitHub Pages. It contains JavaScript end-to-end tests and a workflow that runs them automatically when changes reach `main`, generates an HTML test report, and publishes it to GitHub Pages.

The tests exercise Cypress's public example website and demo API. They cover a to-do application, browser interactions, assertions, network requests, fixtures, file operations, and other Cypress commands. You do not need to start a local application server.

## Requirements

- Node.js and npm. The GitHub Actions workflow uses Node.js 18.
- Google Chrome installed and available to Cypress, because the test launcher selects Chrome explicitly.
- Internet access to install dependencies and reach `example.cypress.io` and `jsonplaceholder.cypress.io` during tests.
- For Allure 2 report generation and viewing: Java 8 or newer, with `JAVA_HOME` pointing to the Java installation and Java available on `PATH`. See the [Allure 2 installation guide](https://allurereport.org/docs/v2/install-for-nodejs/).
- Git, if you are cloning the repository, and a GitHub repository with Actions and Pages enabled to publish reports.

The declared dependency ranges are Cypress `^14.5.4`, `allure-cypress` `^3.14.0`, `allure-commandline` `^2.46.1` (Allure 2), and `allure` `^3.22.1` (Allure 3). The `package-lock.json` file records resolved dependency versions. The report scripts currently use Allure 2 command syntax; see [Allure reports](#allure-reports) for the CLI naming conflict between the two installed versions.

## Install dependencies

Clone your copy of the repository and enter its directory. For this repository:

```sh
git clone https://github.com/julianoaperes/ci-cd-teste.git
cd ci-cd-teste
```

If you already have a checkout, open a terminal in its root. Install all dependencies, including development dependencies needed by the Allure integration:

```sh
npm install
```

This installs the project dependencies, including Cypress and its browser-testing binary.

For a clean installation using the versions in the committed lockfile, use `npm ci` instead. The current CI workflow uses `npm install`.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm test` | Run all Cypress specs in headless Chrome and write Allure results. |
| `npm run allure:generate` | Generate `allure-report/` from `allure-results/`, replacing the previous HTML report. |
| `npm run allure:open` | Serve the generated report locally and open it in the browser. |

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

To use the interactive Cypress interface, run:

```sh
npx cypress open --e2e --browser chrome
```

This opens Cypress directly and does not use the Windows environment adjustment in `npm test`. Use `npm test -- --headed` when you need that adjustment while watching the browser.

## Allure reports

The integration has two parts: `cypress/support/e2e.js` imports `allure-cypress`, and `cypress.config.js` registers `allureCypress()` in `setupNodeEvents`, with results written to `allure-results/`.

Run tests, generate the HTML report, and open it:

```sh
npm test
npm run allure:generate
npm run allure:open
```

You can also generate a report after a failed local test run, provided results were written. Opening the report starts a local server; stop it with `Ctrl+C` in the terminal.

`allure:generate` runs `npx allure generate --clean allure-results --output allure-report`. The `--clean` option replaces the generated report; it does not clear old raw results. If you want a report containing only a fresh run, remove the generated `allure-results/` directory before running tests again.

Both `allure-commandline` and `allure` expose an executable named `allure`. If the scripts select Allure 3 and reject Allure 2 options such as `--clean`, invoke the project's Allure 2 executable explicitly from the repository root:

```sh
node node_modules/allure-commandline/bin/allure generate --clean allure-results --output allure-report
node node_modules/allure-commandline/bin/allure open allure-report
```

These explicit commands require Java. The CLI collision remains in `package.json`; the commands above provide an alternative without changing dependencies.

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
allure-results/                 Raw Allure results and attachments (generated)
allure-report/                  HTML report published to GitHub Pages (generated)
cypress/
  e2e/
    1-getting-started/           To-do application examples
    2-advanced-examples/         Examples of Cypress commands and APIs
  fixtures/                     JSON data loaded or written by tests
  support/
    e2e.js                      Support file loaded before spec files
    commands.js                 Place to add reusable Cypress commands
  screenshots/                  Screenshots produced by test runs
  videos/                       Videos recorded during test runs
  downloads/                    Download output from test runs
package.json                    Project metadata, dependencies, and test script
package-lock.json               Resolved dependency versions
.gitignore                      Files and directories excluded from Git tracking
```

`cypress.config.js` enables end-to-end testing, registers the Allure reporter, and sets `video: true`. Tests currently use full URLs directly rather than a configured `baseUrl`. No application credentials or `.env` file are required for the existing demo tests.

Some examples intentionally write files. The file tests write `cypress/fixtures/users.json` and `cypress/fixtures/profile.json`, and the screenshot example creates `my-image.png` under `cypress/screenshots/`. Running the suite can therefore produce changes in your working directory.

Allure results, the HTML report, Cypress videos, and screenshots are ignored by Git. The fixture files and `cypress/downloads/downloads.htm` are tracked, so inspect `git status` after a run before committing.

## Continuous integration

The workflow is defined in `.github/workflows/ci-test.js.yml` and appears as **CI Tests - Cypress** in the repository's **Actions** tab.

It runs on pushes to `main`, including pushes caused by merging a pull request into that branch, and supports manual runs through `workflow_dispatch`. Opening a pull request alone does not trigger this workflow. To start it manually, open **Actions > CI Tests - Cypress > Run workflow**, select the branch, and run it. The workflow must be present on the default branch for manual dispatch to be available.

The job performs these steps in order:

1. Starts a fresh GitHub-hosted runner using `ubuntu-latest`.
2. Checks out the repository with `actions/checkout@v5`.
3. Sets up Node.js 18 with `actions/setup-node@v5` and enables npm's download cache to speed up later installations.
4. Runs `npm install` to install dependencies. The npm cache does not replace this step.
5. Runs `npm test`, using the same Cypress launcher as local execution.
6. Runs `npm run allure:generate` to build the HTML report.
7. Uses `peaceiris/actions-gh-pages@v4` to publish `./allure-report` to the `gh-pages` branch with the automatically supplied `GITHUB_TOKEN`. The workflow grants `contents: write` for this push.

If installation, tests, report generation, or publication fails, the job fails. Open the workflow run in the **Actions** tab and expand the failed step to inspect its logs.

The report steps have no `if: always()` condition, so a test failure skips report generation and publication. The published report therefore remains from the previous successful publication. Screenshots, videos, and raw results are not uploaded as downloadable workflow artifacts. The workflow publishes the report only; there is no application deployment step.

## GitHub Pages setup

Configure this in the repository where you want reports published:

1. Ensure GitHub Actions is enabled and repository or organization policies permit the workflow's `contents: write` permission.
2. Run the workflow successfully so the publication action can create the `gh-pages` branch.
3. Open **Settings > Pages**. Under **Build and deployment**, select **Deploy from a branch**, choose **gh-pages** and **/ (root)**, and save. This workflow uses branch publication through `peaceiris/actions-gh-pages`; follow its [deployment instructions](https://github.com/peaceiris/actions-gh-pages/blob/main/README.md) for first-run setup.
4. Wait for Pages to finish publishing, then use the site URL shown in **Settings > Pages**. The expected default URL for this checkout is `https://julianoaperes.github.io/ci-cd-teste/`; availability depends on completing setup and a successful publication.

`GITHUB_TOKEN` is provided by GitHub Actions; no personal access token is configured by this workflow. If you fork or rename the repository, use your own clone URL and the Pages URL displayed in your repository settings.

## Adding tests

Create a `*.cy.js` file under `cypress/e2e/`, write your test cases, and run it with `npm test -- --spec "path/to/your-test.cy.js"`. Store reusable test data in `cypress/fixtures/` and add shared Cypress commands in `cypress/support/commands.js`.

Before opening a pull request, run the affected specs, review the Allure report when relevant, and inspect `git diff` for fixture or download changes produced by tests. Commit source changes and the lockfile when dependencies change; generated reports, results, screenshots, and videos belong outside source control. This repository currently has no separate build, lint, or unit-test script.

## Troubleshooting

- **Chrome cannot be found:** Install Google Chrome and rerun `npm test`; the launcher explicitly requests that browser.
- **A page or API cannot be reached:** Check internet access to the external demo services used by the tests.
- **A Windows `cy.exec()` failure mentions Git Bash or `Program Files`:** Run through `npm test` so the launcher's `SHELL` adjustment is applied.
- **A test fails in CI:** Inspect the **Execute tests** step in GitHub Actions, then run the failing spec locally using the `--spec` example above.
- **The Cypress binary is missing:** Run `npx cypress install`, then `npx cypress verify`, and retry the test command.
- **Allure cannot find Java:** Check `java -version`, `JAVA_HOME`, and `PATH` against the Allure 2 requirements above.
- **Allure rejects `--clean` or opens the wrong report format:** Use the explicit Allure 2 commands in [Allure reports](#allure-reports); both installed CLI packages claim the `allure` executable.
- **The report is empty or contains older tests:** Check that `allure-results/` contains results from the intended run. Clear that generated directory before a fresh run if needed, then regenerate the report.
- **Pages shows a 404 or an old report:** Check that the **Publication on Gh pages** step succeeded and that Pages uses the `gh-pages` branch root. Failed tests skip publication, leaving the earlier report in place.
- **Publication reports a permission error:** Check the workflow's `contents: write` permission and repository or organization restrictions on Actions tokens and branch pushes.

## License

`package.json` declares the ISC license. No standalone `LICENSE` file is currently included in this repository.
