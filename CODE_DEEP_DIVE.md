# CiGenie: Code-Level Deep Dive & Review Guide

This document is prepared for your project review. it explains **how the code works** at a function level, the data structures used, and the reasoning behind technical decisions.

---

## 🏗️ 1. Orchestration Logic (The "Brain" & "Hands")

### Flow: From Click to Deployment
When a user clicks "Deploy" in the React Dashboard, the following sequence occurs:

1.  **Frontend**: Sends a POST request to `/api/deploy/intent`.
2.  **Controller (`deploymentController.js`)**:
    -   Calls `analyzeIntent(req.body)` in the **Decision Engine**.
    -   Receives a JSON `plan` (e.g., `ACTION: "deploy"`, `ENV: "production"`).
    -   The user sees this plan and clicks "Approve".
3.  **Execution Phase**:
    -   `executePlan(plan)` is called.
    -   **Validation**: It checks if a `package.json` test script exists via **GitHub API** (using `githubService.js`).
    -   **Jenkins Sync**: It calls `jenkinsExecutor.js` to check if a job exists. If not, it **dynamically creates a Jenkins Pipeline** using an XML template and Groovy script.
    -   **Trigger**: `triggerBuild(jobName, params)` sends a POST request to Jenkins with CSRF crumbs.
4.  **Monitoring**:
    -   `pollExecution()` starts a background timer.
    -   It fetches live logs (`getBuildLogs`) and status from Jenkins every 3 seconds.
    -   Once finished, it triggers the **AI Service** to summarize the results.

---

## 🧠 2. AI Service: Gemini Integration (`aiService.js`)

**Teacher Question:** *"How do you handle log limits when sending data to AI?"*
**Answer**: We use the `truncateLogs(logs, maxChars)` function. It keeps the **tail** (last 4000 characters) of the logs because build failures almost always occur at the end.

**Logic**:
-   We use the `@google/generative-ai` SDK.
-   **Prompt Engineering**: We use a `SUMMARY_SYSTEM_PROMPT` that instructs Gemini to return a **strict JSON format**. This allows the backend to parse the response directly into `headline`, `reason`, and `suggestion` fields.

---

## 💾 3. Data Persistence (Mongoose Schemas)

We use **MongoDB Atlas** for high availability and flexible schema design.

### `Project.js` (The Source of Truth)
-   **Fields**: `name`, `cloneUrl`, `type` (REACT/NODE).
-   **Status Tracking**: The `deployed` object stores the current state of both `dev` and `production` environments, including timestamps and last test results.

### `Execution.js` (The Audit Log)
-   Every single attempt (success or failure) is logged here.
-   **Relationships**: Linked to a `projectId`.
-   **Payload**: Stores the full `plan`, all `logs` (as an array of strings), and the `aiSummary`.

---

## 🤖 4. Jenkins Infrastructure as Code

**Teacher Question:** *"How does the system know how to build different types of apps?"*
**Answer**: We use `pipelineTemplates.js`. It generates **Groovy Jenkinsfiles** on the fly.
-   **React Template**: Uses `npm run build` and copies `build/` or `dist/` folders.
-   **Node Template**: Uses `npm install` and `rsync` (or `robocopy` on Windows) to deploy files while excluding `node_modules`.

---

## 👨‍🏫 5. Potential Teacher Questions & Answers (FAQ)

**Q: Why use an Orchestrator instead of just using Jenkins directly?**
*A: Jenkins is complex. CiGenie provides an "Intent-Based" layer. Instead of filling out 10 parameters, a user just says "Deploy". The orchestrator handles the logic, AI summary, and GitHub syncing.*

**Q: How do you handle Security?**
*A: 1. We use **Personal Access Tokens (PAT)** for GitHub and Jenkins. 2. We fetch **Jenkins Crumbs** (CSRF tokens) before every POST request to prevent cross-site attacks. 3. Environment variables are stored in `.env` and never hardcoded.*

**Q: What happens if Jenkins is offline?**
*A: The `systemController` has a `getSystemStatus()` endpoint that pings Jenkins. If it fails, the UI shows a "Disconnected" status, and the orchestrator prevents triggers to avoid database corruption.*

**Q: Why use MongoDB instead of SQL?**
*A: CI/CD logs and build metadata can vary significantly between projects (NoSQL's schema-less nature is perfect). Also, the hierarchical nature of `Execution Plan` objects is easier to store as JSON documents.*
