/********************************************************************************
*  WEB322 – Assignment 05
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
const projects = require('./modules/projects');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

const staticPath = path.join(__dirname, 'static');
console.log(`Static path set to: ${staticPath}`); 
app.use('/static', express.static(staticPath, {
    setHeaders: (res, filePath) => {
        console.log(`Serving static file from: ${filePath} (mapped to ${staticPath})`); 
    }
}));


app.use((req, res, next) => {
    if (req.url.includes('/static/')) {
        console.log(`DEBUG: Static request for: ${req.url}`);
    }
    next();
});

app.use(express.urlencoded({ extended: true }));
  
app.get('/', (req, res) => {
    res.render("home");
});

app.get('/about', (req, res) => {
    res.render("about");
});

app.get('/solutions/projects', (req, res) => {
    const sector = req.query.sector;
    if (sector) {
        projects.getProjectsBySector(sector)
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
        projects.getAllProjects()
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
    projects.getProjectById(projectId)
        .then(project => {
            res.render("project", { project: project });
        })
        .catch(err => {
            res.status(404).render("404", { message: err.message || "No project found for the specified ID" });
        });
});

app.get('/solutions/editProject/:id', (req, res) => {
  Promise.all([projects.getProjectById(req.params.id), projects.getAllSectors()])
    .then(([project, sectors]) => res.render('editProject', { project, sectors }))
    .catch((err) => res.status(404).render('404', { message: err }));
});

app.get('/solutions/addProject', (req, res) => {
  projects.getAllSectors()
    .then((sectors) => res.render('addProject', { sectors }))
    .catch((err) => res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` }));
});

app.get('/solutions/deleteProject/:id', (req, res) => {
  projects.deleteProject(req.params.id)
    .then(() => res.redirect('/solutions/projects'))
    .catch((err) => res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` }));
});

app.post('/solutions/editProject', (req, res) => {
  projects.editProject(req.body.id, req.body)
    .then(() => res.redirect('/solutions/projects'))
    .catch((err) => res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` }));
});

app.post('/solutions/addProject', (req, res) => {
  projects.addProject(req.body)
    .then(() => res.redirect('/solutions/projects'))
    .catch((err) => res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` }));
});


app.use((req, res) => {
    res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for" });
});


projects.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Server listening on port ${HTTP_PORT}`);
        });
    })
    .catch((err) => {
        console.log(`Failed to start server: ${err}`);
    });