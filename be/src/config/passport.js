const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const authService = require("../modules/auth/auth.service");

// Google Strategy
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== "your_google_client_id"
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const authData = await authService.loginWithOAuth({
            provider: "google",
            profile,
          });
          return done(null, authData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Facebook Strategy
if (
  process.env.FACEBOOK_APP_ID &&
  process.env.FACEBOOK_APP_ID !== "your_facebook_app_id"
) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL:
          process.env.FACEBOOK_CALLBACK_URL ||
          "/api/auth/facebook/callback",
        profileFields: ["id", "emails", "name", "photos"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const authData = await authService.loginWithOAuth({
            provider: "facebook",
            profile,
          });
          return done(null, authData);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Passport serialization (stateless JWT setup, but passport needs dummy serializes if session used)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

module.exports = passport;
