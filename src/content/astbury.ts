/**
 * Mr Astbury's "A Level Exam Qs Series – Pure" (version 3, 430 pages) and the matching "Full Worked
 * Solutions" (146 pages): where each question and its solution are. Only page numbers, marks and
 * the source paper printed in the margin are kept here. The booklets themselves are loaded by the
 * student from their own copy and stay on their device (lib/booklet-files.ts).
 */
export interface BookletQuestion {
  /** e.g. '1.1:3' */
  id: string;
  section: string;
  n: number;
  /** first page of the question in the booklet, and how many pages it takes */
  page: number;
  pages: number;
  /** total marks (null for a few adapted questions) */
  marks: number | null;
  /** first page of its worked solution, and how many pages to show */
  solPage: number;
  solPages: number;
  /** the paper it comes from, as printed in the margin */
  source: string;
  /** its parts and their marks, from the worked solutions; one unlabelled part when it has no parts */
  parts: { label: string; marks: number }[];
}

export interface BookletSection {
  id: string;
  /** chapter in the textbook, e.g. '1.12' */
  ref: string;
  title: string;
  year: 1 | 2;
  /** the matching chapter in this app, for practice */
  chapter: string;
  /** the topic in this app it counts towards (progress, spaced review) */
  family: string;
  questions: BookletQuestion[];
}

export const BOOKLET_PAGES = 430;
export const SOLUTIONS_PAGES = 146;

/** "a3 b4" → parts (a) 3 marks, (b) 4 marks; "" → one part worth the whole question */
const partsOf = (spec: string, marks: number | null) => (spec ? spec.split(' ').map((p) => ({ label: p.replace(/\d+$/, ''), marks: Number(p.match(/\d+$/)![0]) })) : marks ? [{ label: '', marks }] : []);

type Row = [page: number, pages: number, marks: number | null, solPage: number, solPages: number, source: string, parts: string];
const S = (id: string, ref: string, title: string, chapter: string, family: string, rows: Row[]): BookletSection => ({
  id,
  ref,
  title,
  year: ref.startsWith('1.') ? 1 : 2,
  chapter,
  family,
  questions: rows.map(([page, pages, marks, solPage, solPages, source, parts], i) => ({ id: `${id}:${i + 1}`, section: id, n: i + 1, page, pages, marks, solPage, solPages, source, parts: partsOf(parts, marks) })),
});

