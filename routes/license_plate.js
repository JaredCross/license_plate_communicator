var express = require('express');
var router = express.Router();
var db = require('monk')(process.env.DB_HOST);
var usersCollection = db.get('users');
var bcrypt = require('bcrypt');
var functions = require('../src/lib.js');

router.get('/license_plate', function (req, res, next) {
  if (req.cookies.userID) {
    res.redirect('/license_plate/' + req.cookies.userID + '/user_home')

  } else {
    res.render('license_plate/index', {title : 'RoadRage'});
  }
});

router.get('/license_plate/sign_up', function (req, res, next) {
  res.render('license_plate/new', {title : 'RoadRage'});
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
                                        lastName: lastName, email: emailAddress, title : 'RoadRage'});
    } else if (errorArray.length != 0) {
        res.render('license_plate/new', {errorArray: errorArray, firstName: firstName,
                                          lastName: lastName, email: emailAddress, title : 'RoadRage'});
    } else {
        //messagesDM for future expansion of direct messages
        var hashedPass = bcrypt.hashSync(password, 8);
        usersCollection.insert({firstName: req.body.first_name,
                                lastName: req.body.last_name,
                                emailAddress: req.body.email,
                                password: hashedPass,
                                messagesLPM : [],
                                messagesDM: [],
                                licensePlate: "",
                                sentMessagesLPM: []}, function (err, data) {
        usersCollection.findOne({emailAddress: emailAddress}, function(err, data) {
            res.cookie('userID', data._id);
            res.redirect('/license_plate/'+ data._id +'/register_lp');
        });
      });
  }
  });
});

router.get('/license_plate/sign_in', function (req, res, next) {
  res.render('license_plate/sign_in', {title : 'RoadRage'});
});

router.get('/license_plate/logout', function (req, res, next) {
  res.clearCookie("userID");
  res.redirect('/license_plate');
})

router.post('/license_plate/sign_in', function (req, res, next) {
  var username = req.body.email.toLowerCase();
  usersCollection.findOne({emailAddress: username}, function (err, data) {
    if (data) {
      if (bcrypt.compareSync(req.body.password, data.password)) {
        res.cookie('userID', data._id);
        if (data.licensePlate != "") {
          res.redirect('/license_plate/'+ data._id +'/user_home');
        } else {
          res.redirect('/license_plate/' + data._id + '/register_lp');
        }
      } else {
        var errorArray = ['Incorrect username or password'];
        res.render('license_plate/sign_in', {errorArray: errorArray,
                                              email: req.body.email, title : 'RoadRage'});
      }
    } else {
      var errorArray = ['Incorrect username or password'];
      res.render('license_plate/sign_in', {errorArray: errorArray,
                                            email: req.body.email, title : 'RoadRage'});
    }

  });

});

router.get('/license_plate/:id/user_home', function (req, res, next) {
  if(req.cookies.userID){
    usersCollection.findOne({_id: req.params.id}, function (err, data) {
      res.render('license_plate/user_home', {userData: data, title : 'RoadRage'});
    });
  } else {
    res.redirect('/license_plate/sign_in');
  }
});

router.get('/license_plate/:id/sendLPM', function (req, res, next) {
  if(req.cookies.userID) {
    usersCollection.findOne({_id: req.params.id}, function (err, data) {
      res.render('license_plate/sendLPM', {userData: data, title : 'RoadRage'});
    });
  } else {
    res.redirect('/license_plate/sign_in');
  }
});

//Post to send License Plate Message
router.post('/license_plate/:id/sendLPM', function (req, res, next) {
  if (req.cookies.userID) {
    var errorArray = functions.sendLPMVerification(req.body.toLicensePlate, req.body.state, req.body.lpMessage);
    var randomID = bcrypt.hashSync(Date.now().toString(), 4);
    var messageDate = Date.now();
    var plateStateCombine = req.body.toLicensePlate.toString().toLowerCase() + req.body.state;
    usersCollection.findOne({ _id : req.params.id}, function (err, data) {
      usersCollection.findOne({licensePlate : plateStateCombine}, function (err, recipient) {
        if (errorArray.length != 0) {
          res.render('license_plate/sendLPM', {errorArray : errorArray, userData : data, title : 'RoadRage'})
        } else if (!recipient) {
          errorArray = ["Sorry, no user with the License Plate Combo exists"];
          res.render('license_plate/sendLPM', {errorArray : errorArray, userData : data, title : 'RoadRage'})
        } else {
          usersCollection.update({licensePlate: plateStateCombine},
                                  {
                                    $push: { "messagesLPM" :
                                            {"message": req.body.lpMessage,
                                             "date" : messageDate,
                                             "id" : randomID }}
                                  });
          usersCollection.update({ _id : req.params.id},
                                  {
                                    $push : { "sentMessagesLPM" :
                                            {"message" : req.body.lpMessage,
                                             "date" : messageDate,
                                             "id" : randomID,
                                             "toPlate" : req.body.toLicensePlate,
                                             "toState" : req.body.state}
                                             }
                                  });
          res.redirect('/license_plate/'+ req.params.id +'/user_home');
        }
      });
    });
  } else {
    res.redirect('/license_plate/sign_in');
  }
});


