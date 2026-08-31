# Study AI Companion

You are an expert Senior Flutter Developer, AI Engineer, UI/UX Designer, Mobile App Architect, and Product Designer.

Your task is to build a premium Android mobile application called:

"AI Study Planner for Matric Students"

IMPORTANT:

This is NOT a simple demo application.

This application must look like a real Google Play Store quality application.

The app must be modern, premium, elegant, fast, user-friendly, responsive, and fully functional.

====================================================

PROJECT GOAL

The purpose of this application is to help Class 9 and Class 10 students manage their studies intelligently using Artificial Intelligence.

The application should not simply display information.

It must guide students, organize their studies, improve productivity, track progress, and generate personalized study plans.

====================================================

DESIGN STYLE

The UI should feel similar to modern ChatGPT, Google, Notion, and premium educational apps.

The design must be minimal, clean, elegant, and distraction-free.

Use rounded cards.

Soft shadows.

Smooth animations.

Modern Material Design.

Beautiful spacing.

Professional typography.

Premium icons.

No old Android style.

No ugly buttons.

No outdated interface.

====================================================

THEME SYSTEM

The application must support two themes.

1. Dark Theme

Background:

Pure Black (#000000)

Primary Text:

White (#FFFFFF)

Secondary Text:

Light Gray

Cards:

Dark Gray

Buttons:

Blue Accent

Icons:

White

=========================================

2. Light Theme

Background:

White (#FFFFFF)

Primary Text:

Black (#000000)

Secondary Text:

Dark Gray

Cards:

Light Gray

Buttons:

Blue Accent

Icons:

Black

=========================================

The entire application must instantly switch between Dark Mode and Light Mode.

Every screen must update automatically.

The selected theme must be saved permanently.

When the user opens the app again, the previously selected theme should load automatically.

====================================================

WELCOME MESSAGE

The greeting must change automatically according to the device's real local time.

05:00 AM – 11:59 AM

Display:

Good Morning ☀️

12:00 PM – 04:59 PM

Display:

Good Afternoon 🌤️

05:00 PM – 08:59 PM

Display:

Good Evening 🌇

09:00 PM – 04:59 AM

Display:

Good Night 🌙

Never display the wrong greeting.

====================================================

HOME HEADER

Display:

Greeting

Student Name

Today's Date (Real Device Date)

Today's Day (Real Device Day)

The date and day must update automatically every day.

====================================================

NAVIGATION

The application must use professional bottom navigation.

Home

Subjects

Planner

Progress

Profile

Settings

Navigation must be smooth.

No page reload.

No delay.

====================================================

HOME DASHBOARD

The dashboard must contain premium cards.

Subjects

AI Planner

Daily Schedule

Tasks

Exam Countdown

Notes

Progress

Homework

Settings

Each card must have:

Professional icon

Title

Small description

Notification Badge (if pending items exist)

====================================================

NOTIFICATION BADGES

Use modern red circular badges similar to:

TikTok

WhatsApp

Instagram

Example

Subjects 🔴3

Tasks 🔴8

Homework 🔴2

Notes 🔴1

Badges must update automatically.

====================================================

ANIMATIONS

Splash Animation

Card Fade Animation

Button Ripple

Smooth Page Transition

Loading Animation

No lag.

====================================================

GENERAL RULES

Every button must work.

No fake pages.

No placeholder screens.

No dummy features.

No broken navigation.

Every feature should be connected with the entire application.

The application should feel like a premium commercial product instead of a college assignment.

====================================================

JUDGES REQUIREMENTS

The application must maximize scores in:

Problem Impact

Functionality

Professional UI/UX

AI Integration

Practical Usefulness

Everything should be designed keeping these judging criteria in mind.                                       ====================================================
AUTHENTICATION SYSTEM
====================================================

Create a complete professional authentication system.

The authentication system must feel similar to modern applications like ChatGPT, Google, Microsoft, Notion, and Duolingo.

The UI must be premium, clean, modern, responsive, and user-friendly.

No fake login.

No fake signup.

Every validation must work correctly.

====================================================
WELCOME SCREEN
====================================================

Display a beautiful welcome page before Login.

Include:

• Premium illustration
• AI Study Planner logo
• Short motivational message
• Get Started button

Clicking Get Started should navigate to Login.

====================================================
LOGIN SCREEN
====================================================

Components:

• Email TextField
• Password TextField
• Show / Hide Password icon
• Remember Me checkbox
• Forgot Password button
• Login button
• Create New Account button

====================================================
LOGIN VALIDATION
====================================================

Do not allow empty fields.

Email must be a valid email address.

Examples:

✔ student@gmail.com

✔ abc123@gmail.com

Reject:

google.com

student@

@gmail.com

studentgmail.com

Password cannot be empty.

Password must contain at least 8 characters.

If validation fails, show friendly error messages.

Examples:

"Please enter your email."

"Please enter a valid email."

"Password must contain at least 8 characters."

Never allow invalid login.

====================================================
SIGN UP SCREEN
====================================================

Collect:

• Full Name
• Email Address
• Password
• Confirm Password

====================================================
FULL NAME VALIDATION
====================================================

Reject:

12345

111111

@@@@

%%%%

Only numbers.

Accept:

Muhammad Anas

Ali Hassan

Ayesha Noor

The name must contain alphabetic characters.

Minimum length:

3 characters.

====================================================
EMAIL VALIDATION
====================================================

Accept only valid email addresses.

Reject every invalid email.

====================================================
PASSWORD VALIDATION
====================================================

Password Rules:

Minimum 8 characters.

Must contain at least:

• One uppercase letter
• One lowercase letter
• One number

Show password strength:

Weak

Medium

Strong

====================================================
CONFIRM PASSWORD
====================================================

Password and Confirm Password must match.

Otherwise show:

"Passwords do not match."

====================================================
ACCOUNT CREATION
====================================================

Never create an account if validation fails.

Create account ONLY after all validations pass successfully.

====================================================
SUCCESS MESSAGE
====================================================

After successful signup display:

"🎉 Your account has been created successfully."

Automatically navigate to Home Dashboard.

====================================================
PROFILE CREATION
====================================================

After Signup ask the student to complete profile.

Collect:

Student Name

Class

Class 9

Class 10

Board

Punjab Board

Federal Board

Other

Study Goal

Daily Study Hours

Weak Subjects

Strong Subjects

This information will later be used by the AI Planner.

====================================================
FORGOT PASSWORD
====================================================

Allow users to reset password.

Show a simple password recovery screen.

====================================================
LOGOUT
====================================================

Show confirmation dialog.

"Are you sure you want to logout?"

Yes

Cancel

====================================================
ERROR HANDLING
====================================================

Never crash.

Never freeze.

Never display technical errors.

Always display user-friendly messages.

====================================================
SECURITY
====================================================

Passwords must never be displayed openly.

Hide password by default.

Allow Show / Hide Password toggle.

====================================================
UI REQUIREMENTS
====================================================

Rounded TextFields

Rounded Buttons

Modern Icons

Professional spacing

Soft shadows

Beautiful animations

Responsive layout

====================================================
GENERAL RULE
====================================================

Every button must work.

Every validation must work.

Never allow fake account creation.

Never allow invalid email.

Never allow numeric-only usernames.

Authentication should feel like a real commercial application, not a college demo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://matric-study-planner.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5480902d-4043-4fce-afd9-1155a5d7d9c2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