export const BOOKLET: BookletSection[] = [
  S('1.1', '1.1', 'Algebraic Expressions', 'P1.1', 'p1.1.indices', [
    [5, 1, 6, 4, 1, 'UK – Jan 2010 – C1 – Q2', 'a3 b3'],
    [6, 1, 4, 4, 2, 'IAL – May 2017 – C12 – Q2', 'a1 b1 c2'],
    [7, 1, 4, 5, 1, 'IAL – Oct 2023 – P1 – Q2', 'a1 b1 c2'],
    [8, 1, 6, 5, 1, 'IAL – May 2019 – C12 – Q2', 'a3 b3'],
    [9, 1, 7, 5, 2, 'IAL – May 2016 – C12 – Q3', 'i3 a2 b2'],
    [10, 1, 4, 6, 1, 'IAL – May 2014 – C12 – Q2', ''],
    [11, 1, 7, 6, 2, 'IAL – Jan 2022 – P1 – Q3', 'i3 ii4'],
    [12, 1, 5, 7, 2, 'Madas – MP1 – Paper A – Q11', '']
  ]),
  S('1.2-equations', '1.2', 'Quadratics: Equations', 'P1.2', 'p1.2.solving', [
    [13, 1, 5, 8, 1, 'Madas – MP1 – Paper W – Q3', 'a2 b3'],
    [14, 1, 6, 8, 2, 'IAL – Jan 2022 – P1 – Q2', 'a3 b2 c1'],
    [15, 1, 6, 9, 1, 'UK – May 2011 – C1 – Q7', 'a2 b2 c2'],
    [16, 1, 8, 9, 2, 'Madas – MP1 – Paper V – Q4', ''],
    [17, 1, 8, 10, 1, 'Madas – MP1 – Paper H – Q5', ''],
    [18, 1, 5, 10, 1, 'IAL – Oct 2019 – P1 – Q8', ''],
    [19, 1, 6, 10, 2, 'IAL – Jan 2023 – P1 – Q5', 'a3 b3'],
    [20, 1, 7, 11, 2, 'IAL – May 2019 – P1 – Q5', 'a3 b4']
  ]),
  S('1.2-modelling', '1.2', 'Quadratics: Modelling', 'P1.2', 'p1.2.modelling', [
    [21, 2, 7, 12, 2, 'UK – June 2018 – Paper 2 – Q8', 'a3 b3 c1'],
    [23, 2, 8, 13, 2, 'IAL – June 2021 – P1 – Q5', 'a2 b1 c4 d1']
  ]),
  S('1.3', '1.3', 'Equations and Inequalities', 'P1.3', 'p1.3.inequalities', [
    [25, 1, 6, 14, 1, 'IAL – May 2016 – C12 – Q2', 'a2 b3 c1'],
    [26, 1, 7, 14, 1, 'IAL – Oct 2018 – C12 – Q2', ''],
    [27, 2, 7, 14, 2, 'IAL – June 2022 – P1 – Q6', 'a2 b5'],
    [29, 1, 7, 15, 1, 'IAL – May 2015 – C12 – Q9', 'a3 b4'],
    [30, 1, 6, 15, 2, 'IAL – Oct 2023 – P1 – Q6', 'a3 b3'],
    [31, 2, 7, 16, 1, 'IAL – May 2019 – C12 – Q11', 'a3 b4'],
    [33, 2, 7, 16, 2, 'IAL – Jan 2022 – P1 – Q4', 'a4 b3'],
    [35, 2, 6, 17, 2, 'IAL – June 2023 – P1 – Q7', 'a4 b2']
  ]),
  S('1.4', '1.4', 'Graphs and Transformations', 'P1.4', 'p1.4.transformations', [
    [37, 1, 4, 18, 1, 'IAL – Oct 2017 – C12 – Q2', 'a1 b1 c1 d1'],
    [38, 1, 5, 18, 2, 'UK – May 2013 – C1 – Q9', ''],
    [39, 2, 9, 19, 2, 'IAL – May 2015 – C12 – Q12', 'a3 b3 c3'],
    [41, 2, 6, 20, 2, 'IAL – Jan 2015 – C12 – Q3', 'a3 b3'],
    [43, 2, 4, 21, 1, 'IAL – May 2017 – C12 – Q7', 'a1 b1 c2'],
    [45, 2, 10, 21, 2, 'IAL – Jan 2023 – P1 – Q7', 'a2 b2 c2 d4'],
    [47, 2, 11, 22, 2, 'IAL – Jan 2017 – C12 – Q13', 'a5 i2 c4'],
    [49, 2, 9, 23, 2, 'IAL – Jan 2022 – P1 – Q10', 'a4 b5']
  ]),
  S('1.5', '1.5', 'Straight Line Graphs', 'P1.5', 'p1.5.equations-of-lines', [
    [51, 1, 4, 24, 1, 'Booklet label: UK – Jan 2010 – C1 – Q2', 'a1 b3'],
    [52, 1, 6, 24, 2, 'IAL – May 2018 – C12 – Q3', 'a2 b4'],
    [53, 2, 9, 25, 1, 'IAL – Oct 2017 – C12 – Q10', 'a2 b5 c2'],
    [55, 1, 8, 25, 2, 'IAL – Oct 2018 – C12 – Q7', 'a2 b2 c4'],
    [56, 1, 5, 26, 1, 'IAL – Oct 2019 – P1 – Q2', 'a4 b1'],
    [57, 2, 11, 26, 1, 'IAL – Jan 2017 – C12 – Q6', 'a3 i5 c3'],
    [59, 2, 9, 26, 2, 'IAL – Jan 2018 – C12 – Q12', 'a2 b2 c5'],
    [61, 2, 9, 27, 2, 'IAL – Jan 2022 – P1 – Q8', 'a1 b3 c3 d2']
  ]),
  S('1.6', '1.6', 'Circles', 'P1.6', 'p1.6.equation-of-circle', [
    [63, 2, 8, 28, 1, 'UK – May 2011 – C2 – Q4', 'a2 b2 c4'],
    [65, 2, 9, 28, 2, 'IAL – May 2019 – C12 – Q10', 'a5 ii4'],
    [67, 2, 9, 29, 1, 'IAL – Oct 2017 – C12 – Q13', 'a2 i3 c4'],
    [69, 2, 11, 29, 2, 'IAL – Oct 2018 – C12 – Q14', 'a2 b2 c7'],
    [71, 2, 10, 30, 2, 'IAL – May 2018 – C12 – Q13', 'a2 b1 c1 d6'],
    [73, 2, 14, 31, 1, 'IAL – Jan 2014 – C12 – Q15', 'a2 b5 c2 d5'],
    [75, 2, 12, 31, 2, 'IAL – June 2022 – P2 – Q10', 'a3 b3 c6'],
    [77, 2, 13, 32, 3, 'Madas – MP1 – Paper L – Q14', 'a3 b2 c8']
  ]),
  S('1.7-factor-theorem', '1.7', 'Algebraic Methods: Factor Theorem', 'P1.7', 'p1.7.factor-theorem', [
    [79, 1, 6, 34, 1, 'IAL – Oct 2017 – C12 – Q7', 'a2 b4'],
    [80, 1, 7, 34, 2, 'IAL – Jan 2016 – C12 – Q6', 'a2 b2 c3'],
    [81, 1, 6, 35, 1, 'IAL – June 2023 – P2 – Q2', 'a2 b4'],
    [82, 1, 6, 35, 1, 'IAL – Jan 2019 – C12 – Q13', 'a2 b2 c2'],
    [83, 2, 10, 35, 2, 'IAL – May 2017 – C12 – Q5', 'a2 b2 c4 d2'],
    [85, 2, 8, 36, 2, 'IAL – Oct 2019 – P2 – Q4', 'a1 b2 c5']
  ]),
  S('1.7-proof', '1.7', 'Algebraic Methods: Proof', 'P1.7', 'p1.7.proof', [
    [87, 1, 4, 37, 1, 'IAL – Jan 2023 – P2 – Q10', ''],
    [88, 1, 5, 37, 2, 'IAL – Jan 2022 – P2 – Q10', 'i1 ii4'],
    [89, 1, 4, 38, 1, 'IAL – Jan 2021 – P2 – Q5', 'i3 ii1'],
    [90, 1, 4, 38, 1, 'IAL – Oct 2021 – P2 – Q9', 'a3 b1'],
    [91, 1, 6, 38, 2, 'IAL – June 2024 – P2 – Q5', 'a4 b2'],
    [92, 1, 5, 39, 1, 'Madas – MP1 – Paper C – Q7', ''],
    [93, 2, 6, 39, 2, 'Madas – MP1 – Paper T – Q2', '']
  ]),
  S('1.8', '1.8', 'Binomial Expansion', 'P1.8', 'p1.8.binomial', [
    [95, 1, 7, 40, 1, 'IAL – Jan 2015 – C12 – Q4', 'a4 b3'],
    [96, 1, 7, 40, 1, 'IAL – May 2018 – C12 – Q5', 'a4 b3'],
    [97, 2, 6, 40, 2, 'IAL – Oct 2018 – C12 – Q5', 'a4 b2'],
    [99, 2, 8, 41, 1, 'IAL – May 2019 – C12 – Q6', 'a4 b4'],
    [101, 2, 7, 41, 1, 'IAL – Oct 2016 – C12 – Q5', 'a4 b3'],
    [103, 2, 8, 41, 2, 'IAL – May 2017 – C12 – Q10', 'a4 b2 c2'],
    [105, 2, 7, 42, 1, 'IAL – Jan 2020 – P2 – Q10', 'a4 b3'],
    [107, 2, 7, 42, 2, 'IAL – May 2014 – C12 – Q8', 'a1 b6'],
    [109, 2, 10, 43, 2, 'IAL – Jan 2018 – C12 – Q15', 'a2 b5 c3']
  ]),
  S('1.9', '1.9', 'Trigonometric Ratios', 'P1.9', 'p1.9.cosine-rule', [
    [111, 2, 6, 44, 1, 'IAL – May 2014 – C12 – Q1', 'a3 b3'],
    [113, 2, 7, 44, 2, 'IAL – Jan 2018 – C12 – Q13', 'a1 b2 c4'],
    [115, 1, 6, 45, 1, 'IAL – Oct 2017 – C12 – Q4', 'a3 b3'],
    [116, 1, 5, 45, 1, 'IAL – Jan 2024 – P1 – Q2', 'a2 b3'],
    [117, 2, 9, 45, 2, 'IAL – June 2021 – P1 – Q3', 'a2 b5 c2'],
    [119, 2, 4, 46, 1, 'IAL – Jan 2022 – P1 – Q9', 'a1 b3'],
    [121, 2, 8, 46, 3, 'IAL – June 2022 – P1 – Q9', 'a3 i2 c3']
  ]),
  S('1.10', '1.10', 'Trigonometric Identities and Equations', 'P1.10', 'p1.10.harder-equations', [
    [123, 2, 7, 48, 1, 'IAL – May 2016 – C12 – Q8', 'a3 b4'],
    [125, 2, 7, 48, 2, 'IAL – Oct 2020 – P2 – Q7', 'i3 ii4'],
    [127, 2, 9, 49, 1, 'IAL – May 2015 – C12 – Q13', 'i3 ii6'],
    [129, 2, 10, 49, 2, 'IAL – May 2017 – C12 – Q13', 'a4 b6'],
    [131, 2, 8, 50, 1, 'IAL – Oct 2016 – C12 – Q10', 'a3 b5'],
    [133, 2, 6, 50, 1, 'IAL – June 2022 – P2 – Q5', ''],
    [135, 2, 8, 50, 2, 'Booklet label: IAL – May 2014 – C12 – Q2', 'a3 b5'],
    [137, 2, 7, 51, 2, 'IAL – June 2023 – P2 – Q9', 'a3 b4']
  ]),
  S('1.11', '1.11', 'Vectors', 'P1.11', 'p1.11.geometry', [
    [139, 2, 7, 52, 1, 'Madas – MP1 – Paper J – Q2', 'a3 b4'],
    [141, 2, 9, 52, 2, 'Madas – MP1 – Paper K – Q5', 'a3 b2 c4'],
    [143, 2, 6, 53, 1, 'Madas – MP1 – Paper M – Q12', 'a3 b3'],
    [145, 2, 5, 53, 1, 'UK – AS – Oct 2021 – Q4', 'a2 b3'],
    [147, 2, 7, 53, 2, 'UK – AS – Oct 2023 – Q13', 'a2 b2 c3'],
    [149, 2, 8, 54, 1, 'Madas – MP1 – Paper O – Q5', 'a3 b5'],
    [151, 2, 10, 54, 2, 'Madas – MP1 – Paper P – Q1', 'a4 b3 c3'],
    [153, 2, 9, 55, 2, 'Madas – MP1 – Paper E – Q8', 'a4 b5']
  ]),
  S('1.12-tangents-and-normals', '1.12', 'Differentiation: Tangents and Normals', 'P1.12', 'p1.12.tangents-normals', [
    [155, 1, 5, 56, 1, 'IAL – May 2017 – C12 – Q4', 'a5'],
    [156, 1, 7, 56, 1, 'IAL – Jan 2024 – P1 – Q3', 'a4 b3'],
    [157, 2, 10, 56, 2, 'IAL – Jan 2016 – C12 – Q12', 'a4 b2 c4'],
    [159, 2, 5, 57, 1, 'IAL – Oct 2017 – C12 – Q16', ''],
    [161, 2, 12, 57, 3, 'Booklet label: IAL – June 2023 – P1 – Q10', 'a2 b4 c2 d4']
  ]),
  S('1.12-stationary-points', '1.12', 'Differentiation: Stationary Points', 'P1.12', 'p1.12.stationary-points', [
    [163, 2, 10, 59, 1, 'IAL – Jan 2016 – C12 – Q10', 'a2 b5 c3'],
    [165, 2, 9, 59, 2, 'IAL – Jan 2014 – C12 – Q13', 'a3 b4 c2'],
    [167, 2, 10, 60, 1, 'IAL – Oct 2016 – C12 – Q12', 'a4 b6'],
    [169, 2, 10, 60, 3, 'IAL – Jan 2020 – P2 – Q4', 'a4 b2 c4']
  ]),
  S('1.12-modelling', '1.12', 'Differentiation: Modelling', 'P1.12', 'p1.12.modelling', [
    [171, 2, 11, 62, 1, 'IAL – May 2019 – C12 – Q15', 'a4 b3 c2 d2'],
    [173, 2, 13, 62, 3, 'IAL – May 2015 – C12 – Q16', 'a2 b3 c5 d2 e1']
  ]),
  S('1.13-basic-integrals', '1.13', 'Integration: Basic Integrals', 'P1.13', 'p1.13.indefinite', [
    [175, 2, 7, 64, 1, 'IAL – May 2016 – C12 – Q6', 'a3 b4'],
    [177, 2, 9, 64, 2, 'IAL – Jan 2017 – C12 – Q7', 'i4 ii5'],
    [179, 2, 8, 65, 1, 'IAL – Oct 2019 – P1 – Q11', ''],
    [181, 2, 10, 65, 2, 'IAL – May 2014 – C12 – Q7', 'i5 ii5']
  ]),
  S('1.13-areas', '1.13', 'Integration: Areas', 'P1.13', 'p1.13.area-between', [
    [183, 2, 10, 66, 1, 'IAL – May 2019 – C12 – Q16', 'a3 b7'],
    [185, 2, 10, 66, 2, 'IAL – May 2015 – C12 – Q14', 'a4 b6'],
    [187, 2, 14, 67, 1, 'IAL – Oct 2017 – C12 – Q15', 'a2 i3 c3 d6'],
    [189, 2, 11, 67, 3, 'IAL – Oct 2018 – C12 – Q10', 'a4 b1 c6']
  ]),
  S('1.14-equations', '1.14', 'Exponentials and Logarithms: Equations', 'P1.14', 'p1.14.log-laws', [
    [191, 1, 7, 69, 1, 'IAL – May 2014 – C12 – Q3', 'a2 b5'],
    [192, 1, 3, 69, 1, 'UK – June 2020 – Paper 1 – Q2', ''],
    [193, 1, 7, 69, 2, 'IAL – Jan 2015 – C12 – Q6', 'a5 b2'],
    [194, 1, 7, 70, 1, 'IAL – Jan 2017 – C12 – Q5', 'a3 i4'],
    [195, 2, 8, 70, 2, 'IAL – May 2016 – C12 – Q13', 'a3 b5'],
    [197, 2, 10, 71, 2, 'IAL – Jan 2018 – C12 – Q10', 'i5 ii5']
  ]),
  S('1.14-modelling', '1.14', 'Exponentials and Logarithms: Modelling', 'P1.14', 'p1.14.exponential-modelling', [
    [199, 2, 9, 72, 2, 'IAL – June 2022 – P2 – Q9', 'a2 b2 c2 d3'],
    [201, 2, 6, 73, 1, 'Madas – MP1 – Paper V – Q1', ''],
    [203, 2, 7, 73, 2, 'IAL – Jan 2021 – P3 – Q8', 'a4 b1 c2']
  ]),
  S('2.1-proof-by-contradiction', '2.1', 'Algebraic Methods: Proof by Contradiction', 'P2.1', 'fx.proof.contradiction', [
    [205, 1, 5, 74, 1, 'IAL – Oct 2023 – P4 – Q4', 'a4 b1'],
    [206, 1, 4, 74, 2, 'IAL – SAM – P4 – Q6', ''],
    [207, 1, 4, 75, 1, 'Booklet label: IAL – June 2022 – P4 – Q8', ''],
    [208, 1, 5, 75, 1, 'Madas – MP2 – Paper S – Q2', ''],
    [209, 2, 4, 75, 3, 'IAL – June 2023 – P4 – Q8', '']
  ]),
  S('2.1-partial-fractions', '2.1', 'Algebraic Methods: Partial Fractions', 'P2.1', 'p2.1.partial-fractions', [
    [211, 1, 7, 77, 1, 'UK – Jan 2006 – C3 – Q2', ''],
    [212, 1, 6, 77, 1, 'UK – June 2006 – C3 – Q1', 'a3 b3'],
    [213, 1, 3, 77, 2, 'IAL – June 2014 – C34 – Q6', ''],
    [214, 1, 4, 78, 1, 'IAL – Jan 2016 – C34 – Q9', ''],
    [215, 1, 4, 78, 1, 'IAL – Jan 2015 – C34 – Q2', 'a4'],
    [216, 1, 4, 78, 2, 'IAL – Jan 2023 – P3 – Q4', ''],
    [217, 2, 4, 79, 2, 'IAL – Jan 2019 – C34 – Q2', 'a4']
  ]),
  S('2.2-basic-functions', '2.2', 'Functions and Graphs: Basic Functions', 'P2.2', 'p2.2.composite-inverse', [
    [219, 2, 10, 80, 1, 'UK – June 2005 – C3 – Q3', 'a4 b3 c3'],
    [221, 2, 10, 80, 2, 'IAL – Jan 2017 – C34 – Q4', 'a2 b3 c1 d4'],
    [223, 2, 6, 81, 1, 'Booklet label: IAL – Jan 2018 – C34 – Q10', 'a2 b4'],
    [225, 2, 8, 81, 3, 'IAL – Jan 2019 – C34 – Q3', 'a4 b4']
  ]),
  S('2.2-modulus-functions', '2.2', 'Functions and Graphs: Modulus Functions', 'P2.2', 'p2.2.modulus', [
    [227, 2, 6, 83, 1, 'UK – Jan 2008 – C3 – Q4', 'a3 b3'],
    [229, 2, 11, 83, 2, 'IAL – Jan 2014 – C34 – Q4', 'a2 b2 c4 d3'],
    [231, 2, 7, 84, 2, 'IAL – Jan 2017 – C34 – Q7', 'a4 i3'],
    [233, 2, 10, 85, 2, 'IAL – Jan 2022 – P3 – Q7', 'a2 b4 c4']
  ]),
  S('2.3-arithmetic', '2.3', 'Sequences and Series: Arithmetic', 'P2.3', 'p2.3.arithmetic', [
    [235, 2, 7, 86, 1, 'IAL – Jan 2015 – C12 – Q5', 'a4 b3'],
    [237, 2, 11, 86, 2, 'IAL – May 2019 – C12 – Q14', 'a6 b2 c3'],
    [239, 2, 8, 87, 1, 'IAL – Oct 2016 – C12 – Q9', 'a1 b2 c3 d2'],
    [241, 2, 8, 87, 2, 'Madas – MP2 – Paper S – Q21', '']
  ]),
  S('2.3-geometric', '2.3', 'Sequences and Series: Geometric', 'P2.3', 'p2.3.geometric', [
    [243, 2, 8, 88, 1, 'IAL – Oct 2020 – P2 – Q8', 'a3 b2 c3'],
    [245, 2, 8, 88, 2, 'IAL – May 2016 – C12 – Q9', 'a4 i4'],
    [247, 2, 10, 89, 1, 'IAL – May 2017 – C12 – Q11', 'a2 b5 c3'],
    [249, 2, 9, 89, 3, 'IAL – June 2023 – P2 – Q6', 'a2 b4 c3']
  ]),
  S('2.3-recurrence-relations', '2.3', 'Sequences and Series: Recurrence Relations', 'P2.3', 'p2.3.recurrence', [
    [251, 2, 5, 91, 1, 'Madas – MP2 – Paper B – Q2', ''],
    [253, 2, 8, 91, 2, 'IAL – May 2015 – C12 – Q10', 'a2 b2 c3 d1'],
    [255, 2, 8, 92, 1, 'IAL – Jan 2024 – P2 – Q5', 'i3 a2 b1 c2'],
    [257, 2, 7, 92, 2, 'IAL – Jan 2021 – P2 – Q8', 'a1 b6']
  ]),
  S('2.4', '2.4', 'Binomial Expansion', 'P2.4', 'p2.4.binomial-rational', [
    [259, 2, 7, 93, 1, 'IAL – Jan 2022 – P4 – Q2', 'a4 b3'],
    [261, 2, 8, 93, 2, 'IAL – Oct 2022 – P4 – Q4', 'a5 b1 c2'],
    [263, 2, 7, 94, 1, 'IAL – Jan 2015 – C34 – Q5', 'a4 b3'],
    [265, 2, 9, 94, 2, 'IAL – Jan 2017 – C34 – Q3', 'a3 b6'],
    [267, 2, 9, 95, 1, 'Booklet label: IAL – Jan 2016 – C34 – Q3', 'a3 b4 c2'],
    [269, 2, 9, 95, 2, 'IAL – June 2023 – P4 – Q1', 'a5 b1 c3']
  ]),
  S('2.5-sectors-and-segments', '2.5', 'Radians: Sectors and Segments', 'P2.5', 'p2.5.arcs-sectors', [
    [271, 2, 9, 96, 1, 'IAL – May 2017 – C12 – Q6', 'a2 b3 c4'],
    [273, 2, 10, 96, 2, 'IAL – May 2018 – C12 – Q10', 'a2 b4 c4'],
    [275, 2, 6, 97, 1, 'IAL – Oct 2017 – C12 – Q8', 'a2 b4'],
    [277, 2, 11, 97, 1, 'IAL – Jan 2016 – C12 – Q11', 'a3 b4 c4'],
    [279, 2, 7, 97, 2, 'IAL – Jan 2022 – P1 – Q5', 'a1 b3 c3'],
    [281, 2, 10, 98, 2, 'IAL – Jan 2023 – P1 – Q6', 'a2 b1 c3 d4']
  ]),
  S('2.5-trigonometric-equations', '2.5', 'Radians: Trigonometric Equations', 'P2.5', 'p2.5.equations', [
    [283, 1, 3, 99, 1, 'IAL – Specimen 2018 – P2 – Q9', ''],
    [284, 1, 4, 99, 1, 'IAL – Jan 2023 – P2 – Q8', ''],
    [285, 1, 4, 99, 1, 'IAL – Jan 2022 – P2 – Q7', ''],
    [286, 1, 5, 99, 2, 'IAL – Oct 2021 – P2 – Q10', '']
  ]),
  S('2.5-small-angle-approximations', '2.5', 'Radians: Small Angle Approximations', 'P2.5', 'p2.5.small-angles', [
    [287, 1, 5, 100, 1, 'OCR A – Nov 2020 – Paper 1 – Q1', 'a3 b2'],
    [288, 1, 4, 100, 1, 'OCR A – Sample Paper 3 – Q4', ''],
    [289, 1, 5, 100, 2, 'Madas – MP2 – Paper D – Q2', ''],
    [290, 1, 7, 101, 2, 'Madas – MP2 – Paper U – Q1', '']
  ]),
  S('2.6', '2.6', 'Trigonometric Functions', 'P2.6', 'p2.6.reciprocal-functions', [
    [291, 1, 2, 102, 1, 'UK – June 2007 – C3 – Q7', ''],
    [292, 1, 2, 102, 2, 'IAL – Jan 2019 – C34 – Q11', ''],
    [293, 1, 5, 103, 1, 'IAL – June 2016 – C34 – Q10', 'a2 b3'],
    [294, 1, 3, 103, 1, 'UK – Jan 2007 – C3 – Q8', ''],
    [295, 2, 6, 103, 2, 'IAL – Jan 2016 – C34 – Q2', 'a1 b5'],
    [297, 2, 8, 104, 1, 'UK – June 2008 – C3 – Q5', 'a2 b6'],
    [299, 2, 8, 104, 1, 'UK – June 2009 – C3 – Q2', 'a2 b6'],
    [301, 2, 10, 104, 3, 'Booklet label: IAL – May 2019 – C12 – Q2', 'a2 b2 c6']
  ]),
  S('2.7-equations', '2.7', 'Trigonometry and Modelling: Equations', 'P2.7', 'p2.7.double-angle', [
    [303, 2, 9, 106, 1, 'IAL – Jan 2018 – C34 – Q9', 'a3 b6'],
    [305, 2, 9, 106, 2, 'IAL – Jan 2017 – C34 – Q8', 'a4 b5'],
    [307, 2, 9, 107, 1, 'IAL – Jan 2021 – P3 – Q7', 'a3 b6'],
    [309, 2, 8, 107, 2, 'IAL – Jan 2022 – P3 – Q9', 'i4 ii4']
  ]),
  S('2.7-modelling', '2.7', 'Trigonometry and Modelling: Modelling', 'P2.7', 'p2.7.modelling', [
    [311, 2, 12, 108, 1, 'IAL – Jan 2016 – C34 – Q10', 'a3 b5 c4'],
    [313, 2, 11, 108, 2, 'IAL – Jan 2017 – C34 – Q11', 'a3 b4 c4'],
    [315, 2, 13, 109, 1, 'IAL – Jan 2015 – C34 – Q13', 'a3 b4 i4 d2'],
    [317, 2, 12, 109, 2, 'IAL – Jan 2018 – C34 – Q12', 'a3 b3 c6']
  ]),
  S('2.8', '2.8', 'Parametric Equations', 'P2.8', 'p2.8.cartesian-form', [
    [319, 1, 4, 110, 1, 'IAL – June 2018 – C34 – Q2', ''],
    [320, 1, 4, 110, 1, 'IAL – Jan 2016 – C34 – Q13', 'c3 d1'],
    [321, 1, 4, 110, 2, 'Booklet label: IAL – Jan 2022 – P4 – Q2', 'a1 b3'],
    [322, 1, 6, 111, 1, 'IAL – Jan 2023 – P4 – Q2', 'a4 b2'],
    [323, 2, 5, 111, 2, 'Booklet label: IAL – May 2016 – C12 – Q3', 'a3 b2'],
    [325, 2, 6, 112, 2, 'IAL – Jan 2017 – C34 – Q13', 'a3 d3']
  ]),
  S('2.9-chain-product-and-quotient-rules', '2.9', 'Differentiation: Chain, Product and Quotient Rules', 'P2.9', 'p2.9.product-quotient', [
    [327, 2, 6, 113, 1, 'IAL – Jan 2017 – C34 – Q6', 'i2 ii4'],
    [329, 1, 6, 113, 1, 'IAL – Jan 2014 – C34 – Q1', ''],
    [330, 1, 4, 113, 2, 'IAL – Jan 2018 – C34 – Q8', ''],
    [331, 2, 7, 114, 1, 'Booklet label: IAL – Jan 2015 – C34 – Q3', 'a5 b2'],
    [333, 2, 9, 114, 2, 'UK – June 2012 – C3 – Q3', 'a6 b3']
  ]),
  S('2.9-parametric', '2.9', 'Differentiation: Parametric', 'P2.9', 'p2.9.parametric-implicit', [
    [335, 2, 13, 115, 1, 'IAL – Jan 2019 – C34 – Q8', 'a4 b4 c5'],
    [337, 2, 13, 115, 2, 'Booklet label: IAL – Jan 2015 – C34 – Q9', 'a3 b5 c5'],
    [339, 2, 10, 116, 1, 'IAL – Jan 2016 – C34 – Q13', 'a4 b6'],
    [341, 2, 9, 116, 2, 'IAL – Jan 2017 – C34 – Q13', 'a3 b4 c2']
  ]),
  S('2.9-implicit', '2.9', 'Differentiation: Implicit', 'P2.9', 'p2.9.parametric-implicit', [
    [343, 2, 11, 117, 1, 'IAL – Jan 2019 – C34 – Q4', 'a5 b6'],
    [345, 2, 9, 117, 2, 'IAL – June 2015 – C34 – Q1', 'a6 b3'],
    [347, 2, 9, 118, 1, 'IAL – Jan 2014 – C34 – Q5', 'a3 b6'],
    [349, 2, 6, 118, 2, 'Booklet label: IAL – Jan 2015 – C34 – Q2', '']
  ]),
  S('2.9-rates-of-change-and-modelling', '2.9', 'Differentiation: Rates of Change and Modelling', 'P2.9', 'p2.9.connected-rates', [
    [351, 2, 7, 119, 1, 'IAL – June 2021 – P4 – Q3', 'a2 b5'],
    [353, 2, 8, 119, 1, 'IAL – June 2022 – P4 – Q3', 'a4 b4'],
    [355, 2, 10, 119, 2, 'IAL – Jan 2017 – C34 – Q10', 'a1 b2 c4 d3'],
    [357, 2, 10, 120, 2, 'IAL – Jan 2019 – C34 – Q13', 'a2 b3 c5']
  ]),
  S('2.10-iteration', '2.10', 'Numerical Methods: Iteration', 'P2.10', 'p2.10.iteration', [
    [359, 2, 9, 121, 1, 'IAL – Jan 2016 – C34 – Q4', 'a2 b2 c3 d2'],
    [361, 2, 9, 121, 2, 'UK – June 2012 – C3 – Q2', 'a3 b3 c3'],
    [363, 2, 7, 122, 1, 'IAL – Jan 2018 – C34 – Q3', 'a2 b3 c2'],
    [365, 2, 11, 122, 2, 'UK – June 2006 – C3 – Q5', 'a6 b3 c2']
  ]),
  S('2.10-newton-raphson', '2.10', 'Numerical Methods: Newton–Raphson', 'P2.10', 'p2.10.newton-raphson', [
    [367, 2, 7, 123, 1, 'Madas – MP2 – Paper O – Q9', ''],
    [369, 2, 9, 123, 2, 'Madas – SYN – Paper L – Q5', 'a2 b7'],
    [371, 2, 10, 124, 1, 'Booklet label: Madas – SYN – Paper L – Q5', 'a5 b5'],
    [373, 2, 8, 124, 3, 'Madas – MP2 – Paper U – Q9', 'a2 b5 c1']
  ]),
  S('2.11-substitution', '2.11', 'Integration: Substitution', 'P2.11', 'p2.11.substitution', [
    [375, 2, 7, 126, 1, 'IAL – Jan 2017 – C34 – Q9', ''],
    [377, 2, 7, 126, 1, 'IAL – Jan 2019 – C34 – Q7', ''],
    [379, 2, 7, 126, 2, 'IAL – Jan 2015 – C34 – Q4', ''],
    [381, 2, 7, 127, 2, 'IAL – Nov 2018 – C34 – Q8', 'a3 b4']
  ]),
  S('2.11-by-parts', '2.11', 'Integration: By Parts', 'P2.11', 'p2.11.parts', [
    [383, 2, 6, 128, 1, 'UK – June 2008 – C4 – Q2', 'a3 b3'],
    [385, 2, 4, 128, 1, 'UK – Jan 2009 – C4 – Q6', ''],
    [387, 2, 9, 128, 2, 'IAL – Jan 2016 – C34 – Q8', 'a3 b6'],
    [389, 2, 5, 129, 2, 'IAL – Jan 2017 – C34 – Q5', '']
  ]),
  S('2.11-partial-fractions', '2.11', 'Integration: Partial Fractions', 'P2.11', 'p2.11.partial-fractions', [
    [391, 2, 7, 130, 2, 'IAL – Oct 2022 – P4 – Q2', 'a3 b4'],
    [393, 2, 7, 131, 1, 'IAL – Jan 2018 – C34 – Q5', 'a3 b4'],
    [395, 2, 9, 131, 2, 'Booklet label: IAL – Jan 2022 – P4 – Q4', 'a4 b3 c2'],
    [397, 2, 8, 132, 2, 'Booklet label: IAL – Jan 2017 – C34 – Q8', '']
  ]),
  S('2.11-parametric', '2.11', 'Integration: Parametric', 'P2.11', 'p2.11.definite-integrals', [
    [399, 2, null, 133, 1, 'IAL – June 2016 – C34 – Q12', ''],
    [401, 2, null, 133, 2, 'IAL – Jan 2021 – P4 – Q9', ''],
    [403, 2, null, 134, 1, 'IAL – Jan 2022 (Unused) – P4 – Q9', ''],
    [405, 2, 12, 134, 3, 'UK – Jan 2006 – C4 – Q8', 'a2 b3 a7']
  ]),
  S('2.11-trapezium-rule', '2.11', 'Integration: Trapezium Rule', 'P2.11', 'p2.11.trapezium', [
    [407, 2, 5, 136, 1, 'IAL – May 2018 – C12 – Q1', 'a1 b4'],
    [409, 2, 7, 136, 2, 'IAL – Jan 2015 – C12 – Q2', 'a4 b3'],
    [411, 2, 7, 137, 2, 'IAL – Jan 2020 – P2 – Q1', 'a3 b4'],
    [413, 2, 6, 138, 2, 'IAL – Jan 2024 – P2 – Q4', 'a3 c3']
  ]),
  S('2.11-differential-equations', '2.11', 'Integration: Differential Equations', 'P2.11', 'p2.11.differential-equations', [
    [415, 2, 7, 139, 1, 'IAL – June 2019 – C34 – Q2', 'a2 b5'],
    [417, 2, 9, 139, 2, 'IAL – Oct 2020 – P4 – Q9', 'a7 b2'],
    [419, 2, 13, 140, 2, 'IAL – Nov 2018 – C34 – Q13', 'a1 b3 c6 d3'],
    [421, 2, 10, 141, 3, 'IAL – Jan 2019 – C34 – Q10', 'a5 b3 c2']
  ]),
  S('2.12', '2.12', 'Vectors', 'P2.12', 'p2.12.geometry', [
    [423, 2, 3, 143, 1, 'IAL – June 2021 – P4 – Q9', ''],
    [425, 2, 11, 143, 2, 'IAL – Jan 2017 – C34 – Q14', 'a3 b4 c2 d2'],
    [427, 2, 7, 144, 2, 'UK – Jan 2007 – C4 – Q7', 'a1 b6'],
    [429, 2, 11, 145, 2, 'IAL – June 2019 – C34 – Q12', 'a2 c4 d2 e3']
  ]),
];

export const BOOKLET_SECTION = new Map(BOOKLET.map((s) => [s.id, s]));
export const BOOKLET_QUESTION = new Map(BOOKLET.flatMap((s) => s.questions.map((q) => [q.id, q] as const)));
