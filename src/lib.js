module.exports = {

  newVerification: function (firstName, lastName, email, password, confirm) {
    var errorMessageArray = [];
    var re = /\S+@\S+\.\S+/;

    if (firstName.trim() === '') {
      errorMessageArray.push('First Name cannot be blank');
    }
    if (firstName.trim() != firstName) {
      errorMessageArray.push("Please make sure your first name doesn't include"
                              + "e xtra white spaces");
    }
    if (lastName.trim() === '') {
      errorMessageArray.push('Last Name cannot be blank');
    }
    if (lastName.trim() != lastName) {
      errorMessageArray.push("Please make sure your last name doesn't include"
                              + "e xtra white spaces");
    }
    if (email.trim() === '') {
      errorMessageArray.push('Email cannot be blank');
    } else if(!re.test(email)){
        errorMessageArray.push('Invalid email format')
    }
    if (email.trim() != email) {
      errorMessageArray.push("Please make sure your email doesn't include"
                              + " extra white spaces");
    }
    if (password.trim() === '') {
      errorMessageArray.push('Password cannot be blank');
    }
    if (password.trim() != password) {
      errorMessageArray.push("Please make sure your password doesn't include"
                              + " extra white spaces");
    }
    if (confirm.trim() === '') {
      errorMessageArray.push('Password confirmation cannot be blank');
    } else if(password.length < 8) {
        errorMessageArray.push('Please make sure password is at least 8 characters long');
    }
    if (password != confirm) {
      errorMessageArray.push('Passwords must match');
    }

    return errorMessageArray;
  }
}
