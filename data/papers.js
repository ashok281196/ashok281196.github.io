"use strict";

/* ============================================================
   PAPERS DATA — the reading-room shelves.
   Each category is a shelf; each paper points at a PDF under
   /papers/<category slug>/ (file: '…') or at arXiv (arxiv: '<id>',
   opened in the iframe reader papers/read.html). Add a shelf by appending to
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
  intro: 'An annotated shelf of research papers I keep coming back to — each one readable right here, grouped by topic. Diffusion policy and tactile sensing so far; more get added as the reading list grows.',
  promo: 'Research papers, readable right here in the browser — annotated and categorised. Shelves so far: diffusion policy & action diffusion, and tactile sensing & dexterous manipulation.',
  slot: 'more shelves soon',

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
      },
      {
        href: 'explainers/umi-2402.10329/',
        title: 'Universal Manipulation Interface: In-The-Wild Robot Teaching Without In-The-Wild Robots — explained in depth',
        authors: 'Cheng Chi, Zhenjia Xu et al. · Stanford, Columbia, Toyota Research Institute',
        stamp: 'arXiv:2402.10329 [cs.RO]',
        year: 2024,
        minutes: 35,
        desc: 'How a $371 hand-held gripper and one GoPro replaced the robot during data collection: fisheye lens and side mirrors for context and depth, visual-inertial SLAM to recover the hand\'s path, and the two interface choices — latency matching and relative trajectories — that let the same policy run on different arms. Covers all four capability tasks, the 30-location in-the-wild experiment, and an interactive latency demo.',
        tags: ['explainer', 'robotics', 'data collection', 'imitation learning']
      },
      {
        href: 'explainers/molmoact2-2605.02881/',
        title: 'MolmoAct2: Action Reasoning Models for Real-World Deployment — explained in depth',
        authors: 'Haoquan Fang, Jiafei Duan et al. · Allen Institute for AI, University of Washington',
        stamp: 'arXiv:2605.02881 [cs.RO]',
        year: 2026,
        minutes: 40,
        desc: 'An open vision-language-action model built for affordable arms: a spatial-reasoning backbone (Molmo2-ER), three cleaned open datasets including 720+ hours of bimanual YAM data, an action expert that reads the VLM at every layer, staged training with knowledge insulation, and a Think variant that reasons about depth but only re-decodes what changed. Covers every results table, the ablations, the speed numbers and the limits, with an interactive adaptive-depth demo.',
        tags: ['explainer', 'robotics', 'VLA', 'flow matching']
      }
    ]
  },

  categories: [
    {
      slug: 'diffusion-policy',
      title: 'Diffusion Policy & Action Diffusion',
      blurb: 'Visuomotor policy learning via action diffusion — the original paper, its direct descendants, the flow-matching VLAs that grew out of it, work through November 2026, and the foundations underneath. Ordered most relevant first; each opens from arXiv in an in-page frame.',
      papers: [
        { arxiv: "2303.04137", title: "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion", authors: "Cheng Chi, Zhenjia Xu, Siyuan Feng, Eric Cousineau, Yilun Du, Benjamin Burchfiel, Russ Tedrake, Shuran Song", year: 2023,
          desc: "The anchor of this shelf. Treats the robot policy as a conditional denoising process over short action sequences, executed with receding-horizon control; handles multimodal demonstrations and trains stably where earlier behaviour-cloning methods wobble.",
          tags: ["core", "imitation learning"] },
        { arxiv: "2403.03954", title: "3D Diffusion Policy: Generalizable Visuomotor Policy Learning via Simple 3D Representations", authors: "Yanjie Ze et al.", year: 2024,
          desc: "DP3. Swaps image features for a compact point-cloud encoding and keeps the diffusion head — far fewer demos needed per task and better generalisation across viewpoints and object instances.",
          tags: ["core", "3D"] },
        { arxiv: "2402.10329", title: "Universal Manipulation Interface: In-The-Wild Robot Teaching Without In-The-Wild Robots", authors: "Cheng Chi et al.", year: 2024,
          desc: "UMI. Hand-held grippers with a wrist camera collect demos anywhere; a Diffusion Policy trained on them transfers to real arms. The data-collection half of the Diffusion Policy story.",
          tags: ["core", "data collection"] },
        { arxiv: "2304.13705", title: "Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware", authors: "Tony Z. Zhao, Vikash Kumar, Sergey Levine, Chelsea Finn", year: 2023,
          desc: "ALOHA + ACT. The sibling idea from the same year: predict chunks of actions (with a CVAE transformer) and blend them with temporal ensembling. Action chunking is the piece every later diffusion and flow policy keeps.",
          tags: ["core", "action chunking"] },
        { arxiv: "2410.24164", title: "π0: A Vision-Language-Action Flow Model for General Robot Control", authors: "Kevin Black et al. · Physical Intelligence", year: 2024,
          desc: "Scales the recipe up: a pretrained VLM backbone plus a flow-matching action expert that emits 50 Hz action chunks. The template most generalist policies now follow.",
          tags: ["VLA", "flow matching"] },
        { arxiv: "2504.16054", title: "π0.5: a Vision-Language-Action Model with Open-World Generalization", authors: "Physical Intelligence", year: 2025,
          desc: "Co-trains on heterogeneous robots, web data and high-level subtask prediction so the flow-based policy can clean kitchens and bedrooms in homes it has never seen.",
          tags: ["VLA", "flow matching"] },
        { arxiv: "2506.07339", title: "Real-Time Execution of Action Chunking Flow Policies", authors: "Kevin Black, Manuel Y. Galliker, Sergey Levine", year: 2025,
          desc: "Real-time chunking (RTC): generate the next chunk while the current one runs, freezing the actions already committed and inpainting the rest. Works on any diffusion or flow policy without retraining.",
          tags: ["inference", "action chunking"] },
        { arxiv: "2405.07503", title: "Consistency Policy: Accelerated Visuomotor Policies via Consistency Distillation", authors: "Aaditya Prasad, Kevin Lin, Jimmy Wu, Linqi Zhou, Jeannette Bohg", year: 2024,
          desc: "Distils a trained Diffusion Policy into a one- or few-step student, cutting inference latency by an order of magnitude for onboard compute.",
          tags: ["fast inference"] },
        { arxiv: "2410.21257", title: "One-Step Diffusion Policy: Fast Visuomotor Policies via Diffusion Distillation", authors: "Zhendong Wang et al. · NVIDIA", year: 2024,
          desc: "Distils a pretrained diffusion policy into a single-step action generator, lifting control rate from a few Hz to real-time without losing success rate.",
          tags: ["fast inference"] },
        { arxiv: "2409.00588", title: "Diffusion Policy Policy Optimization", authors: "Allen Z. Ren et al.", year: 2024,
          desc: "DPPO. Fine-tunes a pretrained diffusion policy with policy-gradient RL by treating the denoising chain as part of the MDP — the standard reference for RL on top of Diffusion Policy.",
          tags: ["RL fine-tuning"] },
        { arxiv: "2407.01812", title: "Equivariant Diffusion Policy", authors: "Dian Wang et al.", year: 2024,
          desc: "Builds task symmetries (SO(2) rotations) into the denoising network, so the policy needs noticeably fewer demonstrations.",
          tags: ["architecture"] },
        { arxiv: "2410.07864", title: "RDT-1B: a Diffusion Foundation Model for Bimanual Manipulation", authors: "Songming Liu et al. · Tsinghua", year: 2024,
          desc: "A 1.2B-parameter diffusion transformer pretrained across many robots with a unified action space, aimed at bimanual tasks.",
          tags: ["foundation model", "bimanual"] },
        { arxiv: "2405.12213", title: "Octo: An Open-Source Generalist Robot Policy", authors: "Octo Model Team", year: 2024,
          desc: "Transformer generalist trained on Open X-Embodiment with a diffusion action head; the open baseline many labs fine-tune.",
          tags: ["foundation model"] },
        { arxiv: "2503.14734", title: "GR00T N1: An Open Foundation Model for Generalist Humanoid Robots", authors: "NVIDIA", year: 2025,
          desc: "Dual-system humanoid model: a VLM for reasoning feeding a diffusion-transformer action module trained with flow matching.",
          tags: ["VLA", "humanoid"] },
        { arxiv: "2409.14411", title: "Scaling Diffusion Policy in Transformer to 1 Billion Parameters for Robotic Manipulation", authors: "Minjie Zhu et al.", year: 2024,
          desc: "ScaleDP. Diagnoses why the original transformer variant trains poorly when enlarged and fixes it so diffusion policies scale to 1B parameters.",
          tags: ["architecture", "scaling"] },
        { arxiv: "2410.10088", title: "The Ingredients for Robotic Diffusion Transformers", authors: "Sudeep Dasari et al.", year: 2024,
          desc: "A careful ablation of what makes diffusion-transformer policies work at scale on long-horizon bimanual tasks, without per-task tuning.",
          tags: ["architecture"] },
        { arxiv: "2408.17355", title: "Bidirectional Decoding: Improving Action Chunking via Guided Test-Time Sampling", authors: "Yuejiang Liu et al.", year: 2024,
          desc: "Analyses when chunking helps or hurts, then samples several chunks and picks the one consistent with past decisions yet reactive to new observations.",
          tags: ["inference", "action chunking"] },
        { arxiv: "2406.04806", title: "Streaming Diffusion Policy: Fast Policy Synthesis with Variable Noise Diffusion Models", authors: "Sigmund H. Høeg et al.", year: 2024,
          desc: "Keeps a rolling buffer of partially denoised actions — near actions clean, far actions noisy — so each control step needs only a few denoising passes.",
          tags: ["fast inference"] },
        { arxiv: "2402.10885", title: "3D Diffuser Actor: Policy Diffusion with 3D Scene Representations", authors: "Tsung-Wei Ke, Nikolaos Gkanatsios, Katerina Fragkiadaki", year: 2024,
          desc: "Denoises end-effector trajectories while attending to a 3D scene token field; strong results on RLBench and CALVIN.",
          tags: ["3D"] },
        { arxiv: "2410.10803", title: "Generalizable Humanoid Manipulation with 3D Diffusion Policies", authors: "Yanjie Ze et al.", year: 2024,
          desc: "iDP3. Egocentric point clouds make DP3 work on a full-size humanoid, with skills transferring to new scenes from single-scene data.",
          tags: ["3D", "humanoid"] },
        { arxiv: "2406.01586", title: "ManiCM: Real-time 3D Diffusion Policy via Consistency Model for Robotic Manipulation", authors: "Guanxing Lu et al.", year: 2024,
          desc: "Applies consistency distillation to DP3 for one-step 3D action generation.",
          tags: ["3D", "fast inference"] },
        { arxiv: "2412.04987", title: "FlowPolicy: Enabling Fast and Robust 3D Flow-based Policy via Consistency Flow Matching for Robot Manipulation", authors: "Qinglun Zhang et al.", year: 2024,
          desc: "Consistency flow matching on point-cloud inputs: single-step inference with success rates comparable to DP3.",
          tags: ["3D", "flow matching"] },
        { arxiv: "2409.07343", title: "Learning Robotic Manipulation Policies from Point Clouds with Conditional Flow Matching", authors: "Eugenio Chisari et al.", year: 2024,
          desc: "PointFlowMatch. One of the first clean demonstrations that flow matching can replace DDPM as the policy objective on RLBench.",
          tags: ["flow matching", "3D"] },
        { arxiv: "2409.01083", title: "Affordance-based Robot Manipulation with Flow Matching", authors: "Fan Zhang, Michael Gienger", year: 2024,
          desc: "Compares flow matching against diffusion for visuomotor policies and finds it trains more stably and infers faster.",
          tags: ["flow matching"] },
        { arxiv: "2403.03890", title: "Hierarchical Diffusion Policy for Kinematics-Aware Multi-Task Robotic Manipulation", authors: "Xiao Ma et al.", year: 2024,
          desc: "Splits control into a high-level next-pose agent and a low-level diffusion that produces kinematically feasible joint trajectories.",
          tags: ["architecture"] },
        { arxiv: "2407.01531", title: "Sparse Diffusion Policy: A Sparse, Reusable, and Flexible Policy for Robot Learning", authors: "Yixiao Wang et al.", year: 2024,
          desc: "Mixture-of-experts inside the diffusion transformer, so multi-task and continual learning activate only the experts a task needs.",
          tags: ["architecture", "multi-task"] },
        { arxiv: "2402.02511", title: "PoCo: Policy Composition from and for Heterogeneous Robot Learning", authors: "Lirui Wang et al.", year: 2024,
          desc: "Composes separately trained diffusion policies at inference time by combining their score predictions across modalities and domains.",
          tags: ["composition"] },
        { arxiv: "2505.05787", title: "Demystifying Diffusion Policies: Action Memorization and Simple Lookup Table Alternatives", authors: "", year: 2025,
          desc: "Argues that in the low-data regime diffusion policies largely memorise an action lookup keyed on the observation — a useful sceptical read.",
          tags: ["analysis"] },
        { arxiv: "2510.01404", title: "How Well Do Diffusion Policies Learn Kinematic Constraint Manifolds?", authors: "Lexi Foland et al.", year: 2025,
          desc: "Measures how precisely a trained diffusion policy respects hard kinematic constraints present in its demonstrations.",
          tags: ["analysis"] },
        { arxiv: "2507.10543", title: "MP1: MeanFlow Tames Policy Learning in 1-step for Robotic Manipulation", authors: "Juyi Sheng et al.", year: 2025,
          desc: "Brings MeanFlow to robot policies for one-step action generation without a distillation stage.",
          tags: ["fast inference", "flow matching"] },
        { arxiv: "2506.09422", title: "Time-Unified Diffusion Policy with Action Discrimination for Robotic Manipulation", authors: "", year: 2025,
          desc: "Uses one time-independent velocity field for denoising plus an action-discrimination objective, to speed up and stabilise action generation.",
          tags: ["architecture"] },
        { arxiv: "2505.23705", title: "Knowledge Insulating Vision-Language-Action Models: Train Fast, Run Fast, Generalize Better", authors: "Danny Driess et al. · Physical Intelligence", year: 2025,
          desc: "Shows that attaching a diffusion or flow expert naively damages the VLM's knowledge and slows training, and proposes insulating the backbone from the expert's gradients.",
          tags: ["VLA", "training"] },
        { arxiv: "2511.14759", title: "π*0.6: a VLA That Learns From Experience", authors: "Physical Intelligence", year: 2025,
          desc: "RECAP: advantage-conditioned RL that lets a flow-based VLA improve from its own rollouts and human corrections — laundry, box assembly, espresso.",
          tags: ["VLA", "RL fine-tuning"] },
        { arxiv: "2501.09747", title: "FAST: Efficient Action Tokenization for Vision-Language-Action Models", authors: "Karl Pertsch et al.", year: 2025,
          desc: "The discrete counterpoint: compress action chunks with a DCT-based tokenizer so autoregressive VLAs can match diffusion on dexterous, high-frequency tasks.",
          tags: ["VLA", "tokenization"] },
        { arxiv: "2506.01844", title: "SmolVLA: A Vision-Language-Action Model for Affordable and Efficient Robotics", authors: "Hugging Face / LeRobot", year: 2025,
          desc: "A small VLA with a flow-matching action expert and asynchronous inference, trainable and runnable on consumer hardware.",
          tags: ["VLA", "flow matching"] },
        { arxiv: "2411.19650", title: "CogACT: A Foundational Vision-Language-Action Model for Synergizing Cognition and Action in Robotic Manipulation", authors: "", year: 2024,
          desc: "Conditions a large diffusion action transformer on VLM features instead of quantising actions into tokens.",
          tags: ["VLA"] },
        { arxiv: "2406.09246", title: "OpenVLA: An Open-Source Vision-Language-Action Model", authors: "Moo Jin Kim et al.", year: 2024,
          desc: "The autoregressive baseline that diffusion and flow VLAs are usually measured against; its paper includes a head-to-head with Diffusion Policy.",
          tags: ["VLA", "baseline"] },
        { arxiv: "2504.08438", title: "Diffusion Models for Robotic Manipulation: A Survey", authors: "", year: 2025,
          desc: "Survey of diffusion in manipulation — grasp learning, trajectory planning, visuomotor policies and data augmentation. Good map of the territory.",
          tags: ["survey"] },
        { arxiv: "2510.10903", title: "Towards a Unified Understanding of Robot Manipulation: A Comprehensive Survey", authors: "", year: 2025,
          desc: "A very large survey of manipulation learning; the diffusion and flow policy sections double as a bibliography with 1000+ references.",
          tags: ["survey"] },
        { arxiv: "2605.02881", title: "MolmoAct2: Action Reasoning Models for Real-World Deployment", authors: "Haoquan Fang, Jiafei Duan et al. · Allen Institute for AI", year: 2026,
          desc: "Fully open VLA for low-cost arms: a spatial-reasoning VLM backbone, a flow-matching action expert conditioned on the VLM's keys and values at every layer, and an adaptive depth-reasoning variant. Releases 720+ hours of bimanual YAM data.",
          tags: ["2026", "VLA", "flow matching"] },
        { arxiv: "2603.12480", title: "One-Step Flow Policy: Self-Distillation for Fast Visuomotor Policies", authors: "", year: 2026,
          desc: "Reaches single-step action generation through self-distillation, with no separate pretrained teacher.",
          tags: ["2026", "fast inference"] },
        { arxiv: "2606.12365", title: "Ambient Diffusion Policy: Imitation Learning from Suboptimal Data in Robotics", authors: "", year: 2026,
          desc: "Trains diffusion policies on mixed-quality demonstrations, using corrupted or suboptimal data without letting it drag the policy down.",
          tags: ["2026", "data quality"] },
        { arxiv: "2606.14535", title: "Spatially Conditioned Diffusion Policy: Learning Precise and Robust Manipulation with a Single RGB Camera", authors: "", year: 2026,
          desc: "Adds explicit spatial conditioning so a single RGB camera is enough for precise, robust manipulation.",
          tags: ["2026", "architecture"] },
        { arxiv: "2608.02547", title: "Why Does Action Chunking Improve Behavioral Cloning Performance in Robotic Control?", authors: "", year: 2026,
          desc: "A direct look at the mechanism behind the chunking trick that Diffusion Policy and ACT made standard.",
          tags: ["2026", "analysis", "action chunking"] },
        { arxiv: "2511.19433", title: "Mixture of Horizons in Action Chunking", authors: "", year: 2026,
          desc: "Combines several chunk horizons in one policy instead of committing to a single prediction length.",
          tags: ["action chunking"] },
        { arxiv: "2511.12101", title: "Decoupled Action Expert: Confining Task Knowledge to the Conditioning Pathway", authors: "Shuai Fu et al. · University of Adelaide", year: 2026,
          desc: "Asks whether diffusion and flow action experts need hundreds of millions of parameters, and argues task knowledge can live in the conditioning pathway instead.",
          tags: ["VLA", "architecture"] },
        { arxiv: "2609.21216", title: "Fewer Steps, Better Actions: Rethinking Flow-Matching Inference for VLA Policies", authors: "Zhipeng Tang et al.", year: 2026,
          desc: "Finds that more integration steps cost compute without reliably improving closed-loop success, and revisits how many a flow VLA needs.",
          tags: ["2026", "inference"] },
        { arxiv: "2609.20646", title: "TraceFlow: Guiding Frozen Flow-Matching Robot Policies with Success and Failure Traces", authors: "Jiaxuan Zhang, Ruizhe Liu, Yu Zhang, Yanchao Yang", year: 2026,
          desc: "Steers a frozen flow-matching VLA at inference time using traces of earlier successes and failures.",
          tags: ["2026", "guidance"] },
        { arxiv: "2606.04968", title: "Potential-Guided Flow Matching for Vision-Language-Action Policy Improvement", authors: "Yunpeng Mei et al.", year: 2026,
          desc: "ForesightFlow: a self-guided flow policy that attaches a learned success signal to each generated chunk, sitting between filtered BC and offline RL.",
          tags: ["2026", "guidance"] },
        { arxiv: "2607.02092", title: "Guided Action Flow: Q-Guided Inference for Flow-Matching Vision-Language-Action Policies", authors: "Liuhaichen Yang et al.", year: 2026,
          desc: "Test-time Q-value guidance of the flow transport, improving a base policy without retraining it.",
          tags: ["2026", "guidance"] },
        { arxiv: "2607.04609", title: "SEAM: Smooth Execution of Action-Chunked Motion for Vision-Language-Action Policies", authors: "", year: 2026,
          desc: "Training-free correction inside the ODE solver that uses the previous chunk's unexecuted tail to smooth chunk boundaries.",
          tags: ["2026", "action chunking"] },
        { arxiv: "2609.39754", title: "ChunkTrust: Adapting Execution Horizons for Robot Policies with Action-Expert Evidence", authors: "", year: 2026,
          desc: "Adapts how much of each predicted chunk to execute, based on evidence from the action expert itself.",
          tags: ["2026", "action chunking"] },
        { arxiv: "2609.39822", title: "Toward Real-Time VLAs: Stage-Aware Two-Step Flow Denoising and System-Level Evaluation", authors: "", year: 2026,
          desc: "Two-step, stage-aware flow denoising for real-time VLAs, evaluated at the whole-system level.",
          tags: ["2026", "fast inference"] },
        { arxiv: "2609.36471", title: "Staircase Policy: Streaming Inference for World-Action Models with Large Action Chunks", authors: "", year: 2026,
          desc: "Streaming inference for world-action models that predict large chunks.",
          tags: ["2026", "inference"] },
        { arxiv: "2607.24008", title: "FutureRTC: Real-Time Robot Execution with Anticipatory-Conditioned Action Chunking", authors: "", year: 2026,
          desc: "Extends real-time chunking by conditioning on anticipated future state.",
          tags: ["2026", "action chunking"] },
        { arxiv: "2605.13959", title: "WarmPrior: Straightening Flow-Matching Policies with Temporal Priors", authors: "", year: 2026,
          desc: "Starts the flow from a temporal prior instead of pure noise to straighten the path and cut steps.",
          tags: ["2026", "flow matching"] },
        { arxiv: "2601.21998", title: "Causal World Modeling for Robot Control", authors: "Lin Li, Qihang Zhang et al.", year: 2026,
          desc: "LingBot-VA: an autoregressive diffusion model that predicts future frames and actions together in a shared latent space.",
          tags: ["2026", "world model"] },
        { arxiv: "2608.11739", title: "G0.5: One Autoregressive Stream for Robot Reasoning and Action", authors: "Galaxea Team", year: 2026,
          desc: "A counter-position to the flow-expert recipe: one decoder emits reasoning and action tokens under a single objective, and reports beating π0.5 on its benchmarks.",
          tags: ["2026", "VLA", "counterpoint"] },
        { arxiv: "2006.11239", title: "Denoising Diffusion Probabilistic Models", authors: "Jonathan Ho, Ajay Jain, Pieter Abbeel", year: 2020,
          desc: "DDPM — the generative model Diffusion Policy repurposes for actions.",
          tags: ["foundations"] },
        { arxiv: "2210.02747", title: "Flow Matching for Generative Modeling", authors: "Yaron Lipman et al.", year: 2022,
          desc: "The objective behind π0-style action experts: regress a velocity field along simple probability paths.",
          tags: ["foundations", "flow matching"] },
        { arxiv: "2205.09991", title: "Planning with Diffusion for Flexible Behavior Synthesis", authors: "Michael Janner, Yilun Du, Joshua Tenenbaum, Sergey Levine", year: 2022,
          desc: "Diffuser — diffusion over whole state-action trajectories for planning; the immediate precursor.",
          tags: ["foundations"] },
        { arxiv: "2211.15657", title: "Is Conditional Generative Modeling all you need for Decision-Making?", authors: "Anurag Ajay et al.", year: 2022,
          desc: "Decision Diffuser: return- and constraint-conditioned trajectory diffusion.",
          tags: ["foundations"] },
        { arxiv: "2208.06193", title: "Diffusion Policies as an Expressive Policy Class for Offline Reinforcement Learning", authors: "Zhendong Wang, Jonathan J. Hunt, Mingyuan Zhou", year: 2022,
          desc: "Diffusion-QL — diffusion as the policy class in offline RL, months before the visuomotor version.",
          tags: ["foundations", "RL"] },
        { arxiv: "2304.02532", title: "Goal-Conditioned Imitation Learning using Score-based Diffusion Policies", authors: "Moritz Reuss et al.", year: 2023,
          desc: "BESO. Concurrent score-based take on goal-conditioned imitation, with few-step sampling.",
          tags: ["foundations"] },
        { arxiv: "2109.00137", title: "Implicit Behavioral Cloning", authors: "Pete Florence et al.", year: 2021,
          desc: "IBC — the energy-based baseline Diffusion Policy was built to beat.",
          tags: ["foundations", "baseline"] },
        { arxiv: "2206.11251", title: "Behavior Transformers: Cloning k modes with one stone", authors: "Nur Muhammad Mahi Shafiullah et al.", year: 2022,
          desc: "BeT — discretised action modes plus offsets; the other main baseline in the original paper.",
          tags: ["foundations", "baseline"] }
      ]
    },
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

/* Linked papers carry an arXiv id instead of a local file; they open
   in papers/read.html (an iframe on arXiv) rather than the PDF reader. */
function findLinkedPaper(slug, id){
  const cat = PAPERS.categories.find(c => c.slug === slug);
  if(!cat) return null;
  const index = cat.papers.findIndex(p => p.arxiv === id);
  return index < 0 ? null : { cat, paper: cat.papers[index], index };
}

function paperStamp(p){ return p.stamp || (p.arxiv ? `arXiv:${p.arxiv}` : ''); }

function papersCount(){
  return PAPERS.categories.reduce((n, c) => n + c.papers.length, 0);
}
