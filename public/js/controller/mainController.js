/*global app, confirm, mod*/

mod.controller('mainController', ['logger',
                                function (logger) {
        'use strict';
        var that = this;

        /*
        // bind service instance to model
        that.currentUser = currentUser;

        that.userLogin = function () {
            // pass handling (un-)successful login as completion
            couch.getUser(that.user.name, function (registeredUser) {
                logger.logConsole(registeredUser);
                if (registeredUser !== null && registeredUser.password === app.MD5(that.user.password)) {
                    logger.logConsole("Successfully logged in!");
                    currentUser.name = registeredUser.name;

                    // clear fields
                    that.user.name = "";
                    that.user.password = "";
                } else {
                    logger.logAlert("Authentication failed!");
                }
            });
        };
        that.userLogout = function () {
            // unset currently logged in user
            logger.logAlert("Thanks for visiting, bye!");
            currentUser.name = null;
        };
        that.userRegister = function () {
            // retrieve user to check whether he already exists
            couch.getUser(that.user.name, function (registeredUser) {
                if (registeredUser !== null) {
                    logger.logAlert("A user with that username already exists!");
                    return;
                }

                // user doesnt exist, create new one
                var newUser = new app.User(that.user.name, app.MD5(that.user.password));
                couch.addUser(newUser);

                logger.logAlert("New user " + that.user.name + " created!");

                // log in as new user
                currentUser.name = newUser.name;

                // clear fields
                that.user.name = "";
                that.user.password = "";
            });
        };
        that.userDelete = function () {
            if (!confirm("Are you sure you want to delete your account?")) {
                return;
            }

            // tell db about it
            couch.removeUser(currentUser, that.userLogout);
        };
        */
    }]);
