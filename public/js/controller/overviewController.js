
/*global app, confirm, mod*/

mod.controller('overviewController', ['logger', 'subscriptions',
                                function (logger, subscriptions) {
        'use strict';

        // continuous access to caller and some Important Objects
        var that = this;

        that.shows = [];

        subscriptions.getAllSubscriptions()
          .then(function (resp) {
            if (resp.status !== 200) {
              logger.logConsole('Unexpected response code ' + resp.status + '!');
              return;
            }

            logger.logConsole('Response message: ' + resp.data.message);
            that.shows = resp.data.data;
          });

        /*
        // own data: editing post
        that.editingPost = null;
        that.editingPostIndex = null;

        that.possiblePostsPerPage = [5, 10, 50, 100];
        that.postsPerPage = 5;
        that.currentPage = 1;
        that.pageCount = function () {
            return that.posts ? Math.ceil(that.posts.length / that.postsPerPage) : 0;
        };

        // initialization - load posts
        // pass handling of retrieved data as completion
        couch.getPosts(function (result) {
            that.posts = result.sort(function (a, b) {
                var c = new Date(a.createdOn), // only sort by creation date, not by editing date
                    d = new Date(b.createdOn);
                return c.getTime() > d.getTime();
            });
            that.updateVisiblePosts();
        });

        ///////////////
        // FUNCTIONS //
        ///////////////
        that.submitPost = function () {
            if (that.editingPost !== null) {
                logger.logAlert("Submitting updated post");

                // edit post
                that.editingPost.editPost(that.newPost.title, that.newPost.content);
                // update post on db
                couch.editPost(that.editingPost);
                // (re-)insert post in posts-list
                that.posts.splice(that.editingPostIndex, 0, that.editingPost);

                // we're no longer editing a post
                that.editingPost = null;
                that.editingPostIndex = null;
            } else {
                // create new post
                var post = new app.Post(that.newPost.title, that.newPost.content, currentUser ? currentUser.name : "anonymous");
                logger.logConsole("Submitting post:\n-> Title: " + (that.newPost.title || "") + "\n-> Content: " + (that.newPost.content || ""));
                // update db and model
                couch.addPost(post);
                that.posts.push(post);
                that.moveToPage(that.pageCount());
            }

            // clear fields
            that.newPost.title = "";
            that.newPost.content = "";
        };
        that.editPost = function (post) {
            // set post editing variables
            that.editingPost = post;
            that.editingPostIndex = that.posts.indexOf(post);

            // remove post from list
            that.posts.splice(that.editingPostIndex, 1);

            // fill fields with current values of post to edit
            that.newPost = that.newPost || {};
            that.newPost.title = post.title;
            that.newPost.content = post.content;

            logger.logConsole("Editing post:\n-> Title: " + (that.newPost.title || "") + "\n-> Content: " + (that.newPost.content || ""));
        };
        that.cancelEditing = function () {
            logger.logConsole("Cancelling edit");

            // (re-)insert post in posts-list
            that.posts.splice(that.editingPostIndex, 0, that.editingPost);

            // we're no longer editing a post
            that.editingPost = null;
            that.editingPostIndex = null;

            // clear fields
            that.newPost.title = "";
            that.newPost.content = "";
        };
        that.deletePost = function (post) {
            if (confirm("Are you sure you want to delete the post?")) {
                logger.logConsole("Deleting post:\n-> Title: " + (post.title || "") + "\n-> Content: " + (post.content || ""));

                // tell db about it
                couch.deletePost(post);
                // remove post from list
                that.posts = that.posts.filter(function (p) {
                    return post.getId() !== p.getId();
                });
                that.updateVisiblePosts();
            }
        };
        that.updateVisiblePosts = function () {
            // assign to two-way bound variable
            that.visiblePosts = that.posts.slice(that.postsPerPage * (that.currentPage - 1), that.postsPerPage * that.currentPage);
            if (that.currentPage > that.pageCount()) {
                that.moveToPage(that.pageCount());
            }
        };
        that.moveToPage = function (page) {
            // update current page and update visible posts
            logger.logConsole("Moving to page " + page);
            that.currentPage = page;
            that.updateVisiblePosts();
        };
        */
    }]);
