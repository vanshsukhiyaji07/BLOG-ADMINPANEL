const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');

// authentication using passport for admin
passport.use('admin-local', new LocalStrategy({
        usernameField: 'email'
    },
    async function(email, password, done){
        try {
            // find a user and establish the identity
            const normalizedEmail = (email || '').toLowerCase().trim();
            let admin = await Admin.findOne({email: normalizedEmail});

            if (!admin) {
                console.log('Incorrect Email');
                return done(null, false, { message: 'Incorrect email.' });
            }

            // Handle both hashed and potential legacy plaintext passwords
            let isMatch = false;
            const storedPass = admin.password || '';
            const looksHashed = typeof storedPass === 'string' && storedPass.startsWith('$2');

            if (looksHashed) {
                isMatch = await bcrypt.compare(password, storedPass);
            } else {
                // Legacy: stored password might be plaintext
                if (storedPass === password) {
                    isMatch = true;
                    // Migrate: hash and save for future logins, bypassing full validation
                    const newHash = await bcrypt.hash(password, 10);
                    await Admin.updateOne({ _id: admin._id }, { $set: { password: newHash } }, { runValidators: false });
                    console.log('Migrated admin password to hashed storage');
                }
            }

            if (!isMatch) {
                console.log('Incorrect Password');
                return done(null, false, { message: 'Incorrect password.' });
            }

            return done(null, admin);
        } catch (err) {
            console.log('Error in finding admin ---> Passport');
            return done(err);
        }
    }
));

// serializing the user to decide which key is to be kept in the cookies
passport.serializeUser(function(user, done){
    // Check if it's an admin or user and store type info
    if (user.email && user.firstName) {
        // This is an admin (has firstName field)
        done(null, { id: user.id, type: 'admin' });
    } else {
        // This is a regular user
        done(null, { id: user.id, type: 'user' });
    }
});

// deserializing the user from the key in the cookies
passport.deserializeUser(async function(obj, done){
    try {
        if (obj.type === 'admin') {
            let admin = await Admin.findById(obj.id);
            return done(null, admin);
        } else if (obj.type === 'user') {
            const User = require('../models/User');
            let user = await User.findById(obj.id);
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (err) {
        console.log('Error in finding user ---> Passport');
        return done(err);
    }
});

// check if the user is authenticated
passport.checkAuthentication = function(req, res, next){
    // if the user is signed in, then pass on the request to the next function(controller's action)
    if (req.isAuthenticated()){
        return next();
    }

    // if the user is not signed in, send to admin login page
    return res.redirect('/login');
}

passport.setAuthenticatedUser = function(req, res, next){
    if (req.isAuthenticated()){
        // req.user contains the current signed in user from the session cookie and we are just sending this to the locals for the views
        if (req.user && req.user.firstName) {
            // This is an admin
            res.locals.admin = req.user;
        } else if (req.user && req.user.name) {
            // This is a regular user
            res.locals.user = req.user;
        }
    }

    next();
}

module.exports = passport;
