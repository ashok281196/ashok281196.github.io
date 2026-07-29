"use strict";

/* ============================================================
   BOOK DATA - QnA. The question list drives the contents page,
   every question's topbar and the prev/next navigation
   (rendered by book-ui.js), so adding a question here updates
   all navigation at once. To add a new question: drop a new
   NN-slug.html file next to this one, then add its entry below.
   ============================================================ */

const BOOK = {
  title: 'QnA',
  siteHref: '../../',
  siteLabel: 'ashok281196.github.io',
  badge: 'QnA · 2026',

  chapters: [
    {
      file: '01-crop-health-segmentation.html',
      num: '01',
      title: 'Crop Health Segmentation',
      navTitle: 'Q1 · Crop Health Segmentation',
      sub: 'Building a segmentation pipeline for crop health monitoring from drone camera imagery, covering both multispectral fusion and RGB-only cameras, with the latest models.',
      tag: 'Vision'
    },
    {
      file: '02-mesh-drone-swarm-gps-degraded.html',
      num: '02',
      title: 'Mesh Drone Swarm, GPS-Degraded',
      navTitle: 'Q2 · Mesh Drone Swarm',
      sub: 'A swarm of mesh-radio drones flown from one GCS on autonomous missions without reliable GPS: airtime budgeting, VIO frame alignment across aircraft, and command authority that survives a partitioned link.',
      tag: 'Swarm'
    }
  ]
};
