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
}

export interface BookletSection {
  id: string;
  /** chapter in the textbook, e.g. '1.12' */
  ref: string;
  title: string;
  year: 1 | 2;
  /** the matching chapter in this app, for practice */
  chapter: string;
  questions: BookletQuestion[];
}

export const BOOKLET_PAGES = 430;
export const SOLUTIONS_PAGES = 146;

type Row = [page: number, pages: number, marks: number | null, solPage: number, solPages: number, source: string];
const S = (id: string, ref: string, title: string, chapter: string, rows: Row[]): BookletSection => ({
  id,
  ref,
  title,
  year: ref.startsWith('1.') ? 1 : 2,
  chapter,
  questions: rows.map(([page, pages, marks, solPage, solPages, source], i) => ({ id: `${id}:${i + 1}`, section: id, n: i + 1, page, pages, marks, solPage, solPages, source })),
});

export const BOOKLET: BookletSection[] = [
  S('1.1', '1.1', 'Algebraic Expressions', 'P1.1', [
    [5, 1, 6, 4, 1, 'UK – Jan 2010 – C1 – Q2'],
    [6, 1, 4, 4, 2, 'IAL – May 2017 – C12 – Q2'],
    [7, 1, 4, 5, 1, 'IAL – Oct 2023 – P1 – Q2'],
    [8, 1, 6, 5, 1, 'IAL – May 2019 – C12 – Q2'],
    [9, 1, 7, 5, 2, 'IAL – May 2016 – C12 – Q3'],
    [10, 1, 4, 6, 1, 'IAL – May 2014 – C12 – Q2'],
    [11, 1, 7, 6, 2, 'IAL – Jan 2022 – P1 – Q3'],
    [12, 1, 5, 7, 2, 'Madas – MP1 – Paper A – Q11']
  ]),
  S('1.2-equations', '1.2', 'Quadratics: Equations', 'P1.2', [
    [13, 1, 5, 8, 1, 'Madas – MP1 – Paper W – Q3'],
    [14, 1, 6, 8, 2, 'IAL – Jan 2022 – P1 – Q2'],
    [15, 1, 6, 9, 1, 'UK – May 2011 – C1 – Q7'],
    [16, 1, 8, 9, 2, 'Madas – MP1 – Paper V – Q4'],
    [17, 1, 8, 10, 1, 'Madas – MP1 – Paper H – Q5'],
    [18, 1, 5, 10, 1, 'IAL – Oct 2019 – P1 – Q8'],
    [19, 1, 6, 10, 2, 'IAL – Jan 2023 – P1 – Q5'],
    [20, 1, 7, 11, 2, 'IAL – May 2019 – P1 – Q5']
  ]),
  S('1.2-modelling', '1.2', 'Quadratics: Modelling', 'P1.2', [
    [21, 2, 7, 12, 2, 'UK – June 2018 – Paper 2 – Q8'],
    [23, 2, 8, 13, 2, 'IAL – June 2021 – P1 – Q5']
  ]),
  S('1.3', '1.3', 'Equations and Inequalities', 'P1.3', [
    [25, 1, 6, 14, 1, 'IAL – May 2016 – C12 – Q2'],
    [26, 1, 7, 14, 1, 'IAL – Oct 2018 – C12 – Q2'],
    [27, 2, 7, 14, 2, 'IAL – June 2022 – P1 – Q6'],
    [29, 1, 7, 15, 1, 'IAL – May 2015 – C12 – Q9'],
    [30, 1, 6, 15, 2, 'IAL – Oct 2023 – P1 – Q6'],
    [31, 2, 7, 16, 1, 'IAL – May 2019 – C12 – Q11'],
    [33, 2, 7, 16, 2, 'IAL – Jan 2022 – P1 – Q4'],
    [35, 2, 6, 17, 2, 'IAL – June 2023 – P1 – Q7']
  ]),
  S('1.4', '1.4', 'Graphs and Transformations', 'P1.4', [
    [37, 1, 4, 18, 1, 'IAL – Oct 2017 – C12 – Q2'],
    [38, 1, 5, 18, 2, 'UK – May 2013 – C1 – Q9'],
    [39, 2, 9, 19, 2, 'IAL – May 2015 – C12 – Q12'],
    [41, 2, 6, 20, 2, 'IAL – Jan 2015 – C12 – Q3'],
    [43, 2, 4, 21, 1, 'IAL – May 2017 – C12 – Q7'],
    [45, 2, 10, 21, 2, 'IAL – Jan 2023 – P1 – Q7'],
    [47, 2, 11, 22, 2, 'IAL – Jan 2017 – C12 – Q13'],
    [49, 2, 9, 23, 2, 'IAL – Jan 2022 – P1 – Q10']
  ]),
  S('1.5', '1.5', 'Straight Line Graphs', 'P1.5', [
    [51, 1, 4, 24, 1, 'Booklet label: UK – Jan 2010 – C1 – Q2'],
    [52, 1, 6, 24, 2, 'IAL – May 2018 – C12 – Q3'],
    [53, 2, 9, 25, 1, 'IAL – Oct 2017 – C12 – Q10'],
    [55, 1, 8, 25, 2, 'IAL – Oct 2018 – C12 – Q7'],
    [56, 1, 5, 26, 1, 'IAL – Oct 2019 – P1 – Q2'],
    [57, 2, 11, 26, 1, 'IAL – Jan 2017 – C12 – Q6'],
    [59, 2, 9, 26, 2, 'IAL – Jan 2018 – C12 – Q12'],
    [61, 2, 9, 27, 2, 'IAL – Jan 2022 – P1 – Q8']
  ]),
  S('1.6', '1.6', 'Circles', 'P1.6', [
    [63, 2, 8, 28, 1, 'UK – May 2011 – C2 – Q4'],
    [65, 2, 9, 28, 2, 'IAL – May 2019 – C12 – Q10'],
    [67, 2, 9, 29, 1, 'IAL – Oct 2017 – C12 – Q13'],
    [69, 2, 11, 29, 2, 'IAL – Oct 2018 – C12 – Q14'],
    [71, 2, 10, 30, 2, 'IAL – May 2018 – C12 – Q13'],
    [73, 2, 14, 31, 1, 'IAL – Jan 2014 – C12 – Q15'],
    [75, 2, 12, 31, 2, 'IAL – June 2022 – P2 – Q10'],
    [77, 2, 13, 32, 3, 'Madas – MP1 – Paper L – Q14']
  ]),
  S('1.7-factor-theorem', '1.7', 'Algebraic Methods: Factor Theorem', 'P1.7', [
    [79, 1, 6, 34, 1, 'IAL – Oct 2017 – C12 – Q7'],
    [80, 1, 7, 34, 2, 'IAL – Jan 2016 – C12 – Q6'],
    [81, 1, 6, 35, 1, 'IAL – June 2023 – P2 – Q2'],
    [82, 1, 6, 35, 1, 'IAL – Jan 2019 – C12 – Q13'],
    [83, 2, 10, 35, 2, 'IAL – May 2017 – C12 – Q5'],
    [85, 2, 8, 36, 2, 'IAL – Oct 2019 – P2 – Q4']
  ]),
  S('1.7-proof', '1.7', 'Algebraic Methods: Proof', 'P1.7', [
    [87, 1, 4, 37, 1, 'IAL – Jan 2023 – P2 – Q10'],
    [88, 1, 5, 37, 2, 'IAL – Jan 2022 – P2 – Q10'],
    [89, 1, 4, 38, 1, 'IAL – Jan 2021 – P2 – Q5'],
    [90, 1, 4, 38, 1, 'IAL – Oct 2021 – P2 – Q9'],
    [91, 1, 6, 38, 2, 'IAL – June 2024 – P2 – Q5'],
    [92, 1, 5, 39, 1, 'Madas – MP1 – Paper C – Q7'],
    [93, 2, 6, 39, 2, 'Madas – MP1 – Paper T – Q2']
  ]),
  S('1.8', '1.8', 'Binomial Expansion', 'P1.8', [
    [95, 1, 7, 40, 1, 'IAL – Jan 2015 – C12 – Q4'],
    [96, 1, 7, 40, 1, 'IAL – May 2018 – C12 – Q5'],
    [97, 2, 6, 40, 2, 'IAL – Oct 2018 – C12 – Q5'],
    [99, 2, 8, 41, 1, 'IAL – May 2019 – C12 – Q6'],
    [101, 2, 7, 41, 1, 'IAL – Oct 2016 – C12 – Q5'],
    [103, 2, 8, 41, 2, 'IAL – May 2017 – C12 – Q10'],
    [105, 2, 7, 42, 1, 'IAL – Jan 2020 – P2 – Q10'],
    [107, 2, 7, 42, 2, 'IAL – May 2014 – C12 – Q8'],
    [109, 2, 10, 43, 2, 'IAL – Jan 2018 – C12 – Q15']
  ]),
  S('1.9', '1.9', 'Trigonometric Ratios', 'P1.9', [
    [111, 2, 6, 44, 1, 'IAL – May 2014 – C12 – Q1'],
    [113, 2, 7, 44, 2, 'IAL – Jan 2018 – C12 – Q13'],
    [115, 1, 6, 45, 1, 'IAL – Oct 2017 – C12 – Q4'],
    [116, 1, 5, 45, 1, 'IAL – Jan 2024 – P1 – Q2'],
    [117, 2, 9, 45, 2, 'IAL – June 2021 – P1 – Q3'],
    [119, 2, 4, 46, 1, 'IAL – Jan 2022 – P1 – Q9'],
    [121, 2, 8, 46, 3, 'IAL – June 2022 – P1 – Q9']
  ]),
  S('1.10', '1.10', 'Trigonometric Identities and Equations', 'P1.10', [
    [123, 2, 7, 48, 1, 'IAL – May 2016 – C12 – Q8'],
    [125, 2, 7, 48, 2, 'IAL – Oct 2020 – P2 – Q7'],
    [127, 2, 9, 49, 1, 'IAL – May 2015 – C12 – Q13'],
    [129, 2, 10, 49, 2, 'IAL – May 2017 – C12 – Q13'],
    [131, 2, 8, 50, 1, 'IAL – Oct 2016 – C12 – Q10'],
    [133, 2, 6, 50, 1, 'IAL – June 2022 – P2 – Q5'],
    [135, 2, 8, 50, 2, 'Booklet label: IAL – May 2014 – C12 – Q2'],
    [137, 2, 7, 51, 2, 'IAL – June 2023 – P2 – Q9']
  ]),
  S('1.11', '1.11', 'Vectors', 'P1.11', [
    [139, 2, 7, 52, 1, 'Madas – MP1 – Paper J – Q2'],
    [141, 2, 9, 52, 2, 'Madas – MP1 – Paper K – Q5'],
    [143, 2, 6, 53, 1, 'Madas – MP1 – Paper M – Q12'],
    [145, 2, 5, 53, 1, 'UK – AS – Oct 2021 – Q4'],
    [147, 2, 7, 53, 2, 'UK – AS – Oct 2023 – Q13'],
    [149, 2, 8, 54, 1, 'Madas – MP1 – Paper O – Q5'],
    [151, 2, 10, 54, 2, 'Madas – MP1 – Paper P – Q1'],
    [153, 2, 9, 55, 2, 'Madas – MP1 – Paper E – Q8']
  ]),
  S('1.12-tangents-and-normals', '1.12', 'Differentiation: Tangents and Normals', 'P1.12', [
    [155, 1, 5, 56, 1, 'IAL – May 2017 – C12 – Q4'],
    [156, 1, 7, 56, 1, 'IAL – Jan 2024 – P1 – Q3'],
    [157, 2, 10, 56, 2, 'IAL – Jan 2016 – C12 – Q12'],
    [159, 2, 5, 57, 1, 'IAL – Oct 2017 – C12 – Q16'],
    [161, 2, 12, 57, 3, 'Booklet label: IAL – June 2023 – P1 – Q10']
  ]),
  S('1.12-stationary-points', '1.12', 'Differentiation: Stationary Points', 'P1.12', [
    [163, 2, 10, 59, 1, 'IAL – Jan 2016 – C12 – Q10'],
    [165, 2, 9, 59, 2, 'IAL – Jan 2014 – C12 – Q13'],
    [167, 2, 10, 60, 1, 'IAL – Oct 2016 – C12 – Q12'],
    [169, 2, 10, 60, 3, 'IAL – Jan 2020 – P2 – Q4']
  ]),
  S('1.12-modelling', '1.12', 'Differentiation: Modelling', 'P1.12', [
    [171, 2, 11, 62, 1, 'IAL – May 2019 – C12 – Q15'],
    [173, 2, 13, 62, 3, 'IAL – May 2015 – C12 – Q16']
  ]),
  S('1.13-basic-integrals', '1.13', 'Integration: Basic Integrals', 'P1.13', [
    [175, 2, 7, 64, 1, 'IAL – May 2016 – C12 – Q6'],
    [177, 2, 9, 64, 2, 'IAL – Jan 2017 – C12 – Q7'],
    [179, 2, 8, 65, 1, 'IAL – Oct 2019 – P1 – Q11'],
    [181, 2, 10, 65, 2, 'IAL – May 2014 – C12 – Q7']
  ]),
  S('1.13-areas', '1.13', 'Integration: Areas', 'P1.13', [
    [183, 2, 10, 66, 1, 'IAL – May 2019 – C12 – Q16'],
    [185, 2, 10, 66, 2, 'IAL – May 2015 – C12 – Q14'],
    [187, 2, 14, 67, 1, 'IAL – Oct 2017 – C12 – Q15'],
    [189, 2, 11, 67, 3, 'IAL – Oct 2018 – C12 – Q10']
  ]),
  S('1.14-equations', '1.14', 'Exponentials and Logarithms: Equations', 'P1.14', [
    [191, 1, 7, 69, 1, 'IAL – May 2014 – C12 – Q3'],
    [192, 1, 3, 69, 1, 'UK – June 2020 – Paper 1 – Q2'],
    [193, 1, 7, 69, 2, 'IAL – Jan 2015 – C12 – Q6'],
    [194, 1, 7, 70, 1, 'IAL – Jan 2017 – C12 – Q5'],
    [195, 2, 8, 70, 2, 'IAL – May 2016 – C12 – Q13'],
    [197, 2, 10, 71, 2, 'IAL – Jan 2018 – C12 – Q10']
  ]),
  S('1.14-modelling', '1.14', 'Exponentials and Logarithms: Modelling', 'P1.14', [
    [199, 2, 9, 72, 2, 'IAL – June 2022 – P2 – Q9'],
    [201, 2, 6, 73, 1, 'Madas – MP1 – Paper V – Q1'],
    [203, 2, 7, 73, 2, 'IAL – Jan 2021 – P3 – Q8']
  ]),
  S('2.1-proof-by-contradiction', '2.1', 'Algebraic Methods: Proof by Contradiction', 'P2.1', [
    [205, 1, 5, 74, 1, 'IAL – Oct 2023 – P4 – Q4'],
    [206, 1, 4, 74, 2, 'IAL – SAM – P4 – Q6'],
    [207, 1, 4, 75, 1, 'Booklet label: IAL – June 2022 – P4 – Q8'],
    [208, 1, 5, 75, 1, 'Madas – MP2 – Paper S – Q2'],
    [209, 2, 4, 75, 3, 'IAL – June 2023 – P4 – Q8']
  ]),
  S('2.1-partial-fractions', '2.1', 'Algebraic Methods: Partial Fractions', 'P2.1', [
    [211, 1, 7, 77, 1, 'UK – Jan 2006 – C3 – Q2'],
    [212, 1, 6, 77, 1, 'UK – June 2006 – C3 – Q1'],
    [213, 1, 3, 77, 2, 'IAL – June 2014 – C34 – Q6'],
    [214, 1, 4, 78, 1, 'IAL – Jan 2016 – C34 – Q9'],
    [215, 1, 4, 78, 1, 'IAL – Jan 2015 – C34 – Q2'],
    [216, 1, 4, 78, 2, 'IAL – Jan 2023 – P3 – Q4'],
    [217, 2, 4, 79, 2, 'IAL – Jan 2019 – C34 – Q2']
  ]),
  S('2.2-basic-functions', '2.2', 'Functions and Graphs: Basic Functions', 'P2.2', [
    [219, 2, 10, 80, 1, 'UK – June 2005 – C3 – Q3'],
    [221, 2, 10, 80, 2, 'IAL – Jan 2017 – C34 – Q4'],
    [223, 2, 6, 81, 1, 'Booklet label: IAL – Jan 2018 – C34 – Q10'],
    [225, 2, 8, 81, 3, 'IAL – Jan 2019 – C34 – Q3']
  ]),
  S('2.2-modulus-functions', '2.2', 'Functions and Graphs: Modulus Functions', 'P2.2', [
    [227, 2, 6, 83, 1, 'UK – Jan 2008 – C3 – Q4'],
    [229, 2, 11, 83, 2, 'IAL – Jan 2014 – C34 – Q4'],
    [231, 2, 7, 84, 2, 'IAL – Jan 2017 – C34 – Q7'],
    [233, 2, 10, 85, 2, 'IAL – Jan 2022 – P3 – Q7']
  ]),
  S('2.3-arithmetic', '2.3', 'Sequences and Series: Arithmetic', 'P2.3', [
    [235, 2, 7, 86, 1, 'IAL – Jan 2015 – C12 – Q5'],
    [237, 2, 11, 86, 2, 'IAL – May 2019 – C12 – Q14'],
    [239, 2, 8, 87, 1, 'IAL – Oct 2016 – C12 – Q9'],
    [241, 2, 8, 87, 2, 'Madas – MP2 – Paper S – Q21']
  ]),
  S('2.3-geometric', '2.3', 'Sequences and Series: Geometric', 'P2.3', [
    [243, 2, 8, 88, 1, 'IAL – Oct 2020 – P2 – Q8'],
    [245, 2, 8, 88, 2, 'IAL – May 2016 – C12 – Q9'],
    [247, 2, 10, 89, 1, 'IAL – May 2017 – C12 – Q11'],
    [249, 2, 9, 89, 3, 'IAL – June 2023 – P2 – Q6']
  ]),
  S('2.3-recurrence-relations', '2.3', 'Sequences and Series: Recurrence Relations', 'P2.3', [
    [251, 2, 5, 91, 1, 'Madas – MP2 – Paper B – Q2'],
    [253, 2, 8, 91, 2, 'IAL – May 2015 – C12 – Q10'],
    [255, 2, 8, 92, 1, 'IAL – Jan 2024 – P2 – Q5'],
    [257, 2, 7, 92, 2, 'IAL – Jan 2021 – P2 – Q8']
  ]),
  S('2.4', '2.4', 'Binomial Expansion', 'P2.4', [
    [259, 2, 7, 93, 1, 'IAL – Jan 2022 – P4 – Q2'],
    [261, 2, 8, 93, 2, 'IAL – Oct 2022 – P4 – Q4'],
    [263, 2, 7, 94, 1, 'IAL – Jan 2015 – C34 – Q5'],
    [265, 2, 9, 94, 2, 'IAL – Jan 2017 – C34 – Q3'],
    [267, 2, 9, 95, 1, 'Booklet label: IAL – Jan 2016 – C34 – Q3'],
    [269, 2, 9, 95, 2, 'IAL – June 2023 – P4 – Q1']
  ]),
  S('2.5-sectors-and-segments', '2.5', 'Radians: Sectors and Segments', 'P2.5', [
    [271, 2, 9, 96, 1, 'IAL – May 2017 – C12 – Q6'],
    [273, 2, 10, 96, 2, 'IAL – May 2018 – C12 – Q10'],
    [275, 2, 6, 97, 1, 'IAL – Oct 2017 – C12 – Q8'],
    [277, 2, 11, 97, 1, 'IAL – Jan 2016 – C12 – Q11'],
    [279, 2, 7, 97, 2, 'IAL – Jan 2022 – P1 – Q5'],
    [281, 2, 10, 98, 2, 'IAL – Jan 2023 – P1 – Q6']
  ]),
  S('2.5-trigonometric-equations', '2.5', 'Radians: Trigonometric Equations', 'P2.5', [
    [283, 1, 3, 99, 1, 'IAL – Specimen 2018 – P2 – Q9'],
    [284, 1, 4, 99, 1, 'IAL – Jan 2023 – P2 – Q8'],
    [285, 1, 4, 99, 1, 'IAL – Jan 2022 – P2 – Q7'],
    [286, 1, 5, 99, 2, 'IAL – Oct 2021 – P2 – Q10']
  ]),
  S('2.5-small-angle-approximations', '2.5', 'Radians: Small Angle Approximations', 'P2.5', [
    [287, 1, 5, 100, 1, 'OCR A – Nov 2020 – Paper 1 – Q1'],
    [288, 1, 4, 100, 1, 'OCR A – Sample Paper 3 – Q4'],
    [289, 1, 5, 100, 2, 'Madas – MP2 – Paper D – Q2'],
    [290, 1, 7, 101, 2, 'Madas – MP2 – Paper U – Q1']
  ]),
  S('2.6', '2.6', 'Trigonometric Functions', 'P2.6', [
    [291, 1, 2, 102, 1, 'UK – June 2007 – C3 – Q7'],
    [292, 1, 2, 102, 2, 'IAL – Jan 2019 – C34 – Q11'],
    [293, 1, 5, 103, 1, 'IAL – June 2016 – C34 – Q10'],
    [294, 1, 3, 103, 1, 'UK – Jan 2007 – C3 – Q8'],
    [295, 2, 6, 103, 2, 'IAL – Jan 2016 – C34 – Q2'],
    [297, 2, 8, 104, 1, 'UK – June 2008 – C3 – Q5'],
    [299, 2, 8, 104, 1, 'UK – June 2009 – C3 – Q2'],
    [301, 2, 10, 104, 3, 'Booklet label: IAL – May 2019 – C12 – Q2']
  ]),
  S('2.7-equations', '2.7', 'Trigonometry and Modelling: Equations', 'P2.7', [
    [303, 2, 9, 106, 1, 'IAL – Jan 2018 – C34 – Q9'],
    [305, 2, 9, 106, 2, 'IAL – Jan 2017 – C34 – Q8'],
    [307, 2, 9, 107, 1, 'IAL – Jan 2021 – P3 – Q7'],
    [309, 2, 8, 107, 2, 'IAL – Jan 2022 – P3 – Q9']
  ]),
  S('2.7-modelling', '2.7', 'Trigonometry and Modelling: Modelling', 'P2.7', [
    [311, 2, 12, 108, 1, 'IAL – Jan 2016 – C34 – Q10'],
    [313, 2, 11, 108, 2, 'IAL – Jan 2017 – C34 – Q11'],
    [315, 2, 13, 109, 1, 'IAL – Jan 2015 – C34 – Q13'],
    [317, 2, 12, 109, 2, 'IAL – Jan 2018 – C34 – Q12']
  ]),
  S('2.8', '2.8', 'Parametric Equations', 'P2.8', [
    [319, 1, 4, 110, 1, 'IAL – June 2018 – C34 – Q2'],
    [320, 1, 4, 110, 1, 'IAL – Jan 2016 – C34 – Q13'],
    [321, 1, 4, 110, 2, 'Booklet label: IAL – Jan 2022 – P4 – Q2'],
    [322, 1, 6, 111, 1, 'IAL – Jan 2023 – P4 – Q2'],
    [323, 2, 5, 111, 2, 'Booklet label: IAL – May 2016 – C12 – Q3'],
    [325, 2, 6, 112, 2, 'IAL – Jan 2017 – C34 – Q13']
  ]),
  S('2.9-chain-product-and-quotient-rules', '2.9', 'Differentiation: Chain, Product and Quotient Rules', 'P2.9', [
    [327, 2, 6, 113, 1, 'IAL – Jan 2017 – C34 – Q6'],
    [329, 1, 6, 113, 1, 'IAL – Jan 2014 – C34 – Q1'],
    [330, 1, 4, 113, 2, 'IAL – Jan 2018 – C34 – Q8'],
    [331, 2, 7, 114, 1, 'Booklet label: IAL – Jan 2015 – C34 – Q3'],
    [333, 2, 9, 114, 2, 'UK – June 2012 – C3 – Q3']
  ]),
  S('2.9-parametric', '2.9', 'Differentiation: Parametric', 'P2.9', [
    [335, 2, 13, 115, 1, 'IAL – Jan 2019 – C34 – Q8'],
    [337, 2, 13, 115, 2, 'Booklet label: IAL – Jan 2015 – C34 – Q9'],
    [339, 2, 10, 116, 1, 'IAL – Jan 2016 – C34 – Q13'],
    [341, 2, 9, 116, 2, 'IAL – Jan 2017 – C34 – Q13']
  ]),
  S('2.9-implicit', '2.9', 'Differentiation: Implicit', 'P2.9', [
    [343, 2, 11, 117, 1, 'IAL – Jan 2019 – C34 – Q4'],
    [345, 2, 9, 117, 2, 'IAL – June 2015 – C34 – Q1'],
    [347, 2, 9, 118, 1, 'IAL – Jan 2014 – C34 – Q5'],
    [349, 2, 6, 118, 2, 'Booklet label: IAL – Jan 2015 – C34 – Q2']
  ]),
  S('2.9-rates-of-change-and-modelling', '2.9', 'Differentiation: Rates of Change and Modelling', 'P2.9', [
    [351, 2, 7, 119, 1, 'IAL – June 2021 – P4 – Q3'],
    [353, 2, 8, 119, 1, 'IAL – June 2022 – P4 – Q3'],
    [355, 2, 10, 119, 2, 'IAL – Jan 2017 – C34 – Q10'],
    [357, 2, 10, 120, 2, 'IAL – Jan 2019 – C34 – Q13']
  ]),
  S('2.10-iteration', '2.10', 'Numerical Methods: Iteration', 'P2.10', [
    [359, 2, 9, 121, 1, 'IAL – Jan 2016 – C34 – Q4'],
    [361, 2, 9, 121, 2, 'UK – June 2012 – C3 – Q2'],
    [363, 2, 7, 122, 1, 'IAL – Jan 2018 – C34 – Q3'],
    [365, 2, 11, 122, 2, 'UK – June 2006 – C3 – Q5']
  ]),
  S('2.10-newton-raphson', '2.10', 'Numerical Methods: Newton\u2013Raphson', 'P2.10', [
    [367, 2, 7, 123, 1, 'Madas – MP2 – Paper O – Q9'],
    [369, 2, 9, 123, 2, 'Madas – SYN – Paper L – Q5'],
    [371, 2, 10, 124, 1, 'Booklet label: Madas – SYN – Paper L – Q5'],
    [373, 2, 8, 124, 3, 'Madas – MP2 – Paper U – Q9']
  ]),
  S('2.11-substitution', '2.11', 'Integration: Substitution', 'P2.11', [
    [375, 2, 7, 126, 1, 'IAL – Jan 2017 – C34 – Q9'],
    [377, 2, 7, 126, 1, 'IAL – Jan 2019 – C34 – Q7'],
    [379, 2, 7, 126, 2, 'IAL – Jan 2015 – C34 – Q4'],
    [381, 2, 7, 127, 2, 'IAL – Nov 2018 – C34 – Q8']
  ]),
  S('2.11-by-parts', '2.11', 'Integration: By Parts', 'P2.11', [
    [383, 2, 6, 128, 1, 'UK – June 2008 – C4 – Q2'],
    [385, 2, 4, 128, 1, 'UK – Jan 2009 – C4 – Q6'],
    [387, 2, 9, 128, 2, 'IAL – Jan 2016 – C34 – Q8'],
    [389, 2, 5, 129, 2, 'IAL – Jan 2017 – C34 – Q5']
  ]),
  S('2.11-partial-fractions', '2.11', 'Integration: Partial Fractions', 'P2.11', [
    [391, 2, 7, 130, 2, 'IAL – Oct 2022 – P4 – Q2'],
    [393, 2, 7, 131, 1, 'IAL – Jan 2018 – C34 – Q5'],
    [395, 2, 9, 131, 2, 'Booklet label: IAL – Jan 2022 – P4 – Q4'],
    [397, 2, 8, 132, 2, 'Booklet label: IAL – Jan 2017 – C34 – Q8']
  ]),
  S('2.11-parametric', '2.11', 'Integration: Parametric', 'P2.11', [
    [399, 2, null, 133, 1, 'IAL – June 2016 – C34 – Q12'],
    [401, 2, null, 133, 2, 'IAL – Jan 2021 – P4 – Q9'],
    [403, 2, null, 134, 1, 'IAL – Jan 2022 (Unused) – P4 – Q9'],
    [405, 2, 12, 134, 3, 'UK – Jan 2006 – C4 – Q8']
  ]),
  S('2.11-trapezium-rule', '2.11', 'Integration: Trapezium Rule', 'P2.11', [
    [407, 2, 5, 136, 1, 'IAL – May 2018 – C12 – Q1'],
    [409, 2, 7, 136, 2, 'IAL – Jan 2015 – C12 – Q2'],
    [411, 2, 7, 137, 2, 'IAL – Jan 2020 – P2 – Q1'],
    [413, 2, 6, 138, 2, 'IAL – Jan 2024 – P2 – Q4']
  ]),
  S('2.11-differential-equations', '2.11', 'Integration: Differential Equations', 'P2.11', [
    [415, 2, 7, 139, 1, 'IAL – June 2019 – C34 – Q2'],
    [417, 2, 9, 139, 2, 'IAL – Oct 2020 – P4 – Q9'],
    [419, 2, 13, 140, 2, 'IAL – Nov 2018 – C34 – Q13'],
    [421, 2, 10, 141, 3, 'IAL – Jan 2019 – C34 – Q10']
  ]),
  S('2.12', '2.12', 'Vectors', 'P2.12', [
    [423, 2, 3, 143, 1, 'IAL – June 2021 – P4 – Q9'],
    [425, 2, 11, 143, 2, 'IAL – Jan 2017 – C34 – Q14'],
    [427, 2, 7, 144, 2, 'UK – Jan 2007 – C4 – Q7'],
    [429, 2, 11, 145, 2, 'IAL – June 2019 – C34 – Q12']
  ]),
];

export const BOOKLET_SECTION = new Map(BOOKLET.map((s) => [s.id, s]));
export const BOOKLET_QUESTION = new Map(BOOKLET.flatMap((s) => s.questions.map((q) => [q.id, q] as const)));
