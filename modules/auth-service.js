const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: {//unique usernames
        type: String,
        required: true,
        unique: true 
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    loginHistory: [{
        dateTime: {
            type: String
        },
        userAgent: {
            type: String
        }
    }]
});

let User; 

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err) => {
            reject(err); 
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise((resolve, reject) => {
        if (userData.password!== userData.password2) {
            return reject("Passwords do not match");
        }

        bcrypt.hash(userData.password, 10) // Hash the password using a Salt, 10 rounds
           .then(hash => {
                userData.password = hash; // Replacing plaintext password with the hash
                let newUser = new User(userData);
                newUser.save()
                   .then(() => {
                        resolve();
                    })
                   .catch(err => {
                        if (err.code === 11000) {
                            reject("User Name already taken");
                        } else {
                            reject(`There was an error creating the user: ${err}`);
                        }
                    });
            })
           .catch(err => {
                reject("There was an error encrypting the password");
            });
    });
};


module.exports.checkUser = function (userData) {
    return new Promise((resolve, reject) => {
        // findOne() to get a single user document directly, not by array
        User.findOne({ userName: userData.userName }).exec()
          .then(user => {
                if (!user) {
                    return reject(`Unable to find user: ${userData.userName}`);
                }
                // BUG with crash: The User.find(), returns an array of users ([userObject]), not a a single object. 

                // FIX v1.1 --- Code should access password property from the array itself (users.password), but it is 'undefined'
                //              The bcrypt.compare() function then failed with an "Illegal arguments: string, undefined" error.
                //              Try to initialize new variable to store array. (let users = user). 

                // FIX v1.2 --- The query was changed from User.find() to User.findOne(). I found this correct Mongoose method
                //              to retrieve a unique document, because it returns a single object directly.
                
                // NOW (user) is the actual document object from the database.
                bcrypt.compare(userData.password, user.password)
                  .then(result => {
                        if (result === true) {
                            if (user.loginHistory.length >= 8) {
                                user.loginHistory.pop();
                            }
                            user.loginHistory.unshift({
                                dateTime: new Date().toString(),
                                userAgent: userData.userAgent
                            });

                            // Update the document in the database.
                            User.updateOne(
                                { userName: user.userName },
                                { $set: { loginHistory: user.loginHistory } }
                            ).exec()
                              .then(() => {
                                    // Resolve the promise with the full user object.
                                    resolve(user);
                                })
                              .catch(err => {
                                    reject(`There was an error verifying the user: ${err}`);
                                });
                        } else {
                            // Passwords do not match.
                            reject(`Incorrect Password for user: ${user.userName}`);
                        }
                    })
                  .catch(err => {
                        console.error("Bcrypt comparison error:", err);
                        reject("An error occurred during the password comparison process.");
                   });
            })
          .catch(err => {
                // Catch handles errors from the database query.
                reject(`Error finding user: ${userData.userName}`);
            });
    });
};