const githubService = require("../services/githubService");

// POST /api/github/sync
const syncProjects = async (req, res) => {
  try {
    const projects = await githubService.fetchProjects();
    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    console.error("GitHub sync failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  syncProjects,
};
