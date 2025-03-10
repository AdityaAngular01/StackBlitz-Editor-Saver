const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const Project = require("./models/Project");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" })); // Increase payload size limit

// Connect to MongoDB
mongoose
	.connect("mongodb://localhost:27017/stackblitzDB", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("MongoDB Connected"))
	.catch((err) => console.log(err));

// Save Project API
app.post("/save-project", async (req, res) => {
	const { userId, projectName, stackblitzData } = req.body;

	// Validate project data
	if (!userId || !projectName || !stackblitzData || !stackblitzData.files) {
		return res
			.status(400)
			.json({ success: false, message: "Invalid project data" });
	}

	try {
		let project = await Project.findOne({ userId, projectName });

		if (project) {
			project.stackblitzData = stackblitzData;
			await project.save();
		} else {
			project = new Project({ userId, projectName, stackblitzData });
			await project.save();
		}

		res.json({ success: true, projectId: project._id });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

// Fetch Project API
app.get("/get-project/:userId/:projectName", async (req, res) => {
	const { userId, projectName } = req.params;

	try {
		const project = await Project.findOne({ userId, projectName });

		if (!project) {
			return res
				.status(404)
				.json({ success: false, message: "Project not found" });
		}

		res.json({ success: true, stackblitzData: project.stackblitzData });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
