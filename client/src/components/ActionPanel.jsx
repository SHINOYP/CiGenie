import React, { useState, useEffect } from "react";
import {
  Play,
  Shield,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  getProjects,
  analyzeIntent,
  executePlan,
  getLivePaths,
} from "../services/api";

const ActionPanel = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [environment, setEnvironment] = useState("dev");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [executing, setExecuting] = useState(false);

  // ✅ Proper state section (cleaned)
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [outputPath, setOutputPath] = useState("/var/www/html");
  const [livePaths, setLivePaths] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPaths = livePaths.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error);

    getLivePaths()
      .then((paths) => {
        if (paths && paths.length > 0) {
          setLivePaths(paths);
        }
      })
      .catch((err) => console.error("Failed to fetch live paths:", err));
  }, []);

  useEffect(() => {
    if (selectedProject && projects.length > 0) {
      const proj = projects.find((p) => p.id === selectedProject);
      if (proj?.deployed?.isLocked) {
        setOutputPath(proj.deployed.lockedPath);
      }
    }
  }, [selectedProject, projects]);

  const handleIntent = async (action) => {
    if (!selectedProject) return;

    setLoading(true);
    setPlan(null);
    setRiskAccepted(false);

    try {
      const result = await analyzeIntent(selectedProject, {
        action,
        environment,
        outputPath,
        branch: "main",
      });
      setPlan(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!plan) return;
    if (plan.approvalRequired && !riskAccepted) return;

    setExecuting(true);

    try {
      await executePlan(plan);
      setPlan(null);
      setRiskAccepted(false);
      alert("Execution initiated successfully!");
    } catch (error) {
      const errorMsg =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message;
      alert("Failed: " + errorMsg);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="p-6 mb-6 border bg-surface rounded-xl border-slate-700">
      <h3 className="mb-4 text-lg font-semibold">
        Deployment Control Plane
      </h3>

      {/* Project Selector */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row">
        <select
          className="px-4 py-2 text-white border rounded-lg outline-none bg-slate-800 border-slate-600"
          value={selectedProject}
          onChange={(e) => {
            setSelectedProject(e.target.value);
            setPlan(null);
            setRiskAccepted(false);
          }}
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="flex p-1 border rounded-lg bg-slate-800 border-slate-600">
          {["dev", "production"].map((env) => (
            <button
              key={env}
              onClick={() => {
                setEnvironment(env);
                setPlan(null);
                setRiskAccepted(false);
              }}
              className={`px-4 py-1.5 rounded-md text-sm capitalize ${
                environment === env
                  ? "bg-primary text-white"
                  : "text-gray-400"
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <button
          onClick={() => handleIntent("DEPLOY")}
          disabled={!selectedProject}
          className="flex flex-col items-center justify-center p-4 border bg-slate-800/50 rounded-xl disabled:opacity-50"
        >
          <Play size={24} />
          <span>Deploy</span>
        </button>

        <button
          onClick={() => handleIntent("TEST")}
          disabled={!selectedProject}
          className="flex flex-col items-center justify-center p-4 border bg-slate-800/50 rounded-xl disabled:opacity-50"
        >
          <Shield size={24} />
          <span>Run Tests</span>
        </button>

        <button
          onClick={() => handleIntent("REDEPLOY")}
          disabled={!selectedProject}
          className="flex flex-col items-center justify-center p-4 border bg-slate-800/50 rounded-xl disabled:opacity-50"
        >
          <RefreshCw size={24} />
          <span>Redeploy</span>
        </button>

        <button
          onClick={() => handleIntent("ROLLBACK")}
          disabled={!selectedProject}
          className="flex flex-col items-center justify-center p-4 border bg-slate-800/50 rounded-xl disabled:opacity-50"
        >
          <Zap size={24} />
          <span>Emergency Fix</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="p-4 mt-6 text-center text-gray-400">
          Analyzing intent...
        </div>
      )}

      {/* Plan */}
      {plan && (
        <div className="p-4 mt-6 border rounded-lg bg-slate-900 border-slate-700">
          <p className="mb-2 font-semibold uppercase">
            {plan.action} Plan
          </p>

          {plan.approvalRequired && (
            <label className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={riskAccepted}
                onChange={(e) => setRiskAccepted(e.target.checked)}
              />
              <span className="text-sm">
                I acknowledge production risk
              </span>
            </label>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setPlan(null);
                setRiskAccepted(false);
              }}
              className="px-4 py-2 text-gray-400"
            >
              Cancel
            </button>

            <button
              onClick={handleExecute}
              disabled={
                executing || (plan.approvalRequired && !riskAccepted)
              }
              className="px-6 py-2 text-white bg-primary rounded-lg disabled:opacity-50"
            >
              {executing ? "Executing..." : "Approve & Execute"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionPanel;