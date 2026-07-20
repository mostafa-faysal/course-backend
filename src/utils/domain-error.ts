import { Response, NextFunction } from 'express';

export function handleDomainError(error: any, res: Response, next: NextFunction) {
  if (
    error.message === 'Course not found' || 
    error.message === 'Section not found' || 
    error.message === 'Lesson not found'
  ) {
    return res.status(404).json({ status: 'error', message: error.message });
  }
  if (error.message && error.message.startsWith('Forbidden')) {
    return res.status(403).json({ status: 'error', message: error.message });
  }
  if (error.message === 'Paid courses require purchase before enrollment') {
    return res.status(403).json({ status: 'error', message: error.message });
  }
  if (error.message && error.message.includes('already exists')) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
  if (error.message === 'Student is already enrolled in this course') {
    return res.status(400).json({ status: 'error', message: error.message });
  }
  next(error);
}
