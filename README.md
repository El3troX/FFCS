# TimetableGen (FFCS)

TimetableGen is an ultra-fast, local-first React application designed to solve complex university timetable scheduling problems (specifically modeled after the VIT FFCS system). 

By providing a list of subjects, faculty options, and time slots, TimetableGen utilizes a custom **Constraint Satisfaction Problem (CSP)** engine running inside a Web Worker to explore millions of possible combinations in milliseconds.

## Features

- **Blazing Fast Engine**: Powered by a highly optimized CSP engine with forward-checking and conflict-matrix precomputation. Solves massive scheduling spaces instantly without freezing the UI.
- **Strict Faculty Constraints**: Intelligently auto-pairs Theory and Lab counterpart subjects to ensure they are strictly assigned to the exact same faculty member.
- **Advanced Filtering**: Blacklist or whitelist specific faculty members, enforce minimum free days, toggle elective groups, and force-include specific subjects.
- **Stunning UI/UX**: Built with React and Tailwind CSS v4, featuring a premium dark mode, glassmorphism aesthetics, fluid micro-animations, and responsive grids.
- **Powerful Exporting**: Export your favorite timetables locally to your browser, compare them side-by-side, or batch download them as High-Res PNG images and detailed PDF Reports.

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FFCS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## Data Structure

To generate timetables, the application requires input data structured as a JSON object. You can find an example structure in `datatemplate.json`.

### `datatemplate.json` Schema Guide:
- **`credits`**: Number of credits for the subject.
- **`type`**: `"THEORY"` or `"LAB"`.
- **`mandatory`**: `true` if the subject must be included in the timetable, `false` if it is optional.
- **`group`**: (Optional) For non-mandatory subjects, grouping them allows the engine to selectively pick one subject from the group.
- **`options`**: An array of available classes containing:
  - `faculty`: The name of the teacher.
  - `slot`: The time slot string (e.g., `"A1+TA1"` or `"L1+L2"`).
  - `venue`: The physical classroom location.

**Note on Theory/Lab Pairing**: If a Theory subject and a Lab subject share the exact same base name (e.g., "Deep Learning" and "Deep Learning Lab", or "Machine Learning Theory" and "Machine Learning Lab"), the engine will automatically enforce a strict constraint ensuring that the same faculty member is assigned to both.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Exporting**: html-to-image, jsPDF, jszip
- **Engine**: Dedicated Web Workers (`timetableGenerator.worker.ts`)
