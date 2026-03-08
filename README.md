# UniTask: A Dedicated Freelance Job Platform for Students

## Introduction

UniTask is a comprehensive web platform built specifically to connect students with freelance work and job opportunities. The application serves as a secure, verified marketplace where clients and students can post jobs, apply for tasks, and manage the entire workflow from initial contact to final payment. The backend infrastructure relies on Supabase for database and authentication needs, while the application is hosted on Vercel.

## Target Audience

  * **University Students:** Individuals looking to apply for jobs, showcase their portfolios, and earn money. They must verify their academic status by signing up with a valid .edu or .ac.bd email domain.
  * **Clients:** Individuals or businesses who want to post jobs and hire talented student freelancers.
  * **Administrators:** Platform moderators who manage disputes, handle reports, and maintain the integrity of user activity.

## Why This Project?

University students often struggle to find flexible, legitimate freelance work that accommodates their academic schedules. This project creates a high-trust, localized ecosystem by restricting student registration to verified academic emails. Furthermore, it addresses common gig-economy issues like payment fraud by implementing a built-in wallet system that automatically charges the job poster upfront and secures the funds until the work is completed.

## Goals and Visions

  * **Secure Networking:** Build a safe, scam-free environment where communication is centralized through an integrated messenger chatbox.
  * **Skill Showcasing:** Allow students to build a professional identity by displaying their ratings, portfolios, and top skills on their profiles.
  * **Fair Resolution:** Ensure fair treatment for both clients and freelancers through a structured rating system and a dedicated dispute resolution center.

## Feature List

### 1\. Authentication & Account Management

  * **Sign Up & Verification:** Users must sign up by choosing a unique username and verifying their account via an OTP sent to their email.
  * **Domain Restriction:** Students are required to sign up using an .edu or .ac.bd domain email address.
  * **Role Selection:** During registration, users must select an account type: Student, Client, or Admin.
  * **Password Recovery:** A "Forget Password" option is available below the login section, allowing users to reset their password using an OTP sent to their associated email.

### 2\. User Roles & Permissions

  * **Students:** Have the ability to both post jobs and apply for jobs.
  * **Clients:** Are restricted to only posting jobs.
  * **Admins:** Possess the same capabilities as students, but additionally have the authority to moderate post activity, handle reports, and access an admin-only tab to maintain platform activity.

### 3\. Profile System

  * **General Profile Info:** All profiles display the user's name, email, gender, and profile picture.
  * **Student View:** Displays the user's category, portfolio links, and an average of all the ratings they have received. Students have options to edit their profile picture, category, and portfolio links. The platform also features a section to "show top freelancers and the star rating they got".
  * **Client View:** Displays their workspace and includes options to edit their profile picture, workspace, and social links.

### 4\. Feed & Navigation (UI)

  * **Main Feed:** Acts as the central hub where users can view all jobs. It features a search bar and a filter option to sort jobs by category (which acts as a statement of skills).
  * **Top Navigation:** The UI includes a profile button (a circular profile picture thumbnail) and a Facebook-style message button next to it.

### 5\. Job Posting & Management

  * **Job Creation:** Users can post a job by providing a job description, selecting a category, and setting a payment amount.
  * **Job Post View:** Displays all the provided job details, the job poster's information, and includes an "apply" button and a "report" button. Job posters also have a dedicated button to view the list of applicants.

### 6\. Application & Hiring Workflow

  * **Applying:** Students can apply for a job with a simple click, which instantly sends a notification to the job poster.
  * **Selection Process:** The job poster reviews the list of applicants and selects one candidate.
  * **Job Assignment:** Once a candidate is selected, the applicant receives a notification, the job post is removed from the public feed, and a dedicated chat box is created between the two parties.
  * **Job Completion:** After the work is discussed and finished, users click a "job completed" button.

### 7\. Messaging System

  * **Direct Messaging:** One-to-one chat messaging is facilitated between the job poster and the hired applicant.
  * **Chat Interface:** The chat box functions similarly to the Messenger chat interface.

### 8\. Payment & Wallet System

  * **Digital Wallet:** Every user has a digital wallet, and every transaction triggers a notification. Admins have the capability to edit the wallet balances of all users.
  * **Funding & Withdrawals:** Users can "Add Money" or "Cash Out," which is currently handled manually via FuturePlan SSLCommerz.
  * **Escrow Payment Flow:** When a job is posted, the poster is immediately charged the payment amount from their wallet. The payment is only released and sent to the worker when the job is officially marked as completed.

### 9\. Rating & Dispute Resolution

  * **Rating System:** Immediately after a job is marked as completed, a pop-up appears prompting the job poster to rate the worker.
  * **Raising Disputes:** The chatbox contains a "Raise Dispute" button. Clicking this opens a form where details can be entered. Once submitted, the dispute details, along with the usernames of both parties, are sent to the admin panel for review.

### 10\. Notification System

  * **Notification Hub:** Users have a dedicated notification tab where all alerts arrive.
  * **UI Indicators:** A red dot appears when a new notification is received, and the tab is divided into "read" and "unread" sections.
