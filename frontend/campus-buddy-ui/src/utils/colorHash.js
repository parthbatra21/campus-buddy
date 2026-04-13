const colors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export const getColorForCourse = (courseCode) => {
  if (!courseCode) return colors[0];
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getPastelColorForCourse = (courseCode) => {
  const color = getColorForCourse(courseCode);
  // Simple way to get a pastel version: wrap it in rgba or hex alpha
  return color + '20'; // 20 hex = ~12% opacity
};
