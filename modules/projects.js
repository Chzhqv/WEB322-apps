const projectData = require("../data/projectData");
const sectorData = require("../data/sectorData");

let projects = [];

function initialize() {
    return new Promise((resolve, reject) => {
        try {
            projectData.forEach(project => {
                const sector = sectorData.find(sector => sector.id === project.sector_id);
                projects.push({
                    ...project,
                    sector: sector ? sector.sector_name : "Unknown Sector"
                });
            });
            resolve();   
        } catch (err) {
            reject("Unable to initialize projects");
        }
    });
}



function getAllProjects() {
    return new Promise((resolve, reject) => {
        try {
            if (projects.length > 0) {
                resolve(projects);
            } else {
                reject("No projects available");
            }
        } catch (err) {
            reject("Error retrieving projects");
        }
    });
}

function getProjectById(projectId) {
    return new Promise((resolve, reject) => {
        try {
            const project = projects.find(p => p.id === projectId);
            if (project) {
                resolve(project);
            } else {
                reject("Unable to find requested project");
            }
        } catch (err) {
            reject("Error retrieving project");
        }
    });
}

function getProjectsBySector(sector) {
    return new Promise((resolve, reject) => {
        try {
            const filteredProjects = projects.filter(project => 
                project.sector.toLowerCase().includes(sector.toLowerCase())
            );
            if (filteredProjects.length > 0) {
                resolve(filteredProjects);
            } else {
                reject("Unable to find requested projects");
            }
        } catch (err) {
            reject("Error filtering projects by sector");
        }
    });
}

module.exports = { initialize, getAllProjects, getProjectById, getProjectsBySector };
