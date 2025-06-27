
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfileSkeletonProps {
  type: 'greeting' | 'bmi' | 'full';
}

export const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({ type }) => {
  if (type === 'greeting') {
    return (
      <div className="flex items-center space-x-2">
        <span>Hello,</span>
        <Skeleton className="h-6 w-16 inline-block" />
      </div>
    );
  }

  if (type === 'bmi') {
    return (
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-12 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
          <Skeleton className="h-3 w-24 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
};
