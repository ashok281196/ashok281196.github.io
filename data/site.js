"use strict";

/* ============================================================
   SITE DATA — identity, navigation and the page index.
   Everything site-wide and editorial lives here, not in HTML.
   Add a new page by appending to SITE.pages.
   ============================================================ */

const SITE = {
  host: 'ashok281196.github.io',
  location: 'Bengaluru, India · UTC+05:30',
  owner: 'Ashok Kumar Chaudhary',
  copyrightYear: 2026,
  sourceUrl: 'https://github.com/ashok281196/ashok281196.github.io',
  tagline: 'Plain HTML, zero frameworks',

  pages: [
    {
      file: 'India-2026-27-season.html',
      title: 'India Men’s Season 2026–27',
      desc: 'Team India’s full fixture book — eight tours, five countries, forty-seven matches, every ground named. Ticket-stub schedule with format filters.',
      meta: [
        { label: 'LIVE', hot: true },
        { label: 'cricket' },
        { label: '8 tours · 47 matches' },
        { label: 'updated Jul 2026' }
      ]
    },
    {
      file: 'autonomous-mobile-robot-navigation/index.html',
      title: 'Autonomous Mobile Robot Navigation — A Field Book',
      desc: 'The full navigation stack in eight deep-dive chapters — math and optimization, odometry, SLAM, relocalization, planning and control, ROS-free infrastructure, outdoor navigation, and learning-based methods. Equations, diagrams, and runnable C++ in every chapter.',
      meta: [
        { label: 'NEW', hot: true },
        { label: 'robotics' },
        { label: '8 chapters' },
        { label: 'updated Jul 2026' }
      ]
    },
    {
      file: 'reading/slam/index.html',
      title: 'SLAM: Zero to Hero — A Field Book',
      desc: 'A field book on SLAM: foundations, estimation math, sensors and calibration, lidar and visual SLAM, RTAB-Map, learned methods, evaluation, and navigation on top of the map. Worked setups in every chapter.',
      meta: [
        { label: 'LIVE', hot: true },
        { label: 'robotics' },
        { label: '9 chapters' },
        { label: 'updated Jul 2026' }
      ]
    },
    {
      file: 'reading/lld/index.html',
      title: 'LLD: Zero to Hero — A Field Book',
      desc: 'Fifteen of the most-asked Low-Level Design interview problems, from problem statement to approach to a complete working C++ solution — Vending Machine to Parking Lot to Chess to Ride-Sharing.',
      meta: [
        { label: 'LIVE', hot: true },
        { label: 'systems design' },
        { label: '15 chapters' },
        { label: 'updated Jul 2026' }
      ]
    },
    {
      file: 'reading/interviews/index.html',
      title: 'Common Robotics Interview Questions',
      desc: 'Thirty-nine recurring robotics engineering interview questions across SLAM, firmware, middleware, computer vision, learning-based robotics, edge deployment, manipulation and systems design.',
      meta: [
        { label: 'LIVE', hot: true },
        { label: 'robotics' },
        { label: '39 questions' },
        { label: 'updated Jul 2026' }
      ]
    },
    {
      file: 'reading/qna/index.html',
      title: 'QnA — A Growing Interview Question Bank',
      desc: 'A running bank of real technical-interview questions across vision, ML, robotics, systems and languages — including fifty-question C++ and Python drill chapters — each answered in full.',
      meta: [
        { label: 'NEW', hot: true },
        { label: 'interview prep' },
        { label: '4 questions' },
        { label: 'updated Jul 2026' }
      ]
    },
    {
      file: 'reading/state-estimation-primer.html',
      title: 'Three Ways to Know Where You Are — EKF, UKF, Factor Graphs',
      desc: 'A state estimation primer in six chapters: the problem before any algorithm, the exact Kalman filter, the EKF’s linearisation, the UKF’s sampled sigma points, factor graphs that keep everything, and the three compared and unified.',
      meta: [
        { label: 'LIVE', hot: true },
        { label: 'robotics' },
        { label: '6 chapters' },
        { label: 'updated Jul 2026' }
      ]
    }
  ],

  indexSlot: 'more pages soon — this index grows one file at a time'
};
