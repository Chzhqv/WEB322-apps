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
********************************************************************************/
const path = require('path');
const express = require('express');
const fs = require('fs');
const projectData = require('./modules/projects');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;


const staticPath = path.join(__dirname, 'static');
app.use('/static', express.static(staticPath, {
    setHeaders: (res, filePath) => {
        console.log(`Serving static file from: ${filePath} (mapped to ${staticPath})`);
    }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/home.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/about.html'));
});

app.get('/solutions/projects', (req, res) => {
    const sector = req.query.sector;
    if (sector) {
        projectData.getProjectsBySector(sector)
            .then(projects => {
                if (projects.length === 0) {
                    res.status(404).json({ error: 'No projects found for the specified sector' });
                } else {
                    res.json(projects);
                }
            })
            .catch(err => {
                res.status(404).json({ error: err });
            });
    } else {
        projectData.getAllProjects()
            .then(projects => {
                res.json(projects);
            })
            .catch(err => {
                res.status(404).json({ error: err });
            });
    }
});

app.get('/solutions/projects/:id', (req, res) => {
    const projectId = parseInt(req.params.id);
    projectData.getProjectById(projectId)
        .then(project => {
            res.json(project);
        })
        .catch(err => {
            res.status(404).json({ error: err });
        });
});

app.get('/test-image', (req, res) => {
    res.sendFile(path.join(staticPath, '/images/dog.jpg'));
});

app.get('/debug-static', (req, res) => {
    res.send('Static folder path: ' + staticPath);
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '/views/404.html'));
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