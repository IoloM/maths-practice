/**
 * Videos for each topic, from A level maths channels on YouTube: each id was checked on 25 Oct 2026
 * with YouTube's oEmbed lookup (it exists, can be embedded, and has this title and channel).
 * They play from youtube-nocookie.com only when tapped.
 */
export interface Video {
  id: string;
  title: string;
  channel: string;
}

export const VIDEOS: Record<string, Video[]> = {
  'P1.1': [
    { id: "liD1DB3YBHc", title: "Surds: Rationalising The Denominator of Surds Explained From Basics | A Level Maths", channel: "A Level Maths Tutor | John Armstrong" },
    { id: "yH6jtQOfD6k", title: "Year 1 Pure A Level maths 1.6 Surds and rationalising denominators", channel: "MPTheTutor" },
  ],
  'P1.2': [
    { id: "UiLwuMUbNAQ", title: "A Level Maths | Pure - Year 1 | Completing the Square ✏️", channel: "AJMaths" },
    { id: "xHd-7O6n4Gg", title: "The Discriminant", channel: "Maths Genie" },
  ],
  'P1.3': [
    { id: "H-bljyJT50k", title: "Quadratic Inequalities - A Level Maths", channel: "RevisionSolutions" },
    { id: "3sEeMSNTy2k", title: "How to solve a Quadratic Inequality : ExamSolutions Maths Revision", channel: "ExamSolutions" },
  ],
  'P1.4': [
    { id: "v4L2ztR9y44", title: "Graphs & Transformations in less than 22 minutes • A-Level Maths, Pure Year 1, Chapter 4 📚", channel: "Bicen Maths" },
    { id: "ml7ybtqSGHQ", title: "Graph Transformations - A Level Maths", channel: "RevisionSolutions" },
  ],
  'P1.5': [
    { id: "540-CuFm11o", title: "All of Straight Line Graphs in 20 Minutes! | Chapter 5 | A-Level Pure Maths Revision", channel: "The GCSE Maths Tutor" },
  ],
  'P1.6': [
    { id: "DiL9WZyk6qg", title: "The Equation of a Circle", channel: "Maths Genie" },
    { id: "2NOlIZU5EII", title: "Equation of a circle and tangent| ExamSolutions", channel: "ExamSolutions" },
  ],
  'P1.7': [
    { id: "b88DwALjFdw", title: "The Factor Theorem and The Remainder Theorem", channel: "Maths Genie" },
    { id: "3jlNBt3FMCM", title: "Polynomial Division And Factor Theorem: Polynomial Division Explained From Basics | A Level Maths", channel: "A Level Maths Tutor | John Armstrong" },
  ],
  'P1.8': [
    { id: "t3CNjIdIhFs", title: "All of Binomial Expansion in 25 Minutes!! | Chapter 8 | A-Level Pure Maths Revision", channel: "The GCSE Maths Tutor" },
    { id: "hbTmD65PXiQ", title: "Binomial Expansion: Binomial Expansion Explained From Basics | A Level Maths", channel: "A Level Maths Tutor | John Armstrong" },
  ],
  'P1.9': [
    { id: "pEgVkT4kTH8", title: "A Level Maths | Pure - Year 1 | Solving Triangle Problems", channel: "AJMaths" },
    { id: "TCJ_IboROww", title: "How and when to use Sine Rule, Cosine Rule and Finding the Area of a Triangle", channel: "Mathnetics by SRS" },
  ],
  'P1.10': [
    { id: "NiRxGpOdCno", title: "All of Trigonometric Identities and Equations in 30 minutes!! | Chapter 10 | A level Pure Maths", channel: "The GCSE Maths Tutor" },
    { id: "0HgvpQ6-hyo", title: "Harder Trigonometric Equations P2 - Trigonometric Identities and Equations - Edexcel A Level Maths", channel: "Former A Level Maths Student" },
  ],
  'P1.11': [
    { id: "YOSqHs4EhuI", title: "All of Vectors and Magnitude in 40 Minutes!!! | Chapter 11 | A Level Pure Maths", channel: "The GCSE Maths Tutor" },
    { id: "91XPzijUndw", title: "Position Vectors | A-Level Mathematics | Mr Mathematics", channel: "Jonathan Robinson" },
  ],
  'P1.12': [
    { id: "GAnsCSm9CHo", title: "A Level Maths | Pure - Year 1 | Stationary Points and Finding the second Derivative", channel: "AJMaths" },
    { id: "jHrSj9os4n4", title: "Differentiation: Tangents and Normals - A-Level Maths", channel: "I'm Stuck - GCSE and A-Level Revision" },
  ],
  'P1.13': [
    { id: "X3p_VXgakOY", title: "Integration: Areas Under a Curve | A-level and IB Maths 😊➕ Addvance Maths!", channel: "Addvance Maths" },
    { id: "cmMQ8bHb65U", title: "How to Find The Area Under a Curve With Integration | A-Level Maths", channel: "Jack's Maths" },
  ],
  'P1.14': [
    { id: "IsJCozx_X8Q", title: "Introduction to Laws of Logs (Exponentials & Logarithms 3) | A-Level Maths", channel: "Jack's Maths" },
    { id: "Zcv3odlerdE", title: "Laws of Logarithms (& Proof) | A-Level Maths", channel: "Jack's Maths" },
  ],
  'P2.1': [
    { id: "MfTmjQnGOA8", title: "Proof by Contradiction in less than 18 minutes • A-Level Maths, Pure Year 2, Chapter 1a 📚", channel: "Bicen Maths" },
    { id: "P7dxx8lKJ3w", title: "Rational Expressions: Partial Fractions Explained From Basics | A Level Maths", channel: "A Level Maths Tutor | John Armstrong" },
  ],
  'P2.2': [
    { id: "xCjceDJN2Kg", title: "Functions: Composite Functions, Inverse Functions and Modulus Functions - A-Level Maths", channel: "I'm Stuck - GCSE and A-Level Revision" },
    { id: "v6_oSHb8Pfs", title: "Composite and Inverse Functions - Functions and Graphs (Year 2) - Edexcel A Level Maths", channel: "Former A Level Maths Student" },
  ],
  'P2.3': [
    { id: "g3E_A598BVs", title: "Edexcel A Level Maths: 3.6 Sigma Notation ( Summation, Geometric Series, Arithmetic Series)", channel: "Zeeshan Zamurred" },
    { id: "fGXBcn_9L4g", title: "Edexcel A Level Maths: 3.5 Sum to Infinity (Geometric Series)", channel: "Zeeshan Zamurred" },
  ],
  'P2.4': [
    { id: "HfoDn7xZvyU", title: "Introduction to General Binomial Expansion and Domain of Validity [Yr2 Pure]", channel: "A Level Maths Tutor | John Armstrong" },
    { id: "mtr9DXmMdL4", title: "Binomial Expansion: for Negative & Fractional Powers (1+bx)^n", channel: "Maths Like A Legend" },
  ],
  'P2.5': [
    { id: "J1BSB-E_5zo", title: "Arc Length and Sector Area - Edexcel A Level Maths, Radians", channel: "Former A Level Maths Student" },
    { id: "j3d6q-cB3NI", title: "Small Angle Approximations! - Edexcel A Level Maths - Radians (Year 2)", channel: "Former A Level Maths Student" },
  ],
  'P2.6': [
    { id: "XFE4S5iyAxU", title: "Reciprocal Trigonometric Functions - Sec, Cosec and Cot - A-Level Maths", channel: "I'm Stuck - GCSE and A-Level Revision" },
    { id: "mN-mDrN6b7E", title: "Inverse Trigonometric Functions! - Edexcel A Level Maths", channel: "Former A Level Maths Student" },
  ],
  'P2.7': [
    { id: "ksYO2BqrbWQ", title: "Edexcel A level Maths : 7.3 The Double Angle Formulae", channel: "Zeeshan Zamurred" },
    { id: "nnvboWHeuEA", title: "The Harmonic Form (Rcosx+a) | A Level Maths", channel: "Tailored Tutors" },
  ],
  'P2.8': [
    { id: "xDG__C9xmkE", title: "Parametric and Cartesian Equations | A-Level Pure Mathematics | Mr Mathematics", channel: "Jonathan Robinson" },
    { id: "O52m8cYtVgY", title: "Parametric Equations and Cartesian Equations Explained From Basics | A Level Maths", channel: "A Level Maths Tutor | John Armstrong" },
  ],
  'P2.9': [
    { id: "iku7joE2T6w", title: "DIFFERENTIATION: CHAIN RULE, QUOTIENT RULE AND PRODUCT RULE| A-LEVELS MATHS 2022: PURE |", channel: "Aisha.Academy" },
    { id: "S4PqQ0a0MD8", title: "What is Implicit Differentiation? - Edexcel A Level Maths", channel: "Former A Level Maths Student" },
  ],
  'P2.10': [
    { id: "dn17V-pbZj4", title: "Newton-Raphson Method | A-Level Pure Mathematics | Mr Mathematics", channel: "Jonathan Robinson" },
    { id: "hhSG8h2tOoQ", title: "A Level Pure Maths - Iteration (Newton-Raphson method)", channel: "Hinds Maths" },
  ],
  'P2.11': [
    { id: "E2tXeqd1tiY", title: "Integration by Substitution Example Questions | A-Level Maths", channel: "Jack's Maths" },
    { id: "ueWWMLrR4Ow", title: "Integration by Parts", channel: "Maths Genie" },
  ],
  'P2.12': [
    { id: "HEA2RoUO1Pc", title: "Introduction to 3D Vectors | A-Level Pure Mathematics | Mr Mathematics", channel: "Jonathan Robinson" },
    { id: "HsJiw62ErUU", title: "All of Year 2 3D Vectors + 7 Past Exam Questions! - Edexcel A Level Maths", channel: "Former A Level Maths Student" },
  ],
  'SM1.1': [
    { id: "JwE69XEzqkM", title: "Statistics: Sampling Techniques - A-Level Maths", channel: "I'm Stuck - GCSE and A-Level Revision" },
    { id: "xQCV5SGMDKs", title: "Sampling Methods - Year 1 Statistics [A-level]", channel: "1st Class Maths" },
  ],
  'SM1.2': [
    { id: "oLX8lSadLjk", title: "Variance and Standard Deviation - Year 1 Statistics [A-level]", channel: "1st Class Maths" },
    { id: "EBIhlAc9iYY", title: "Edexcel AS Level Maths: 2.5 Coding (Mean and Standard Deviation)", channel: "Zeeshan Zamurred" },
  ],
  'SM1.3': [
    { id: "TDKwYiO7rqU", title: "Histograms - Statistics Edexcel A Level and AS Maths - Representations of Data", channel: "Former A Level Maths Student" },
    { id: "rvrJenFJhbs", title: "Outliers, Box Plots and Cumulative Frequency - Year 1 Statistics [A-level]", channel: "1st Class Maths" },
  ],
  'SM1.4': [
    { id: "upseC-rZ5QI", title: "Correlation and Regression Lines - Year 1 Statistics [A-level]", channel: "1st Class Maths" },
    { id: "MRdwfxlW0Nw", title: "161 - MME - A Level Maths - Statistics - Correlation and Regression", channel: "MME" },
  ],
  'SM1.5': [
    { id: "-WQ9P0LHPy8", title: "Venn Diagrams - Statistics Edexcel A Level and AS Maths Probability", channel: "Former A Level Maths Student" },
    { id: "sKwa7eWs2PI", title: "Probability Tree Diagrams and Independent Events | ExamSolutions - maths problems answered", channel: "ExamSolutions" },
  ],
  'SM1.6': [
    { id: "uyZk4J-MOz0", title: "The Binomial Distribution - Year 1 Statistics [A-level]", channel: "1st Class Maths" },
    { id: "ikE0AhaVhWI", title: "Cumulative Binomial Distribution [Year 1 Maths (Stats)]", channel: "A Level Maths Tutor | John Armstrong" },
  ],
  'SM1.7': [
    { id: "z4kccxhR53k", title: "Hypothesis Testing (Binomial) in 24 minutes • A-Level Maths, Statistics Year 1, Chapter 7 📚", channel: "Bicen Maths" },
    { id: "_iwj050_VM8", title: "Binomial Hypothesis Testing - Statistics Edexcel A Level and AS Maths", channel: "Former A Level Maths Student" },
  ],
  'SM1.8': [
    { id: "gCQYpCjBbIM", title: "MECHANICS YEAR 1 || CHAPTER 1 || MODELLING IN MECHANICS (A LEVELS SELF STUDY)", channel: "Sachchit Prasad" },
  ],
  'SM1.9': [
    { id: "l8-bMuXpK-8", title: "Mechanics: SUVAT Equations - A-Level Maths", channel: "I'm Stuck - GCSE and A-Level Revision" },
    { id: "G_vVsM_Y_x4", title: "Velocity-Time Graphs - Year 1 Mechanics [A-level]", channel: "1st Class Maths" },
  ],
  'SM1.10': [
    { id: "TmHbx6kCwrs", title: "Edexcel A Level Maths: 7.6 Pulleys and Connected Particles", channel: "Zeeshan Zamurred" },
    { id: "fPbPTuDeppk", title: "Pulley Problems: Particle Strikes the Ground - A-Level Maths", channel: "MathsArc" },
  ],
  'SM1.11': [
    { id: "HvnG05KO0nU", title: "Variable Acceleration - Year 1 Mechanics [A-level]", channel: "1st Class Maths" },
    { id: "elIWixzoXG8", title: "Using Calculus with Kinematics | A-Level Maths (Mechanics)", channel: "Jack's Maths" },
  ],
  'SM2.1': [
    { id: "BMrrgKWpF_I", title: "Measuring Correlation and PMCC - Statistics Edexcel A Level Maths", channel: "Former A Level Maths Student" },
    { id: "2tvgKKo7zug", title: "Hypothesis Testing for Zero Correlation - Statistics Edexcel A Level Maths", channel: "Former A Level Maths Student" },
  ],
  'SM2.2': [
    { id: "JEA5ZT1eLCw", title: "Conditional Probability and Venn Diagrams Explained From Basics | A Level Maths", channel: "A Level Maths Tutor | John Armstrong" },
    { id: "rnMMO6QkyTo", title: "Conditional Probability and Venn Diagrams | Mr Mathematics", channel: "Jonathan Robinson" },
  ],
  'SM2.3': [
    { id: "3dHaWwHWcjc", title: "Statistics: The Normal Distribution - A-Level Maths", channel: "I'm Stuck - GCSE and A-Level Revision" },
    { id: "eTvD9Rc8qvM", title: "Normal Distribution in 30 minutes • A-Level Maths, Statistics Year 2, Chapter 3 📚", channel: "Bicen Maths" },
  ],
  'SM2.4': [
    { id: "4UhzzI2boQo", title: "Uniform Rods in Equilibrium | Moments | Mechanics - A-Level Maths", channel: "Maths Coach" },
    { id: "lR_Hh9TtXpQ", title: "Edexcel A Level Maths: 4.5 Tilting (Moments, Resultant Force)", channel: "Zeeshan Zamurred" },
  ],
  'SM2.5': [
    { id: "Kv_mK5iZw8g", title: "RESOLVING FORCES ON AN INCLINED PLANE (Rough/Smooth) - Normal Reaction Force, Friction", channel: "MathsArc" },
    { id: "txMHb6j_zFI", title: "Frictional Forces in Inclined Planes | Mr Mathematics", channel: "Jonathan Robinson" },
  ],
  'SM2.6': [
    { id: "abf28DRe-zo", title: "Edexcel A Level Maths: 6.2 Projectiles (Horizontal and Vertical Components)", channel: "Zeeshan Zamurred" },
  ],
  'SM2.7': [
    { id: "jmfcKJgDwgk", title: "A22 A-level Maths: Moments video 4 : Ladders, Normal Reactions, Friction & Limiting Equilibrium", channel: "N.I. Maths Tutor" },
    { id: "xwv0wwojTUc", title: "Edexcel A Level Maths: 7.4 Hinges, Beams and Rods (Static of Rigid Body Part 2)", channel: "Zeeshan Zamurred" },
  ],
  'SM2.8': [
    { id: "FXlaFsOb8SI", title: "Mechanics: Two Dimensional Motion with Variable Acceleration - A-Level Maths", channel: "I'm Stuck - GCSE and A-Level Revision" },
    { id: "ZIVdoLd5C_E", title: "Edexcel A Level Maths: 8.4 Differentiating Vectors", channel: "Zeeshan Zamurred" },
  ],
};
