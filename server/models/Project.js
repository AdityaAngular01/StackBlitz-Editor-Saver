const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
	userId: String,
	projectName: String,
	stackblitzData: {
		files: Object, // Store all files as key-value pairs
		title: String,
		description: String,
		template: String,
	},
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Project", projectSchema);
