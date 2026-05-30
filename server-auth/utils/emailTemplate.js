export const emailTemplate = (otp) => {
  return `<!-- Storage App Sign-up Verification Email Template -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your Storage App sign-up</title>
    <style>
      body {
        background: #f7f7fb;
        font-family: 'Inter', Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 480px;
        margin: 32px auto;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        padding: 32px 24px;
        text-align: center;
      }
      .logo {
        margin-bottom: 24px;
      }
      .code-box {
        background: #f7f7fb;
        border-radius: 8px;
        padding: 24px 0;
        font-size: 2rem;
        font-weight: 600;
        letter-spacing: 2px;
        margin: 24px 0;
      }
      .footer {
        margin-top: 32px;
        color: #888;
        font-size: 0.95rem;
      }
      .social-icons {
        margin: 16px 0 0 0;
      }
      .social-icons img {
        width: 24px;
        margin: 0 8px;
        vertical-align: middle;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <img
          src="https://user-images.githubusercontent.com/13031838/236635964-2e2e2e2e-2e2e-4e2e-8e2e-2e2e2e2e2e2e.png"
          alt="Storage App Logo"
          width="48"
          height="48"
        />
      </div>
      <h2>Verify your Storage App sign-up</h2>
      <p>
        We have received a sign-up attempt with the following code. Please enter
        it in the browser window where you started signing up for Storage App.
      </p>
      <div class="code-box">${otp}</div>
      <p style="color: #888">
        If you did not attempt to sign up but received this email, please
        disregard it. The code will remain active for 10 minutes.
      </p>
      <div class="footer">
        Storage App, an effortless identity solution with all the features you need.
        <div class="social-icons">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2111/2111370.png"
            alt="Discord"
            title="Discord"
          />
          <img
            src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
            alt="GitHub"
            title="GitHub"
          />
          <img
            src="https://cdn-icons-png.flaticon.com/512/733/733579.png"
            alt="Twitter"
            title="Twitter"
          />
          <img
            src="https://cdn-icons-png.flaticon.com/512/732/732200.png"
            alt="Email"
            title="Email"
          />
        </div>
        <div style="margin-top: 12px; font-size: 0.9em">
          © 2023 Storage App. All rights reserved.
        </div>
      </div>
    </div>
  </body>
</html>`;
};
