"use strict";

/* ============================================================
   BOOK DATA - Autonomous Mobile Robot Navigation. The chapter
   list drives the contents page, every chapter topbar and the
   prev/next navigation (rendered by book-ui.js).

   Phases without a deep-dive chapter yet point their `file` at
   the phase brief on the contents page (index.html#phase-N).
   When a deep dive lands, change `file` to its HTML file (like
   Phase 1 below) and all navigation updates at once.
   ============================================================ */

const BOOK = {
  title: 'Autonomous Mobile Robot Navigation',
  siteHref: '../',
  siteLabel: 'ashok281196.github.io',
  badge: 'A Field Book · 2026',

  chapters: [
    {
      file: '01-math-foundations.html',
      num: '01',
      title: 'Mathematical Foundations & Optimization',
      navTitle: 'Phase 1 · Math & Optimization',
      sub: 'Poses, Lie theory, and the nonlinear least-squares machinery every later phase reuses.',
      tag: 'Start here'
    },
    {
      file: '02-state-estimation-odometry.html',
      num: '02',
      title: 'State Estimation & Odometry',
      navTitle: 'Phase 2 · State Estimation & Odometry',
      sub: 'Filters, wheel/IMU kinematics, and the LiDAR-inertial and visual-inertial odometry SOTA.',
      tag: 'Estimation'
    },
    {
      file: '03-mapping-slam.html',
      num: '03',
      title: 'Mapping & SLAM Systems',
      navTitle: 'Phase 3 · Mapping & SLAM',
      sub: 'Map representations, loop closure, pose graphs, and the SLAM systems that matter.',
      tag: 'Mapping'
    },
    {
      file: '04-global-localization.html',
      num: '04',
      title: 'Global Localization & Relocalization',
      navTitle: 'Phase 4 · Global Localization',
      sub: 'The kidnapped robot problem: particle filters, scan matching, and place recognition.',
      tag: 'Localization'
    },
    {
      file: '05-planning-control.html',
      num: '05',
      title: 'Path Planning & Motion Control',
      navTitle: 'Phase 5 · Planning & Control',
      sub: 'From A* and sampling planners to MPPI and nonlinear MPC: deciding and steering.',
      tag: 'Planning'
    },
    {
      file: '06-calibration-infrastructure.html',
      num: '06',
      title: 'Calibration & ROS-Free Infrastructure',
      navTitle: 'Phase 6 · Calibration & Infrastructure',
      sub: 'Sensor calibration, time sync, and zero-copy IPC — the plumbing, without ROS.',
      tag: 'Infrastructure'
    },
    {
      file: '07-outdoor-navigation.html',
      num: '07',
      title: 'Outdoor & Large-Scale Navigation',
      navTitle: 'Phase 7 · Outdoor & Large-Scale',
      sub: 'GNSS fusion, elevation maps, dynamic obstacles, and surviving the real world at scale.',
      tag: 'Outdoors'
    },
    {
      file: '08-learning-based.html',
      num: '08',
      title: 'Learning-Based Methods (AI Navigation)',
      navTitle: 'Phase 8 · Learning-Based Methods',
      sub: 'Learned odometry, Gaussian splatting SLAM, DRL policies, neural planners, and VLA navigation.',
      tag: 'AI Nav'
    }
  ]
};
