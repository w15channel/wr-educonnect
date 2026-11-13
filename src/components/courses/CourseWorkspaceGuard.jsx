import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { PORTAL_COURSES, canPrepareCourses } from '@/components/courses/portalCourses';

export default function CourseWorkspaceGuard({ children }) {
  const { session } = useCustomAuth();
  const course = PORTAL_COURSES.find(item => item.id === (session?.course || 'tcc'));
  if (!course || (!course.available && !canPrepareCourses(session))) return <Navigate to="/lobby" replace />;
  return children;
}