router.post('/license_plate/:id/delete_lpmessage', function (req, res, next) {
  usersCollection.update(
                         {_id : req.params.id},
                         {$pull:
                           { messagesLPM :
                                { id : req.body.hiddenID}
                           }
                         });
  res.redirect('/license_plate/' + req.params.id + '/user_home');
});

router.get('/license_plate/:id/register_lp', function (req, res, next) {
  if (req.cookies.userID) {
    usersCollection.findOne({_id: req.params.id}, function (err, data) {
      res.render('license_plate/register_lp', {userData: data, title : 'RoadRage'});
    });
  } else {
      res.redirect('/license_plate/sign_in');
  }
});

router.post('/license_plate/:id/register_lp', function (req, res, next) {
  if (req.cookies.userID) {
    var onlyPlate = req.body.lpNumber.toLowerCase();
    var plateStateCombine = onlyPlate + req.body.state;
    usersCollection.findOne({_id: req.params.id}, function (err, data) {
      var errorArray = functions.registerLPVerification(onlyPlate, req.body.state)
      usersCollection.findOne({licensePlate : plateStateCombine }, function (err, lpInUse) {
        if (lpInUse) {
          errorArray.push('Sorry someone is already using that License Plate Number')
          res.render('license_plate/register_lp', {errorArray : errorArray, userData : data, title : 'RoadRage'})
        } else if (errorArray.length != 0) {
            res.render('license_plate/register_lp', {errorArray : errorArray, userData : data, title : 'RoadRage'})
        } else {
            usersCollection.update({_id: req.params.id},
                                    {
                                      $set: {licensePlate: plateStateCombine,
                                              onlyPlate : onlyPlate,
                                              onlyState : req.body.state}
                                    }, function (err, data) {
                res.redirect('/license_plate/'+ req.params.id +'/user_home');
            });
          }
        });
      });
  } else {
    res.redirect('/license_plate/sign_in');
  }
});

router.post('/license_plate/:id/update_lp', function (req, res, next) {
  if (req.cookies.userID) {
    var onlyPlate = req.body.lpNumber.toLowerCase();
    var plateStateCombine = onlyPlate + req.body.state;
    usersCollection.findOne({_id: req.params.id}, function (err, data) {
      var errorArray = functions.registerLPVerification(onlyPlate, req.body.state)
      usersCollection.findOne({licensePlate : plateStateCombine }, function (err, lpInUse) {
        if (lpInUse) {
          errorArray.push('Sorry someone is already using that License Plate Number')
          res.render('license_plate/manage_plate', {errorArray : errorArray, userData : data, title : 'RoadRage'})
        } else if (errorArray.length != 0) {
            res.render('license_plate/manage_plate', {errorArray : errorArray, userData : data, title : 'RoadRage'})
        } else {
            usersCollection.update({_id: req.params.id},
                                    {
                                      $set: {licensePlate: plateStateCombine,
                                              onlyPlate : onlyPlate,
                                              onlyState : req.body.state}
                                    }, function (err, data) {
                res.redirect('/license_plate/'+ req.params.id +'/user_home');
            });
          }
        });
      });
  } else {
    res.redirect('/license_plate/sign_in');
  }
});

router.get('/license_plate/:id/manage_plate', function (req, res, next) {
  if(req.cookies.userID) {
    usersCollection.findOne({ _id: req.params.id}, function (err, data) {
      if (data.licensePlate != "") {
        res.render('license_plate/manage_plate', {userData : data, title : 'RoadRage'});
      } else {
        res.redirect('/license_plate/' + data._id + '/register_lp')
      }
    });
  } else {
    res.redirect('/license_plate/sign_in');
  }
});

router.post('/license_plate/:id/delete_plate', function (req, res, next) {
  usersCollection.update({ _id : req.params.id},
                          {
                            $set :
                              {
                               licensePlate : "",
                               onlyPlate : "",
                               onlyState : ""
                              }
                          });
    res.redirect('/license_plate/'+req.params.id+'/register_lp');
})

router.get('/license_plate/:id/sent_messages', function (req, res, next) {
  usersCollection.findOne({ _id : req.params.id}, function (err, data) {
    res.render('license_plate/sent_messages', {userData : data, title : 'RoadRage'});
  });

});


router.post('/license_plate/:id/delete_sentLPMessage', function (req, res, next) {
  usersCollection.update(
                         {_id : req.params.id},
                         {$pull:
                           { sentMessagesLPM :
                                { id : req.body.hiddenID}
                           }
                         });
    res.redirect('/license_plate/' + req.params.id + '/sent_messages')
})


module.exports = router;
