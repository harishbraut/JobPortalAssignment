# Job Portal

A job portal where recruiters post jobs and applicants apply to them with their resume. Recruiters can see who applied to their jobs, download resumes and update the application status. Applicants can track the status of every job they applied to.

**Live demo:** https://job-portal-assignment-ten.vercel.app/

# Recruiter login for demo
- **email** : priyanka.raut@gmail.com
- **password** : Priyanka@1234
- 
# Applicant login for demo
- **email** : harish.raut@gmail.com
- **password** : harish@1234

## Functionalities of the application

- **Home page of application where anyone can see the posted jobs by any recruiter except when recruiter is logged in**
  <img width="1919" height="1199" alt="tmp_9cec82dd-4993-493f-9fe1-3d8cceb18258" src="https://github.com/user-attachments/assets/1629c952-f124-4d75-98d1-6c09c829f6a8" />

- **A recruiter can see jobs added by him only when he logs into application and can add new job from ui**
  <img width="1919" height="1150" alt="tmp_ad2a4a17-8a2a-48af-aab0-bf91623cbfe9" src="https://github.com/user-attachments/assets/a9251484-25d0-4064-aff3-3c639d548e34" />

- **An user/applicant can see all jobs he had applied to on applicants tab and can see status of his job set by recruiter**
  <img width="1919" height="1149" alt="tmp_360a25e9-4ef3-4c90-82fd-763ed9bc1efc" src="https://github.com/user-attachments/assets/d66f72f6-0cfb-47c6-bafa-b1d6d0018f9a" />

- **A recruiter can see all job applications by all job applicants for the jobs he psoted and can set status**
  <img width="1918" height="1150" alt="tmp_aace55d0-6dd9-4b1d-a761-c1f8da56a73a" src="https://github.com/user-attachments/assets/ba8024f8-2955-4d44-ae35-18ed1fac0889" />


## Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** for the server and REST APIs
- **EJS** templates with **express-ejs-layouts** for the pages
- **MongoDB Atlas** as the database, with **Mongoose** as the ODM
- **Bootstrap 5** for a responsive design that works on mobile and desktop
- **Cloudinary** for storing company logos and resumes
- **JWT** in an HTTP-only cookie for login, **bcrypt** for password hashing
- **Multer** for file uploads
- Deployed on **Vercel**

The project follows the **MVC architecture**: models define the data, views render the pages and controllers handle the requests. Database queries are kept in a separate repository layer.

## Features

**Recruiter**
- Sign up and log in as a recruiter
- Add a job with title, company, skills, salary, description and company logo
- See only the jobs they posted
- See all applications to their jobs, download resumes and change the status (applied, shortlisted, rejected, accepted)

**Applicant**
- Sign up and log in as an applicant
- Browse and search all jobs
- Apply to a job by uploading a PDF resume
- See all their applications and the current status of each

## Project Structure

**src/config**
Database connection, Cloudinary setup and reading of environment variables.

**src/model**
Mongoose schemas for users, jobs and applications.

**src/repositories**
All database queries, used by the controllers.

**src/controller**
Request handling. `user`, `job` and `application` controllers serve the JSON APIs, `web.controller` renders the EJS pages.

**src/routes**
Route definitions for users, jobs, applications and the web pages.

**src/middlewares**
JWT authentication (header or cookie) and file upload rules for logos and resumes.

**src/types**
TypeScript interfaces for request data.

**src/index.ts**
Creates the Express app, registers middlewares and routes. Exported for Vercel and started with `app.listen` locally.

**views**
EJS templates. `layout.ejs` is the common page shell, `partials` holds the header and footer, and the other files are the pages (jobs, login, signup, applications, my applications).

**public/assets**
CSS and browser JavaScript used by the pages.

**scripts**
One-time script that moved older local uploads to Cloudinary.

## Run Locally

1. Clone the repository and install packages
   ```bash
   npm install
   ```
2. Create a `.env` file in the root folder with these values
   ```
   MONGODB_URI=
   JWT_SECRET=
   JWT_EXPIRY=1d
   SECURITY_KEY=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```
3. Start the development server
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /signup | Create an account |
| POST | /login | Log in, sets the token cookie |
| GET | /logout | Log out |
| POST | /addJob | Add a job (recruiter) |
| GET | /recruiter/jobs | Jobs posted by the logged-in recruiter |
| GET | /recruiter/applications | Applications to the recruiter's jobs |
| POST | /jobs/:jobId/:applicationId | Change an application's status (recruiter) |
| POST | /jobs/:jobId/apply | Apply to a job with a PDF resume (applicant) |
| GET | /applicant/applications | Applications of the logged-in applicant |
| GET | /applications/:applicationId/resume | Download a resume (job's recruiter or the applicant) |
