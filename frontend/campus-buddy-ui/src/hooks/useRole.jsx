import { useAuth } from './useAuth';

export const useRole = () => {
  const { role } = useAuth();
  
  return {
    isFaculty: role === 'FACULTY',
    isStudent: role === 'STUDENT',
    role
  };
};
