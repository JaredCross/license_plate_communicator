var express = require('express');
var router = express.Router();
var db = require('monk')(process.env.DB_HOST);
var usersCollection = db.get('users');
var bcrypt = require('bcrypt');

router.get('/', function (req, res, next) {
  res.render('license_plate/index');
});

router.get('/sign_up', function (req, res, next) {
  res.render('license_plate/new');
});

router.post('/sign_up', function (req, res, next) {
  usersCollection.insert({firstName: req.body.first_name,
                          lastName: req.body.last_name,
                          emailAddress: req.body.email,
                          password: req.body.password});
  res.redirect('/');

});








module.exports = router;
