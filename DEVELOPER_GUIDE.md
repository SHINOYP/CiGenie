# CiGenie Developer Guide

Welcome to the CiGenie developer documentation. This guide is designed to help you set up the project locally, understand the architecture, and contribute to the codebase.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18 or higher.
- **npm**: v9 or higher.
- **MongoDB**: Access to a MongoDB Atlas cluster or a local instance.
- **Jenkins**: A running Jenkins instance with Remote API access enabled.
- **Google Gemini API Key**: For AI-powered log summarization.

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd CiGenie
    ```

2.  **Server Setup**:
    ```bash
    cd server
    npm install
    # Create a .env file (see Configuration section)
    npm run dev
    ```

3.  **Client Setup**:
    ```bash
    cd client
    npm install
    npm run dev
    ```

### Running with Docker (Jenkins only)
The project includes a `docker-compose.yml` to quickly spin up a Jenkins instance:
```bash
docker-compose up -d
```
This will start Jenkins on `localhost:8080` with `jenkins_home` persisted in a volume.

---

## ⚙️ Configuration

Create a `.env` file in the `server/` directory with the following variables:

```env
PORT=4040
MONGODB_URI=your_mongodb_connection_string

# GitHub Integration
GITHUB_USERNAME=your_username
GITHUB_TOKEN=your_personal_access_token

# Jenkins Integration
JENKINS_URL=http://localhost:8080
JENKINS_USER=admin
JENKINS_TOKEN=your_jenkins_api_token

# AI Service
GEMINI_API_KEY=your_google_gemini_api_key
```

> [!NOTE]
> Ensure the `JENKINS_URL` is accessible from the server. If running Jenkins in Docker, use the host IP or service name if in the same network.

---

## 🔌 API Documentation

### Deployments (`/api/deploy`)
- `GET /projects`: returns all discovered projects.
- `POST /intent`: analyzes user intent and returns an execution plan.
- `POST /execute`: triggers a Jenkins build based on a plan.
- `GET /execution/:id`: returns status and logs for a specific execution.
- `GET /history`: returns all past executions.
- `DELETE /:projectId`: removes a project's job and history.
- `POST /sync-jenkins`: force-syncs legacy builds from Jenkins.

### System (`/api/system`)
- `GET /stats`: returns dashboard statistics.
- `GET /status`: checks connectivity to Jenkins and MongoDB.
- `GET /paths`: returns available file system paths from Jenkins.
- `GET /insights`: returns AI-driven system recommendations.

### Configuration (`/api/config`)
- `GET /`: returns current system configuration.
- `POST /`: updates system-wide settings.

---

## 🧩 Extension Guide

### How to Add a New Intent Action
1.  Open `server/services/decisionService.js`.
2.  Add a new handler to the `ACTION_HANDLERS` object:
    ```javascript
    const ACTION_HANDLERS = {
      // ... existing handlers
      NEW_ACTION: (decision) => {
        decision.jenkinsParams.ACTION = 'custom-action';
        decision.reasoning.push('Applied custom logic for NEW_ACTION.');
        decision.autoExecute = false; // Require user approval
      }
    };
    ```

### Customizing Jenkins Pipelines
1.  Navigate to `server/templates/pipelineTemplates.js`.
2.  Modify `getReactPipeline` or `getNodePipeline` to inject custom Groovy stages.
3.  The `jenkinsExecutor.js` will automatically use these when creating or updating jobs.

---

## 🧪 Testing
- **Backend**: Run `npm test` (if implemented) or use Postman/Insomnia to hit the documented endpoints.
- **Frontend**: Use Vite's dev server to verify UI changes in real-time.

---

## 📂 Architecture Overview
CiGenie uses a decoupled architecture:
- **Frontend**: Vite + React + Ant Design.
- **Backend**: Node.js + Express.
- **Database**: MongoDB (Mongoose).
- **Orchestration**: Direct integration with Jenkins REST API.
- **Intelligence**: Google Gemini Flash for log analysis.
