/********************************************************************************
*  WEB322 – Assignment 04
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Nikita Chizhikov Student ID: 173740234 Date: June 28, 2025
*
*  URL: https://web-322-apps.vercel.app/
********************************************************************************/
const path = require('path');
const express = require('express');
const projectData = require('./modules/projects');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

const staticPath = path.join(__dirname, 'static');
console.log(`Static path set to: ${staticPath}`); // Debug static path

app.use('/static', express.static(staticPath, {
    setHeaders: (res, filePath) => {
        console.log(`Serving static file from: ${filePath} (mapped to ${staticPath})`); // Enhanced log
    }
}));


app.get('/test-static', (req, res) => {
    res.sendFile(path.join(staticPath, 'css/main.css'));
});
  
app.get('/', (req, res) => {
    res.render("home");
});

app.get('/about', (req, res) => {
    res.render("about");
});

app.get('/solutions/projects', (req, res) => {
    const sector = req.query.sector;
    if (sector) {
        projectData.getProjectsBySector(sector)
            .then(projects => {
                if (projects.length === 0) {
                    res.status(404).render("404", { message: "No projects found for the specified sector" });
                } else {
                    res.render("projects", { projects: projects });
                }
            })
            .catch(err => {
                res.status(404).render("404", { message: err.message || "Error retrieving projects by sector" });
            });
    } else {
        projectData.getAllProjects()
            .then(projects => {
                res.render("projects", { projects: projects });
            })
            .catch(err => {
                res.status(404).render("404", { message: err.message || "Error retrieving all projects" });
            });
    }
});

app.get('/solutions/projects/:id', (req, res) => {
    const projectId = parseInt(req.params.id);
    projectData.getProjectById(projectId)
        .then(project => {
            res.render("project", { project: project });
        })
        .catch(err => {
            res.status(404).render("404", { message: err.message || "No project found for the specified ID" });
        });
});

app.get('/test-image', (req, res) => {
    res.sendFile(path.join(staticPath, '/images/dog.jpg'));
});

app.use((req, res) => {
    res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for" });
});

projectData.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Server listening on port ${HTTP_PORT}`);
        });
    })
    .catch((err) => {
        console.log(`Failed to start server: ${err}`);
    });