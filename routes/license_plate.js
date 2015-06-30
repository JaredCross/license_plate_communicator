var express = require('express');
var router = express.Router();
var db = require('monk')(process.env.DB_HOST);
var usersCollection = db.get('users');
var bcrypt = require('bcrypt');
var functions = require('../src/lib.js');

router.get('/license_plate', function (req, res, next) {
  res.render('license_plate/index');
});

router.get('/license_plate/sign_up', function (req, res, next) {
  res.render('license_plate/new');
});

router.post('/license_plate/sign_up', function (req, res, next) {
  var firstName = req.body.first_name;
  var lastName = req.body.last_name;
  var emailAddress = req.body.email.toLowerCase();
  var password = req.body.password;
  var confirmPassword = req.body.confirm;

  var errorArray = functions.newVerification(firstName, lastName, emailAddress,
                                             password, confirmPassword);

  usersCollection.findOne({emailAddress: emailAddress}, function (err, data) {
    if(data){
      errorArray =["Sorry, that email address is already in use."];
      res.render('license_plate/new', {errorArray: errorArray, firstName: firstName,
                                        lastName: lastName, email: emailAddress});
    } else if (errorArray.length != 0) {
        res.render('license_plate/new', {errorArray: errorArray, firstName: firstName,
                                          lastName: lastName, email: emailAddress});
    } else {
        var hashedPass = bcrypt.hashSync(password, 8);
        usersCollection.insert({firstName: req.body.first_name,
                                lastName: req.body.last_name,
                                emailAddress: req.body.email,
                                password: hashedPass});
        usersCollection.findOne({emailAddress: emailAddress}, function(err, data) {
            res.cookie('userID', data._id);
            res.redirect('/license_plate/'+ data._id +'/user_home');
        });
    }
});
});

router.get('/license_plate/sign_in', function (req, res, next) {
  res.render('license_plate/sign_in');
});

router.post('/license_plate/sign_in', function (req, res, next) {
  usersCollection.findOne({emailAddress: req.body.email}, function (err, data) {
    if (data) {
      if (bcrypt.compareSync(req.body.password, data.password)) {
        res.cookie('userID', data._id);
        res.redirect('/license_plate/'+ data._id +'/user_home');
      } else {
        var errorArray = ['Incorrect username or password'];
        res.render('license_plate/sign_in', {errorArray: errorArray,
                                              email: req.body.email});
      }
    } else {
      var errorArray = ['Incorrect username or password'];
      res.render('license_plate/sign_in', {errorArray: errorArray,
                                            email: req.body.email});
    }

  });

});

router.get('/:id/user_home', function (req, res, next) {
  if(req.cookies.userID){
    usersCollection.findOne({_id: req.params.id}, function (err, data) {
      res.render('license_plate/user_home', {userData: data});
    });
  } else {
    res.redirect('/license_plate/sign_in');
  }
});








module.exports = router;
