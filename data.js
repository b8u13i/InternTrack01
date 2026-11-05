/* data.js - skill vocabulary and fixed lists used across the app */

// canonical skill name -> other ways people write it
const SKILL_VOCAB = {
  'JavaScript': ['javascript', 'js', 'es6'],
  'TypeScript': ['typescript'],
  'React': ['react', 'reactjs', 'react.js'],
  'Node.js': ['node', 'nodejs', 'node.js', 'express'],
  'HTML/CSS': ['html', 'css', 'html5', 'css3', 'html/css'],
  'Responsive Design': ['responsive', 'mobile-first'],
  'Python': ['python'],
  'Java': ['java'],
  'C++': ['c++', 'cpp'],
  'SQL': ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite'],
  'MongoDB': ['mongodb', 'mongo'],
  'Git': ['git', 'github', 'gitlab'],
  'REST APIs': ['rest', 'restful', 'rest api', 'rest apis', 'apis'],
  'Data Structures': ['data structures', 'dsa', 'algorithms'],
  'Testing': ['testing', 'unit tests', 'unit testing', 'jest', 'selenium'],
  'Agile': ['agile', 'scrum'],
  'Problem Solving': ['problem solving', 'problem-solving'],
  'Machine Learning': ['machine learning', 'ml', 'scikit-learn', 'sklearn'],
  'Deep Learning': ['deep learning', 'tensorflow', 'pytorch', 'neural networks'],
  'Pandas': ['pandas'],
  'NumPy': ['numpy'],
  'Statistics': ['statistics', 'statistical'],
  'Data Visualization': ['data visualization', 'data visualisation', 'dashboards', 'charts'],
  'Excel': ['excel', 'spreadsheets'],
  'Tableau': ['tableau'],
  'Power BI': ['power bi', 'powerbi'],
  'Figma': ['figma'],
  'UI/UX Design': ['ui/ux', 'ui design', 'ux', 'wireframing', 'prototyping', 'user research'],
  'Docker': ['docker', 'containers'],
  'AWS': ['aws', 'ec2', 'amazon web services'],
  'CI/CD': ['ci/cd', 'github actions', 'jenkins'],
  'Linux': ['linux', 'bash', 'shell scripting'],
  'Flutter': ['flutter', 'dart'],
  'Android': ['android', 'kotlin'],
  'Communication': ['communication', 'presentation skills', 'presentations'],
  'Content Writing': ['content writing', 'copywriting', 'blogs'],
  'SEO': ['seo', 'search engine optimization'],
  'Digital Marketing': ['digital marketing', 'social media marketing', 'campaigns']
};

const CATEGORIES = ['Web Development', 'Data & AI', 'Mobile', 'Design', 'Cloud & DevOps', 'Business & Marketing'];
const STATUSES = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];

// one-line suggestions shown in the skill-gap page
const LEARN_HINTS = {
  'Node.js': 'Build a small REST API with Express and connect it to a database.',
  'REST APIs': 'Write a CRUD API and call it from a front end. Document the endpoints in the README.',
  'TypeScript': 'Convert one of your JavaScript projects to TypeScript, file by file.',
  'SQL': 'Practise joins and group-by on a real dataset. Aim for 30 queries.',
  'Docker': 'Containerise one of your projects and push the image.',
  'Data Structures': 'Solve 2 problems a day for a month, topic by topic.',
  'Testing': 'Add unit tests to an existing project and show the coverage in the README.',
  'Pandas': 'Clean a messy CSV and write up what you found.',
  'Figma': 'Redesign one screen of an app you use and share the frame.',
  'Git': 'Use branches and pull requests, even on solo projects.'
};

const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Management'];

// rough mapping from the free-text degree field to a department, used for placement statistics
function deptFromDegree(degree) {
  const d = (degree || '').toLowerCase();
  if (/ece|electronic|electrical/.test(d)) return 'Electronics';
  if (/bba|mba|management|commerce|b\.?com/.test(d)) return 'Management';
  if (/\bit\b|information tech|b\.?sc/.test(d)) return 'Information Technology';
  return 'Computer Science';
}
