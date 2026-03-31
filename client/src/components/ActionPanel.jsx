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
import { useOutletContext } from "react-router-dom";

const ActionPanel = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [environment] = useState("production");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [outputPath, setOutputPath] = useState("/var/www/html");
  const [livePaths, setLivePaths] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { startTracking } = useOutletContext();

  const filteredPaths = livePaths.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error);
    getLivePaths()
      .then((paths) => {
        if (paths && paths.length > 0) {
          setLivePaths(paths);
          // Only set default if not locked later
        }
      })
      .catch((err) => console.error("Failed to fetch live paths:", err));
  }, []);

  // Sync output path with locked project path
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
    setRiskAccepted(false); // Reset on new analysis

    try {
      const result = await analyzeIntent(selectedProject, {
        action,
        environment,
        outputPath,
        branch: "main", // Default for now
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

    // Safety check for failed tests before deployment
    const isDeployment = ["DEPLOY", "REDEPLOY"].includes(
      plan.action?.toUpperCase(),
    );
    const proj = projects.find((p) => p.id === selectedProject);
    const testStatus = proj?.deployed?.lastTestStatus;

    if (
      isDeployment &&
      (testStatus === "FAILED" || testStatus === "UNSTABLE")
    ) {
      const confirmed = window.confirm(
        "WARNING: The last test execution for this project failed (or was unstable). \n\n" +
          "It is highly recommended to fix failing tests before deploying. \n\n" +
          "Are you sure you want to proceed with this deployment?",
      );
      if (!confirmed) return;
    }

    setExecuting(true);
    try {
      const result = await executePlan(plan);
      startTracking(result.executionId, plan.action);
      setPlan(null);
      setRiskAccepted(false);
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
    <div className="p-8 mb-8 border bg-surface rounded-2xl border-slate-700 shadow-xl">
      <h3 className="mb-6 text-2xl font-bold tracking-tight">Deployment Control Center</h3>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <select
          className="w-full lg:w-64 px-4 py-3 text-lg text-white border-2 rounded-xl outline-none bg-slate-800 border-slate-700 focus:border-primary transition-all cursor-pointer"
          value={selectedProject}
          onChange={(e) => {
            setSelectedProject(e.target.value);
            setPlan(null);
            setRiskAccepted(false);
          }}
        >
          <option value="">Choose Project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {selectedProject &&
          (() => {
            const proj = projects.find((p) => p.id === selectedProject);
            return proj ? (
              <div className="flex flex-col justify-center flex-1 px-6 border-l border-slate-700/50 min-w-0">
                <div className="flex items-center mb-2 space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest shrink-0 ${
                      proj.type === "REACT"
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : proj.type === "NODE"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {proj.type || "APP"}
                  </span>
                  <span className="text-gray-300 text-sm font-medium truncate">
                    {proj.description || "No description provided"}
                  </span>
                </div>
                <a
                  href={proj.cloneUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm font-medium truncate hover:underline"
                >
                  Source Code Repository
                </a>
              </div>
            ) : null;
          })()}

      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 lg:grid-cols-2">
        <div
          className={`p-6 rounded-2xl border-2 h-full transition-all ${(() => {
            const proj = projects.find((p) => p.id === selectedProject);
            return proj?.deployed?.isLocked
              ? "bg-amber-500/5 border-amber-500/20"
              : "bg-slate-800/30 border-slate-700";
          })()}`}
        >
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm uppercase font-bold text-gray-400 tracking-[0.1em]">
              Build Destination Path
            </label>
            {(() => {
              const proj = projects.find((p) => p.id === selectedProject);
              return (
                proj?.deployed?.isLocked && (
                  <div className="flex items-center space-x-2 text-amber-500">
                    <Shield size={14} />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      Locked
                    </span>
                  </div>
                )
              );
            })()}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={outputPath}
              disabled={(() => {
                const proj = projects.find((p) => p.id === selectedProject);
                return proj?.deployed?.isLocked;
              })()}
              onChange={(e) => {
                setOutputPath(e.target.value);
                setSearchQuery(e.target.value);
              }}
              className={`flex-1 bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-base text-blue-300 focus:outline-none focus:border-primary transition-all ${(() => {
                const proj = projects.find((p) => p.id === selectedProject);
                return proj?.deployed?.isLocked
                  ? "opacity-60 cursor-not-allowed"
                  : "";
              })()}`}
              placeholder="Search or enter destination..."
            />
            <select
              className={`bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-base text-gray-300 focus:outline-none sm:max-w-[200px] ${(() => {
                const proj = projects.find((p) => p.id === selectedProject);
                return proj?.deployed?.isLocked
                  ? "opacity-50 cursor-not-allowed"
                  : "";
              })()}`}
              disabled={(() => {
                const proj = projects.find((p) => p.id === selectedProject);
                return proj?.deployed?.isLocked;
              })()}
              onChange={(e) => {
                setOutputPath(e.target.value);
                setSearchQuery(e.target.value);
              }}
              value={outputPath}
            >
              <option value="" disabled>
                Select Path ({filteredPaths.length})
              </option>
              {(filteredPaths.length > 0
                ? filteredPaths
                : ["/var/www/html", "/opt/deploy"]
              ).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          {(() => {
            const proj = projects.find((p) => p.id === selectedProject);
            return proj?.deployed?.isLocked ? (
              <p className="text-xs text-amber-400/80 mt-3 font-medium flex items-center">
                <AlertTriangle size={14} className="mr-2" />
                This path is pinned to the current configuration.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-3 font-medium italic">
                The folder where your project will be installed.
              </p>
            );
          })()}
        </div>

        <div className="flex flex-col gap-4">
          {(() => {
            const proj = projects.find((p) => p.id === selectedProject);
            const isDeployed = proj?.deployed?.[environment];
            const testStatus = proj?.deployed?.lastTestStatus;

            return (
              <>
                {isDeployed ? (
                  <div className="flex items-center justify-between p-6 border-2 bg-success/5 rounded-2xl border-success/20">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm uppercase font-bold text-success mb-2 tracking-[0.1em]">
                        Live Environment Info
                      </p>
                      <div className="flex items-center space-x-3 min-w-0">
                        <CheckCircle size={18} className="text-success shrink-0" />
                        <span className="text-base font-bold text-white truncate block">
                          {proj.deployed[`${environment}Path`]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 font-medium">
                        Last Modified:{" "}
                        {new Date(
                          proj.deployed[`${environment}Date`],
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="px-4 py-2 border-2 rounded-full bg-success/10 border-success/30 shrink-0 ml-4">
                      <span className="text-xs text-success font-bold uppercase tracking-widest">
                        Ready
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full p-6 text-sm font-medium italic text-gray-500 border-2 border-dashed bg-slate-800/10 rounded-2xl border-slate-700/50">
                    Environment analysis pending...
                  </div>
                )}

                {testStatus &&
                  (testStatus === "UNSTABLE" || testStatus === "FAILED") && (
                    <div className="flex items-start p-5 space-x-4 border-2 bg-warning/5 rounded-2xl border-warning/20">
                      <AlertTriangle
                        size={20}
                        className="text-warning shrink-0 mt-1"
                      />
                      <div>
                        <p className="text-sm uppercase font-bold text-warning tracking-[0.1em]">
                          Stability Notice
                        </p>
                        <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                          The most recent test execution reported issues. Please review the project stability before continuing.
                        </p>
                      </div>
                    </div>
                  )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(() => {
          const proj = projects.find((p) => p.id === selectedProject);
          const isDeployed = proj?.deployed?.[environment];

            return (
              <>
              {!isDeployed && (
                <button
                  onClick={() => handleIntent("DEPLOY")}
                  disabled={!selectedProject}
                  className="flex flex-col items-center justify-center p-6 transition-all border-2 bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-blue-500 rounded-2xl group disabled:opacity-30 disabled:grayscale"
                >
                  <div className="p-4 mb-3 text-blue-500 transition-all rounded-full bg-blue-500/10 group-hover:scale-110">
                    <Play size={32} />
                  </div>
                  <span className="text-base font-bold tracking-wide">Start Deployment</span>
                </button>
              )}

              <button
                onClick={() => handleIntent("TEST")}
                disabled={!selectedProject}
                className="flex flex-col items-center justify-center p-6 transition-all border-2 bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-green-500 rounded-2xl group disabled:opacity-30 disabled:grayscale"
              >
                <div className="p-4 mb-3 text-green-500 transition-all rounded-full bg-green-500/10 group-hover:scale-110">
                  <Shield size={32} />
                </div>
                <span className="text-base font-bold tracking-wide">Launch Tests</span>
              </button>

              <button
                onClick={() => handleIntent("REDEPLOY")}
                disabled={!selectedProject || !isDeployed}
                className="flex flex-col items-center justify-center p-6 transition-all border-2 bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-yellow-500 rounded-2xl group disabled:opacity-30 disabled:grayscale"
              >
                <div
                  className={`p-4 rounded-full ${isDeployed ? "bg-yellow-500/10 text-yellow-500" : "bg-slate-700/50 text-gray-600"} mb-3 group-hover:scale-110 transition-all`}
                >
                  <RefreshCw size={32} />
                </div>
                <span className="text-base font-bold tracking-wide">Update Project</span>
              </button>
              </>
            );
        })()}
      </div>

      {loading && (
        <div className="p-4 mt-6 text-center text-gray-400">
          <div className="animate-pulse">Analyzing intent...</div>
        </div>
      )}

      {plan &&
        (() => {
          const getActionTheme = (action) => {
            switch (action) {
              case "TEST":
                return {
                  color: "green",
                  text: "text-green-400",
                  bg: "bg-green-500/10",
                  border: "border-green-500/30",
                };
              default:
                return {
                  color: "blue",
                  text: "text-blue-400",
                  bg: "bg-blue-500/10",
                  border: "border-blue-500/30",
                };
            }
          };
          const theme = getActionTheme(plan.action);

          return (
            <div
              className={`mt-6 border ${theme.border} rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4 shadow-lg backdrop-blur-sm`}
            >
              <div
                className={`${theme.bg} p-4 border-b ${theme.border} flex justify-between items-center`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full bg-${theme.color}-500 animate-pulse`}
                  />
                  <span
                    className={`font-semibold ${theme.text} uppercase tracking-wider text-xs`}
                  >
                    {plan.action} Plan
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-900/40">
                {plan.approvalRequired && (
                  <div className="flex items-start p-5 mb-6 space-x-4 border-2 rounded-2xl bg-red-500/10 border-red-500/20">
                    <AlertTriangle
                      className="text-red-500 shrink-0 mt-1"
                      size={24}
                    />
                    <div>
                      <p className="text-base font-bold tracking-widest text-red-500 uppercase">
                        Important: Confirmation Required
                      </p>
                      <p className="mt-2 text-sm text-red-400 font-medium leading-relaxed">
                        This action will update the system. Please verify the project details below before confirming.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
                  <div>
                    <span className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Environment
                    </span>
                    <span className="text-xl text-white font-bold uppercase">
                      {plan.targetEnv}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Platform Node
                    </span>
                    <span className="text-xl text-white font-bold truncate block">
                      {plan.jenkinsJob}
                    </span>
                  </div>
                </div>

                <div className="p-6 mb-8 space-y-4 border-2 rounded-2xl bg-black/20 border-slate-800">
                  <p className="text-gray-400 text-sm uppercase tracking-[0.2em] font-bold mb-4">
                    Analysis Insights
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plan.reasoning.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-start space-x-3 text-base text-gray-200"
                      >
                        <CheckCircle
                          size={18}
                          className={`mt-1 ${theme.text} shrink-0`}
                        />
                        <span className="font-medium">{r}</span>
                      </div>
                    ))}
                  </div>
                  {plan.riskFlags.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-2 text-xs text-yellow-400"
                    >
                      <AlertTriangle
                        size={12}
                        className="mt-1 text-yellow-500 shrink-0"
                      />
                      <span>Risk: {r}</span>
                    </div>
                  ))}
                </div>

                {plan.approvalRequired && (
                  <div className="p-6 mb-8 transition-all border-2 rounded-2xl bg-slate-800 border-slate-700 hover:border-red-500/50">
                    <label className="flex items-start space-x-4 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-6 h-6 mt-1 text-red-500 rounded-lg border-slate-600 bg-slate-900 focus:ring-red-500 cursor-pointer"
                        checked={riskAccepted}
                        onChange={(e) => setRiskAccepted(e.target.checked)}
                      />
                      <span className="text-base leading-relaxed text-gray-300 font-medium select-none">
                        I have reviewed the information above and I confirm that this action is safe to execute on the platform.
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex justify-end pt-8 space-x-6 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setPlan(null);
                      setRiskAccepted(false);
                    }}
                    className="px-6 py-3 text-base font-bold text-gray-500 transition-colors hover:text-white uppercase tracking-widest"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={
                      executing || (plan.approvalRequired && !riskAccepted)
                    }
                    className={`${
                      plan.approvalRequired
                        ? "bg-red-600 hover:bg-red-700"
                        : plan.action === "TEST"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-primary hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                    } text-white px-6 sm:px-10 py-3 sm:py-4 rounded-2xl text-base sm:text-lg font-bold transition-all transform active:scale-95 flex items-center justify-center space-x-3 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto`}
                  >
                    {executing ? (
                      <RefreshCw size={22} className="animate-spin" />
                    ) : plan.action === "TEST" ? (
                      <Shield size={22} />
                    ) : (
                      <Zap size={22} />
                    )}
                    <span>
                      {executing
                        ? "Working..."
                        : plan.approvalRequired
                          ? "Confirm & Execute"
                          : "Start Process"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      {/* End of content */}
    </div>
  );
};

export default ActionPanel;
