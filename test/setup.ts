process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-32-characters";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-32-characters";
process.env.EMAIL_VERIFICATION_ENABLED = "false";
process.env.REQUIRE_VERIFIED_EMAIL = "false";