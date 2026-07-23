"use strict";

/* ============================================================
   BOOK DATA — SLAM: Zero to Hero. The chapter list drives the
   contents page, every chapter topbar and the prev/next
   navigation (rendered by book-ui.js), so adding a chapter
   here updates all navigation at once.
   ============================================================ */

const BOOK = {
  title: 'SLAM: Zero to Hero',
  siteHref: '../../',
  siteLabel: 'ashok281196.github.io',
  badge: 'A Field Book · 2026',

  chapters: [
    {
      file: '00-foundations.html',
      num: '00',
      title: 'Foundations',
      navTitle: 'Ch. 0 · Foundations',
      sub: 'What SLAM even is. Odometry, drift, loop closure, maps, frames, and the six ideas the rest of the book keeps reusing.',
      tag: 'Start here'
    },
    {
      file: '01-estimation.html',
      num: '01',
      title: 'The Estimation Toolbox',
      navTitle: 'Ch. 1 · The Estimation Toolbox',
      sub: 'Bayes filters, Kalman and particle filters, least squares, factor graphs, robust kernels, and why rotations need special care.',
      tag: 'The math'
    },
    {
      file: '02-sensors-calibration.html',
      num: '02',
      title: 'Sensors, Calibration & Time',
      navTitle: 'Ch. 2 · Sensors, Calibration & Time',
      sub: 'What each sensor really measures, its noise model, and the calibration and clock-sync work that makes or breaks a rig.',
      tag: 'Hardware'
    },
    {
      file: '03-lidar-slam.html',
      num: '03',
      title: 'LiDAR SLAM & the Mapping Pipeline',
      navTitle: 'Ch. 3 · LiDAR SLAM & the mapping pipeline',
      sub: 'Scan matching, deskew, LOAM to FAST-LIO2, and OctoMap versus the distance fields that replaced it.',
      tag: 'Geometry'
    },
    {
      file: '04-visual-slam.html',
      num: '04',
      title: 'Visual SLAM: the State of the Art',
      navTitle: 'Ch. 4 · Visual SLAM SOTA',
      sub: 'Six eras from ORB features to foundation models that predict geometry in one forward pass.',
      tag: 'SOTA'
    },
    {
      file: '05-rtabmap.html',
      num: '05',
      title: 'RTAB-Map + RealSense D435i',
      navTitle: 'Ch. 5 · RTAB-Map + RealSense D435i',
      sub: 'The cheapest credible indoor SLAM rig, configured end to end, and every way it bites you in the field.',
      tag: 'Hands-on'
    },
    {
      file: '06-learning-slam.html',
      num: '06',
      title: 'Learning-Based SLAM',
      navTitle: 'Ch. 6 · Learning-based SLAM',
      sub: 'Where machine learning actually plugs in, and where it still loses to forty-year-old geometry.',
      tag: 'ML × SLAM'
    },
    {
      file: '07-evaluation.html',
      num: '07',
      title: 'Evaluation, Datasets & Benchmarks',
      navTitle: 'Ch. 7 · Evaluation & benchmarks',
      sub: 'ATE, RPE, the datasets everyone reports on, the evo toolchain, and how to benchmark your own robot honestly.',
      tag: 'Rigor'
    },
    {
      file: '08-planning-nav.html',
      num: '08',
      title: 'Planning, Navigation & Localization',
      navTitle: 'Ch. 8 · Planning, navigation & localization',
      sub: 'What the robot does with the map: costmaps, A* to MPPI, Nav2, and the frame contract that holds it all together.',
      tag: 'Autonomy'
    }
  ]
};
