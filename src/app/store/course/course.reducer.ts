import { createReducer, on } from '@ngrx/store';
import { Course } from '../../shared/models/course.model';
import { Enrollment } from '../../shared/models/enrollment.model';
import {
  loadCourses, loadCoursesSuccess, loadCoursesFailure,
  addCourse, updateCourse, deleteCourse,
  loadEnrollments, loadEnrollmentsSuccess, loadEnrollmentsFailure,
  enrollUser, enrollUserSuccess, enrollUserFailure,
  clearCourseError
} from './course.actions';

export interface CourseState {
  courses: Course[];
  enrollments: Enrollment[];
  error: string | null;
  message: string | null;
}

const initialState: CourseState = {
  courses: [],
  enrollments: [],
  error: null,
  message: null
};

export const courseReducer = createReducer(
  initialState,
  on(loadCourses, state => ({ ...state, error: null, message: null })),
  on(loadCoursesSuccess, (state, { courses }) => ({
    ...state,
    courses,
    error: null,
    message: null
  })),
  on(loadCoursesFailure, (state, { error }) => ({
    ...state,
    error,
    message: null
  })),
  on(addCourse, (state, { course }) => ({
    ...state,
    courses: [...state.courses, course],
    error: null,
    message: 'Course added successfully'
  })),
  on(updateCourse, (state, { course }) => ({
    ...state,
    courses: state.courses.map(c => c.id === course.id ? course : c),
    error: null,
    message: 'Course updated successfully'
  })),
  on(deleteCourse, (state, { courseId }) => ({
    ...state,
    courses: state.courses.filter(c => c.id !== courseId),
    error: null,
    message: 'Course deleted successfully'
  })),
  on(loadEnrollments, state => ({ ...state, error: null, message: null })),
  on(loadEnrollmentsSuccess, (state, { enrollments }) => ({
    ...state,
    enrollments,
    error: null,
    message: null
  })),
  on(loadEnrollmentsFailure, (state, { error }) => ({
    ...state,
    error,
    message: null
  })),
  on(enrollUser, state => ({ ...state, error: null, message: null })),
  on(enrollUserSuccess, (state, { enrollment }) => ({
    ...state,
    enrollments: [...state.enrollments.filter(e => e.courseId !== enrollment.courseId || e.username !== enrollment.username), enrollment],
    error: null,
    message: 'Enrolled successfully'
  })),
  on(enrollUserFailure, (state, { error }) => ({
    ...state,
    error: error.includes('duplicate') || error.includes('already enrolled') ? null : error,
    message: null
  })),
  on(clearCourseError, state => ({
    ...state,
    error: null,
    message: null
  }))
);