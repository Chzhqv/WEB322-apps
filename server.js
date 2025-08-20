/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Nikita Chizhikov Student ID: 173740234 Date: Aug 02, 2025
*
*  URL: https://web-322-apps.vercel.app/
********************************************************************************/
const path = require('path');
const express = require('express')
const projectData = require('./modules/projects');
require('dotenv').config();
const authData = require('./modules/auth-service');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

const clientSessions = require('client-sessions');

app.use(clientSessions({
  cookieName: 'session',
  secret: 'abczxc123ff' ,
  duration: 2 * 60 * 1000, // 2 min
  activeDuration: 60 * 1000 // 1min
}));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

const staticPath = path.join(__dirname, 'static');
console.log(`Static path set to: ${staticPath}`); 
app.use('/static', express.static(staticPath, {
    setHeaders: (res, filePath) => {
        console.log(`Serving static file from: ${filePath} (mapped to ${staticPath})`); 
    }
}));


app.use((req, res, next) => { // convenience to use res
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) { //gatekeeper
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

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


app.get('/solutions/editProject/:id', (req, res) => {
  Promise.all([projectData.getProjectById(req.params.id),
     projectData.getAllSectors()])
    .then(([project, sectors]) => res.render('editProject', { project, sectors }))
    .catch((err) => res.status(404).render('404', { message: err }));
});

app.get('/solutions/addProject', ensureLogin, (req, res) => {
  projectData.getAllSectors()
    .then((sectors) => res.render('addProject', { sectors }))
    .catch((err) => res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` }));
});



app.post('/solutions/editProject', ensureLogin, (req, res) => {
  projectData.editProject(req.body.id, req.body)
    .then(() => res.redirect('/solutions/projects'))
    .catch((err) => res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` }));
});

app.post('/solutions/addProject', ensureLogin, (req, res) => {
  projectData.addProject(req.body)
    .then(() => res.redirect('/solutions/projects'))
    .catch((err) => res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` }));
});


// GET /login
app.get('/login', (req, res) => {
  res.render('login', { errorMessage: "", userName: "" });
});

// GET /register
app.get("/register", (req, res) => {
    res.render("register", { errorMessage: "", successMessage: "", userName: "" });
});

// POST /register - user registration
app.post("/register", (req, res) => {
    authData.registerUser(req.body)
       .then(() => {
            res.render("register", { errorMessage: "", successMessage: "User created", userName: "" });
        })
       .catch(err => {
            res.render("register", { errorMessage: err, successMessage: "", userName: req.body.userName });
        });
});

// POST /login
app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
       .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/solutions/projects');
        })
       .catch(err => {
            res.render("login", { errorMessage: err, userName: req.body.userName });
        });
});

// GET /logout
app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect('/');
});


// GET /userHistory
app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});



app.use((req, res) => {
    res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for" });
});


projectData.initialize()
   .then(authData.initialize) 
   .then(function () {
        app.listen(HTTP_PORT, () => {
            console.log(`app listening on: ${HTTP_PORT}`);
        });
    }).catch(function (err) {
        console.log(`unable to start server: ${err}`);
    });

//UPLOAD TO VERCEL
//V4 VERCEL CANT SEE MY COMMITS
  