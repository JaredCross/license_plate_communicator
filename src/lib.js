module.exports = {

  newVerification: function (firstName, lastName, emailAddress, password, confirmPassword) {
    var errorMessageArray;

    if (firstName.trim() === '') {
      errorMessageArray.push('First Name cannot be blank');
    }
    if (lastName.trim() === '') {
      errorMessageArray.push('Last Name cannot be blank');
    }
    
  }
}
