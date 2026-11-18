"use strict";

/* ============================================================
   PAPERS DATA — the reading-room shelves.
   Each category is a shelf; each paper points at a PDF under
   /papers/<category slug>/. Add a shelf by appending to
   PAPERS.categories; add a paper by appending to its papers[].
   PAPERS.explainers lists long-form, beginner-friendly explainer
   pages under /papers/explainers/<slug>/ (opened directly, not in
   the PDF reader).
   Rendered by assets/js/papers.js (listing) and
   assets/js/paper-view.js (reader).
   ============================================================ */

const PAPERS = {
  root: 'papers',
  title: 'Papers',
  eyebrow: 'Reading Room',
  intro: 'An annotated shelf of research papers I keep coming back to — each one readable right here, grouped by topic. Tactile sensing is the first shelf; more get added as the reading list grows.',
  promo: 'Research papers, readable right here in the browser — annotated, categorised, with page-by-page navigation. Tactile sensing & dexterous manipulation is the first shelf; more to come.',
  slot: 'more shelves soon — tactile is just the first category',

  explainers: {
    slug: 'explainers',
    title: 'Paper Explainers',
    blurb: 'Landmark papers explained from zero — book-style walkthroughs with analogies, interactive demos, flowcharts and a quiz at the end. No prior background assumed.',
    items: [
      {
        href: 'explainers/ddpm-2006.11239/',
        title: 'Denoising Diffusion Probabilistic Models — explained for absolute beginners',
        authors: 'Jonathan Ho, Ajay Jain, Pieter Abbeel · UC Berkeley',
        stamp: 'arXiv:2006.11239 [cs.LG]',
        year: 2020,
        minutes: 35,
        desc: 'The paper behind modern image generators, in twelve short chapters: bury a picture under static, train a network to undo one tiny step, then un-bury pure noise into a brand-new image. Includes a live noise slider using the paper\'s exact schedule.',
        tags: ['explainer', 'diffusion', 'generative models']
      },
      {
        href: 'explainers/diffusion-policy-2303.04137/',
        title: "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion — explained in depth",
        authors: "Cheng Chi, Zhenjia Xu et al. · Columbia, Toyota Research Institute, MIT",
        stamp: 'arXiv:2303.04137 [cs.RO]',
        year: 2023,
        minutes: 55,
        desc: "How DDPM's denoising trick became the standard way robots learn skills from human demos: diffusing 16-step action chunks conditioned on camera input, receding-horizon control, CNN vs transformer backbones, why it beats IBC/BET/LSTM-GMM by 46.9%, and real-robot results from Push-T to shirt folding. Includes an interactive demo comparing averaged, step-by-step and chunked policies.",
        tags: ['explainer', 'robotics', 'imitation learning', 'diffusion']
      }
    ]
  },

  categories: [
    {
      slug: 'tactile',
      title: 'Tactile Sensing & Dexterous Manipulation',
      blurb: 'Gloves, wearable sensing rigs and datasets that capture how human hands touch and move — and how that data transfers to robot hands.',
      papers: [
        {
          file: 'TactiDex.pdf',
          title: 'TactiDex: A Real-World Tactile-Guided Benchmark for Human-Like Dexterous Manipulation',
          authors: 'Suting Ni et al. · ShanghaiTech University',
          stamp: 'arXiv:2607.09190 [cs.RO]',
          year: 2026,
          pages: 16,
          desc: 'A benchmark that pushes human-to-robot dexterous transfer past kinematic mimicry: whole-hand tactile signals aligned with hand–object interaction data, so policies are judged on contact-level human-likeness — how they form contacts and regulate force — not just on matching trajectories.',
          tags: ['benchmark', 'dataset']
        },
        {
          file: 'LaST-HD.pdf',
          title: 'LaST-HD: Learning Latent Physical Reasoning from Scalable Human Data for Robot Manipulation',
          authors: 'Jiaming Liu et al. · Peking University',
          stamp: 'arXiv:2606.23685 [cs.RO]',
          year: 2026,
          pages: 24,
          desc: 'Instead of retargeting human-hand demos geometrically, LaST-HD trains an action-conditioned world model on unpaired human and robot trajectories and aligns both embodiments in a shared latent reasoning space — the VLA then learns physical dynamics from human data, not just kinematics.',
          tags: ['method', 'VLA']
        },
        {
          file: 'ART-Glove.pdf',
          title: 'ART-Glove: Articulated Tactile Glove for Contact-Grounded Dexterous Interaction Capture',
          authors: 'Changyi Lin, Ding Zhao · Carnegie Mellon University',
          stamp: 'arXiv:2606.16370 [cs.RO]',
          year: 2026,
          pages: 17,
          desc: 'A glove built from 16 rigid functional surfaces that preserves human dexterity while capturing 22-DoF surface motion and 2048 taxels of tactile contact — demonstration capture where the contact itself is a first-class signal, not an afterthought.',
          tags: ['hardware', 'tactile glove']
        },
        {
          file: 'T-800.pdf',
          title: 'T-800: An 800 Hz Data Glove for Precise Hand Gesture Tracking',
          authors: 'Haoyang Luo et al.',
          stamp: 'arXiv:2603.26403 [cs.RO]',
          year: 2026,
          pages: 12,
          desc: 'Eighteen IMUs, broadcast-based synchronization and mechanical stress isolation give full-hand tracking at 800 Hz — fast enough to show that human manipulation carries real motion energy above 100 Hz that every slower capture system has simply been aliasing away.',
          tags: ['hardware', 'mocap']
        },
        {
          file: 'DEXOP.pdf',
          title: 'DEXOP: A Device for Robotic Transfer of Dexterous Human Manipulation',
          authors: 'Hao-Shu Fang et al. · MIT & UC Berkeley',
          stamp: 'arXiv:2509.04441 [cs.RO]',
          year: 2025,
          pages: 22,
          desc: 'A passive "perioperation" exoskeleton with whole-hand tactile sensing: the human does the task naturally while the device records robot-ready data — built for the contact-rich, long-horizon, bimanual demonstrations that teleoperation struggles to collect.',
          tags: ['hardware', 'data collection']
        },
        {
          file: 'HUMOTO.pdf',
          title: 'HUMOTO: A 4D Dataset of Mocap Human Object Interactions',
          authors: 'Jiaxin Lu et al. · UT Austin & Adobe Research',
          stamp: 'arXiv:2504.10414 [cs.CV]',
          year: 2025,
          pages: 19,
          desc: 'Mocap human–object interaction sequences with detailed, accurate hands manipulating multiple precisely-modeled objects, each clip paired with short and long natural-language scripts — 4D ground truth for hands that most full-body datasets blur over.',
          tags: ['dataset', 'mocap']
        },
        {
          file: 'DOGlove.pdf',
          title: 'DOGlove: Dexterous Manipulation with a Low-Cost Open-Source Haptic Force Feedback Glove',
          authors: 'Han Zhang et al. · Tsinghua University',
          stamp: 'arXiv:2502.07730 [cs.RO]',
          year: 2025,
          pages: 13,
          desc: 'An open-source glove with 21-DoF motion capture and 5-DoF haptic force feedback, cheap enough to actually build — the force feedback is good enough to teleoperate dexterous hands without visual feedback, regulating something as unforgiving as sauce flow.',
          tags: ['hardware', 'teleoperation', 'open source']
        },
        {
          file: 'DexCap.pdf',
          title: 'DexCap: Scalable and Portable Mocap Data Collection System for Dexterous Manipulation',
          authors: 'Chen Wang et al. · Stanford University',
          stamp: 'RSS 2024',
          year: 2024,
          pages: 20,
          desc: 'A portable hand-mocap rig that collects high-quality human manipulation data in the wild — paired with DexIL, which retargets that data to the robot embodiment and trains imitation policies directly from it. The paper that made "just record human hands" a serious pipeline.',
          tags: ['hardware', 'imitation learning']
        },
        {
          file: 'ActionSense.pdf',
          title: 'ActionSense: A Multimodal Dataset and Recording Framework for Human Activities Using Wearable Sensors',
          authors: 'Joseph DelPreto, Chao Liu et al. · MIT CSAIL',
          stamp: 'NeurIPS 2022 D&B',
          year: 2022,
          pages: 14,
          desc: 'Kitchen activities recorded through a full wearable suite — eye tracking, forearm EMG, 17-IMU body tracking, finger-tracking gloves and conductive-thread tactile sensors on the hands — synchronized with external RGB, depth and audio. From stacking plates to peeling vegetables.',
          tags: ['dataset', 'wearable sensing']
        },
        {
          file: 'Interactive Hand Pose Estimation using a Stretch-Sensing Soft Glove.pdf',
          title: 'Interactive Hand Pose Estimation using a Stretch-Sensing Soft Glove',
          authors: 'Oliver Glauser et al. · ETH Zurich & NYU',
          stamp: 'SIGGRAPH 2019',
          year: 2019,
          pages: 15,
          desc: 'The classic soft-glove paper: a capacitive stretch-sensor array you can fabricate in an ordinary lab, plus a network that exploits the sensor layout to reconstruct hand pose — no external cameras, on-the-fly per-user calibration, 35% more accurate than commercial data gloves.',
          tags: ['hardware', 'hand pose']
        }
      ]
    }
  ]
};

/* Look up a paper by category slug + file name; null if unknown. */
function findPaper(slug, file){
  const cat = PAPERS.categories.find(c => c.slug === slug);
  if(!cat) return null;
  const paper = cat.papers.find(p => p.file === file);
  return paper ? { cat, paper } : null;
}

function papersCount(){
  return PAPERS.categories.reduce((n, c) => n + c.papers.length, 0);
}
