var express = require('express');
var router = express.Router();
var db = require('monk')(process.env.DB_HOST);
var usersCollection = db.get('users');
var bcrypt = require('bcrypt');
var functions = require('../src/lib.js');

router.get('/', function (req, res, next) {
  res.render('license_plate/index');
});

router.get('/sign_up', function (req, res, next) {
  res.render('license_plate/new');
});

router.post('/sign_up', function (req, res, next) {
  var firstName = req.body.first_name;
  var lastName = req.body.last_name;
  var emailAddress = req.body.email;
  var password = req.body.password;
  var confirmPassword = req.body.confirm;

  var errorArray = functions.newVerification(firstName, lastName, emailAddress,
                                                    password, confirmPassword);

  usersCollection.insert({firstName: req.body.first_name,
                          lastName: req.body.last_name,
                          emailAddress: req.body.email,
                          password: req.body.password});
  res.redirect('/');

});








module.exports = router;
